import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()

def get_llm():
    return ChatGoogleGenerativeAI(model="models/gemini-2.0-flash", temperature=0)

def evaluate_submission(file_path: str, assignment_description: str, rubric: dict):
    """Evaluates a student's PDF submission against an assignment rubric using AI."""
    
    # Load student text
    loader = PyPDFLoader(file_path)
    docs = loader.load()
    student_work = "\n".join([doc.page_content for doc in docs])
    
    llm = get_llm()
    
    system_prompt = (
        "You are a kind and professional professor. Grade the following student submission based on the provided assignment "
        "description and rubric. \n\n"
        "Assignment Description:\n{assignment_description}\n\n"
        "Rubric:\n{rubric_json}\n\n"
        "Provide a score (out of 100) and a supportive, detailed feedback object. "
        "Your tone should be warm, encouraging, and academic.\n\n"
        "STRICT: Response must be raw JSON with this exact structure:\n"
        "{{\n"
        "  \"score\": 85,\n"
        "  \"feedback\": {{\n"
        "    \"overall\": \"A brief, warm summary of the professor's thoughts...\",\n"
        "    \"strengths\": [\"Point 1\", \"Point 2\"],\n"
        "    \"improvements\": [\"Specific area 1\", \"Specific area 2\"],\n"
        "    \"suggestions\": [\"Practical tip 1\", \"Practical tip 2\"]\n"
        "  }}\n"
        "}}"
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "Student Submission Content:\n\n{student_work}")
    ])
    
    chain = prompt | llm
    
    try:
        response = chain.invoke({
            "assignment_description": assignment_description,
            "rubric_json": json.dumps(rubric),
            "student_work": student_work
        })
        
        content = response.content.strip()
        if content.startswith("```json"):
            content = content.replace("```json", "").replace("```", "").strip()
        elif content.startswith("```"):
            content = content.replace("```", "").strip()
            
        return json.loads(content)
    except Exception as e:
        print(f"Error evaluating assignment: {e}")
        return {
            "score": 0,
            "feedback": {"error": "AI Evaluation failed. Please check the submission format."}
        }
