from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import os
import shutil
import threading
from pydantic import BaseModel
import models
import database
from services import rag_service as rag
from services import quiz_service as quiz
from services import auth_service as auth
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt

# Create DB tables
# REMOVE AFTER FIRST RUN
models.Base.metadata.drop_all(bind=database.engine)
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="AI Student Mentor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "./uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    payload = auth.decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class ClassroomCreate(BaseModel):
    name: str

class ClassroomJoin(BaseModel):
    join_code: str

class AssignmentCreate(BaseModel):
    classroom_id: int
    title: str
    description: str
    rubric: Dict[str, Any]

class ChatRequest(BaseModel):
    message: str
    classroom_id: int

class QuizRequest(BaseModel):
    topic: str
    classroom_id: int
    difficulty: str = "medium"
    num_questions: int = 10

class QuizSubmitRequest(BaseModel):
    topic: str
    classroom_id: int
    difficulty: str
    submitted_answers: List[Dict[str, Any]]
    original_quiz: List[Dict[str, Any]]

class NoteCreate(BaseModel):
    title: str
    content: str

@app.get("/")
def read_root():
    return {"status": "ok", "message": "AI Mentor backend is running"}

@app.post("/api/auth/register")
def register(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = auth.get_password_hash(user.password)
    new_user = models.User(
        name=user.name, 
        email=user.email, 
        hashed_password=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully"}

@app.post("/api/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": user.email})
    # Return user ID so frontend can compare with classroom teacher_id
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "name": user.name,
        "user_id": user.id
    }

@app.get("/api/classrooms")
def get_classrooms(user: models.User = Depends(get_current_user)):
    # Return both classes created by user and classes they joined
    all_rooms = user.classrooms_owned + user.classrooms_enrolled
    return all_rooms

import random
import string

def generate_join_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

@app.post("/api/classrooms")
def create_classroom(room: ClassroomCreate, user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    code = generate_join_code()
    # Ensure unique
    while db.query(models.Classroom).filter(models.Classroom.join_code == code).first():
        code = generate_join_code()
        
    new_room = models.Classroom(name=room.name, join_code=code, teacher_id=user.id)
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

@app.post("/api/classrooms/join")
def join_classroom(join: ClassroomJoin, user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    room = db.query(models.Classroom).filter(models.Classroom.join_code == join.join_code).first()
    if not room:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # Can't join own room as student
    if room.teacher_id == user.id:
        raise HTTPException(status_code=400, detail="You are the teacher of this classroom")

    if room in user.classrooms_enrolled:
        return {"message": "Already enrolled"}
        
    user.classrooms_enrolled.append(room)
    db.commit()
    return {"message": f"Successfully joined {room.name}"}

@app.get("/api/classrooms/{id}")
def get_classroom_details(id: int, user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    room = db.query(models.Classroom).filter(models.Classroom.id == id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # Check if user is member
    is_teacher = room.teacher_id == user.id
    is_student = room in user.classrooms_enrolled
    
    if not (is_teacher or is_student):
        raise HTTPException(status_code=403, detail="Not a member of this classroom")
        
    return {
        "id": room.id,
        "name": room.name,
        "teacher_id": room.teacher_id,
        "teacher_name": room.teacher.name if room.teacher else "Unknown",
        "join_code": room.join_code,
        "documents": room.documents,
        "assignments": [{"id": a.id, "title": a.title} for a in room.assignments],
        "is_teacher": is_teacher,
        "students": [{"id": s.id, "name": s.name} for s in room.students]
    }

@app.get("/api/classrooms/{classroom_id}/leaderboard")
def get_leaderboard(classroom_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    room = db.query(models.Classroom).filter(models.Classroom.id == classroom_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Classroom not found")
        
    # Anyone in the room can see the leaderboard
    if not (room.teacher_id == user.id or room in user.classrooms_enrolled):
        raise HTTPException(status_code=403, detail="Not a member of this classroom")
        
    leaderboard = []
    for student in room.students:
        submissions = db.query(models.Submission).filter(
            models.Submission.student_id == student.id,
            models.Submission.assignment_id.in_([a.id for a in room.assignments])
        ).all()
        
        avg_score = sum(s.score for s in submissions) / len(submissions) if submissions else 0
        
        leaderboard.append({
            "user_id": student.id,
            "user_name": student.name,
            "total_score": round(avg_score, 1),
            "assignments_done": len(submissions),
            "quizzes_taken": 0 # TODO: add quiz stats if needed
        })
        
    # Sort by score desc
    leaderboard.sort(key=lambda x: x["total_score"], reverse=True)
    return {"leaderboard": leaderboard}

@app.post("/api/upload")
def upload_document(
    classroom_id: int = Form(...),
    file: UploadFile = File(...), 
    description: str = Form(""), 
    user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    # Check permissions
    room = db.query(models.Classroom).filter(models.Classroom.id == classroom_id).first()
    if not room or room.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="Only the classroom teacher can upload materials")

    if not (file.filename.endswith('.pdf') or file.filename.endswith('.pptx') or file.filename.endswith('.ppt')):
        raise HTTPException(status_code=400, detail="Only PDF and PPTX files are supported")
        
    file_path = os.path.join(UPLOAD_DIR, f"room_{classroom_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Index with classroom namespace
    threading.Thread(target=rag.process_and_index_pdf, args=(file_path, classroom_id)).start()
        
    db_doc = models.Document(filename=file.filename, description=description, classroom_id=classroom_id)
    db.add(db_doc)
    db.commit()
    
    return {"message": f"Successfully queued {file.filename} for indexing in {room.name}."}

@app.post("/api/chat")
def chat_endpoint(req: ChatRequest, user: models.User = Depends(get_current_user)):
    try:
        answer = rag.get_answer(req.message, req.classroom_id)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quiz/generate")
def generate_quiz(req: QuizRequest, user: models.User = Depends(get_current_user)):
    # Students can generate quizzes based on classroom materials
    quiz_data = quiz.generate_quiz(req.topic, req.classroom_id, req.difficulty, req.num_questions)
    if quiz_data == "TOPIC_NOT_FOUND":
        return {"error": "TOPIC_NOT_FOUND"}
    if not quiz_data:
        raise HTTPException(status_code=500, detail="Failed to generate quiz")
    return {"quiz": quiz_data}

@app.post("/api/quiz/submit")
def submit_quiz(req: QuizSubmitRequest, user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    result = quiz.evaluate_quiz(req.submitted_answers, req.original_quiz)
    
    # Save result
    quiz_result = models.QuizResult(
        user_id=user.id,
        topic=req.topic,
        score=result["score"],
        total_questions=result["total"],
        difficulty=req.difficulty,
        details=result["results"]
    )
    db.add(quiz_result)
    
    # Update topic mastery
    mastery = db.query(models.TopicMastery).filter(
        models.TopicMastery.user_id == user.id,
        models.TopicMastery.topic == req.topic
    ).first()
    
    if not mastery:
        mastery = models.TopicMastery(user_id=user.id, topic=req.topic, mastery_level=result["score"]/100, attempts=1)
        db.add(mastery)
    else:
        # Moving average for mastery
        mastery.mastery_level = ((mastery.mastery_level * mastery.attempts) + (result["score"]/100)) / (mastery.attempts + 1)
        mastery.attempts += 1
        
    db.commit()
    return result

@app.post("/api/assignments")
def create_assignment(req: AssignmentCreate, user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    room = db.query(models.Classroom).filter(models.Classroom.id == req.classroom_id).first()
    if not room or room.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="Only the teacher can create assignments")
    
    new_assignment = models.Assignment(
        classroom_id=req.classroom_id,
        title=req.title,
        description=req.description,
        rubric=req.rubric
    )
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    return new_assignment

from services import assignment_service

@app.post("/api/assignments/{assignment_id}/submit")
async def submit_assignment(
    assignment_id: int, 
    file: UploadFile = File(...), 
    user: models.User = Depends(get_current_user), 
    db: Session = Depends(database.get_db)
):
    assignment = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF submissions are supported")

    file_path = os.path.join(UPLOAD_DIR, f"sub_{user.id}_{assignment_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # AI Evaluation based on rubric
    eval_result = assignment_service.evaluate_submission(file_path, assignment.description, assignment.rubric)
    
    new_submission = models.Submission(
        assignment_id=assignment_id,
        student_id=user.id,
        file_path=file_path,
        score=eval_result["score"],
        feedback=eval_result["feedback"]
    )
    db.add(new_submission)
    db.commit()
    
    # Get class highest
    highest = db.query(models.Submission).filter(models.Submission.assignment_id == assignment_id).order_by(models.Submission.score.desc()).first()
    
    return {
        "score": eval_result["score"],
        "feedback": eval_result["feedback"],
        "class_highest": highest.score if highest else eval_result["score"]
    }

@app.get("/api/classrooms/{classroom_id}/assignments/{assignment_id}/submissions")
def get_assignment_submissions(
    classroom_id: int, 
    assignment_id: int, 
    user: models.User = Depends(get_current_user), 
    db: Session = Depends(database.get_db)
):
    room = db.query(models.Classroom).filter(models.Classroom.id == classroom_id).first()
    if not room or room.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="Only the teacher can view all submissions")
        
    submissions = db.query(models.Submission).filter(models.Submission.assignment_id == assignment_id).all()
    
    result = []
    for s in submissions:
        result.append({
            "student_name": s.student.name if s.student else "Unknown",
            "score": s.score,
            "submitted_at": s.submitted_at,
            "feedback": s.feedback
        })
    
    # Sort by score descending
    result.sort(key=lambda x: x["score"] if x["score"] is not None else -1, reverse=True)
    return result

@app.get("/api/classrooms/{classroom_id}/my-submissions")
def get_my_submissions(
    classroom_id: int, 
    user: models.User = Depends(get_current_user), 
    db: Session = Depends(database.get_db)
):
    submissions = db.query(models.Submission).join(models.Assignment).filter(
        models.Assignment.classroom_id == classroom_id,
        models.Submission.student_id == user.id
    ).all()
    
    return [{
        "assignment_id": s.assignment_id,
        "assignment_title": s.assignment.title,
        "score": s.score,
        "feedback": s.feedback,
        "submitted_at": s.submitted_at
    } for s in submissions]

@app.get("/api/classrooms/{classroom_id}/notes")
def get_notes(
    classroom_id: int, 
    user: models.User = Depends(get_current_user), 
    db: Session = Depends(database.get_db)
):
    room = db.query(models.Classroom).filter(models.Classroom.id == classroom_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Classroom not found")
        
    # Check membership
    is_teacher = room.teacher_id == user.id
    is_student = room in user.classrooms_enrolled
    if not (is_teacher or is_student):
        raise HTTPException(status_code=403, detail="Not a member")
        
    return room.notes

@app.post("/api/classrooms/{classroom_id}/notes")
def create_note(
    classroom_id: int, 
    note_req: NoteCreate, 
    user: models.User = Depends(get_current_user), 
    db: Session = Depends(database.get_db)
):
    room = db.query(models.Classroom).filter(models.Classroom.id == classroom_id).first()
    if not room or room.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="Only teachers can add notes")
        
    new_note = models.Note(
        classroom_id=classroom_id,
        title=note_req.title,
        content=note_req.content,
        created_by=user.id
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

@app.get("/api/classrooms/{classroom_id}/leaderboard")
def get_classroom_leaderboard(classroom_id: int, db: Session = Depends(database.get_db)):
    room = db.query(models.Classroom).filter(models.Classroom.id == classroom_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Classroom not found")
        
    leaderboard = []
    for student in room.students:
        masteries = db.query(models.TopicMastery).filter(models.TopicMastery.user_id == student.id).all()
        quizzes = db.query(models.QuizResult).filter(models.QuizResult.user_id == student.id).all()
        submissions = db.query(models.Submission).join(models.Assignment).filter(
            models.Assignment.classroom_id == classroom_id,
            models.Submission.student_id == student.id
        ).all()
        
        mastery_points = sum([m.mastery_level * 100 for m in masteries])
        quiz_points = len(quizzes) * 10
        assignment_points = sum([s.score for s in submissions if s.score])
        
        total_score = int(mastery_points + quiz_points + assignment_points)
        
        leaderboard.append({
            "user_id": student.id,
            "user_name": student.name,
            "total_score": total_score,
            "quizzes_taken": len(quizzes),
            "assignments_done": len(submissions)
        })
        
    leaderboard.sort(key=lambda x: x["total_score"], reverse=True)
    return {"leaderboard": leaderboard}

@app.get("/api/dashboard/{user_id}")
async def get_dashboard(user_id: int, db: Session = Depends(database.get_db)):
    # Get user details
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    quizzes = db.query(models.QuizResult).filter(models.QuizResult.user_id == user_id).order_by(models.QuizResult.taken_at.desc()).limit(5).all()
    mastery = db.query(models.TopicMastery).filter(models.TopicMastery.user_id == user_id).all()
    documents = db.query(models.Document).all()
    
    # Weak topics (< 60%)
    weak_topics = [m.topic for m in mastery if m.mastery_level < 0.6]
    
    return {
        "user_name": user.name,
        "recent_quizzes": [{"topic": q.topic, "score": q.score, "date": q.taken_at} for q in quizzes],
        "topic_mastery": [{"topic": m.topic, "mastery": m.mastery_level * 100} for m in mastery],
        "weak_topics": weak_topics,
        "documents": [d.filename for d in documents]
    }
