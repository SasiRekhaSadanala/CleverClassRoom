import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
try:
    response = requests.get(url)
    models = response.json()
    print("Available models:")
    for m in models.get("models", []):
        name = m.get("name")
        if "gemini" in name.lower():
            print(name)
except Exception as e:
    print("Error:", e)
