from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, JSON, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# Association table for student enrollment in classrooms
enrollments = Table(
    "enrollments",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("classroom_id", Integer, ForeignKey("classrooms.id"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    # Removed global role; permissions are now classroom-specific (creator = teacher)
    
    # Relationships
    classrooms_owned = relationship("Classroom", back_populates="teacher")
    classrooms_enrolled = relationship("Classroom", secondary=enrollments, back_populates="students")
    quiz_results = relationship("QuizResult", back_populates="user")
    topic_mastery = relationship("TopicMastery", back_populates="user")
    submissions = relationship("Submission", back_populates="student")

class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    join_code = Column(String, unique=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    teacher = relationship("User", back_populates="classrooms_owned")
    students = relationship("User", secondary=enrollments, back_populates="classrooms_enrolled")
    documents = relationship("Document", back_populates="classroom")
    assignments = relationship("Assignment", back_populates="classroom")
    notes = relationship("Note", back_populates="classroom")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    description = Column(String, nullable=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    classroom = relationship("Classroom", back_populates="documents")

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))
    title = Column(String, index=True)
    content = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    classroom = relationship("Classroom", back_populates="notes")

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))
    title = Column(String, index=True)
    description = Column(Text)
    rubric = Column(JSON) # Detailed scoring criteria
    created_at = Column(DateTime, default=datetime.utcnow)

    classroom = relationship("Classroom", back_populates="assignments")
    submissions = relationship("Submission", back_populates="assignment")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    file_path = Column(String)
    score = Column(Float, nullable=True)
    feedback = Column(JSON, nullable=True) # AI explained mistakes
    submitted_at = Column(DateTime, default=datetime.utcnow)

    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", back_populates="submissions")

class QuizResult(Base):
    __tablename__ = "quiz_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic = Column(String, index=True)
    score = Column(Float)
    total_questions = Column(Integer)
    difficulty = Column(String)
    details = Column(JSON)
    taken_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="quiz_results")

class TopicMastery(Base):
    __tablename__ = "topic_mastery"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    topic = Column(String, index=True)
    mastery_level = Column(Float, default=0.0)
    attempts = Column(Integer, default=0)
    
    user = relationship("User", back_populates="topic_mastery")
