import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
try:
    response = requests.get(url)
    models = response.json()
    with open("available_models.txt", "w") as f:
        f.write("Available models:\n")
        for m in models.get("models", []):
            name = m.get("name")
            if "gemini" in name.lower():
                f.write(name + "\n")
except Exception as e:
    with open("available_models.txt", "w") as f:
        f.write("Error: " + str(e))
