import json
import os
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
import random

load_dotenv()

VECTOR_STORE_ROOT = "./faiss_store"

def get_llm():
    return ChatGoogleGenerativeAI(model="models/gemini-2.0-flash", temperature=0.7)

def get_embeddings():
    return GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

def generate_quiz(topic: str, classroom_id: int, difficulty: str = "medium", num_questions: int = 5):
    """Generates a structured quiz based on the retrieved context from classroom materials."""
    
    classroom_path = os.path.join(VECTOR_STORE_ROOT, f"class_{classroom_id}")
    if not os.path.exists(classroom_path):
        return []
        
    embeddings = get_embeddings()
    vectorstore = FAISS.load_local(classroom_path, embeddings, allow_dangerous_deserialization=True)
    
    # Search for context related to the topic
    docs = vectorstore.similarity_search(topic, k=8)
    context = "\n\n".join([doc.page_content for doc in docs])
    
    if not context.strip():
        return "TOPIC_NOT_FOUND"
        
    llm = get_llm()
    
    system_prompt = (
        "You are an expert academic tutor. Generate a quiz based STRICTLY on the provided context from a professor's lecture notes.\n\n"
        "Topic: {topic}\n"
        "Difficulty: {difficulty}\n"
        "Generate exactly {num_questions} questions.\n\n"
        "Context:\n{context}\n\n"
        "STRICT RULE 1: If the provided Context does NOT contain information about the Topic, return ONLY the string \"TOPIC_NOT_FOUND\".\n"
        "STRICT RULE 2: Do NOT use outside knowledge.\n"
        "STRICT RULE 3: Provide your response STRICTLY as a JSON array of objects. No markdown.\n"
        "Each object format:\n"
        "{{\n"
        "  \"question\": \"...\",\n"
        "  \"options\": [\"...\", \"...\", \"...\", \"...\"],\n"
        "  \"answer\": \"exact matching string\",\n"
        "  \"explanation\": \"...\"\n"
        "}}"
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "Generate the quiz now.")
    ])
    
    chain = prompt | llm
    
    try:
        response = chain.invoke({
            "topic": topic, 
            "difficulty": difficulty, 
            "num_questions": num_questions,
            "context": context
        })
        content = response.content.strip()
        
        if "TOPIC_NOT_FOUND" in content:
            return "TOPIC_NOT_FOUND"
            
        if content.startswith("```json"):
            content = content.replace("```json", "").replace("```", "").strip()
        elif content.startswith("```"):
            content = content.replace("```", "").strip()
            
        return json.loads(content)
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            print("Quiz generation failed: Quota Exceeded (429)")
            return [{"question": "AI Quota Exceeded", "options": ["Please try again in 60 seconds", "Wait for quota reset", "Check API limits", "Contact Admin"], "answer": "Please try again in 60 seconds", "explanation": "The Google Gemini API is currently rate-limited on the free tier."}]
        print(f"Error generating quiz: {e}")
        return []

def evaluate_quiz(submitted_answers: list, correct_quiz_data: list):
    """Evaluates the submitted answers against the original quiz."""
    correct_count = 0
    results = []
    
    for i, submitted in enumerate(submitted_answers):
        if i >= len(correct_quiz_data): break
        original = correct_quiz_data[i]
        is_correct = submitted.get("answer") == original.get("answer")
        if is_correct:
            correct_count += 1
            
        results.append({
            "question": original["question"],
            "submitted": submitted.get("answer"),
            "correct": original["answer"],
            "is_correct": is_correct,
            "explanation": original["explanation"]
        })
        
    score = (correct_count / len(correct_quiz_data)) * 100 if correct_quiz_data else 0
    
    return {
        "score": score,
        "correct_count": correct_count,
        "total": len(correct_quiz_data),
        "results": results
    }
