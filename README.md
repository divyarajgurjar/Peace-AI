# Welcome to Peace-AI app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

# 🧠 Peace - PDF QA System with FastAPI

A simple FastAPI-based  front-end backend code for uploading PDF files and asking questions based on their content using transformer models.

---

## 1. Set Up Environment - Backend

Open a terminal in the project directory.

Create and activate a virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install fastapi uvicorn python-dotenv faiss-cpu sentence-transformers requests pymupdf transformers tiktoken
pip install -r requirements.txt
GROQ_API_KEY=your_actual_groq_key_here
uvicorn main:app --reload
```
## 2. Set Up Environment - FrontEND
Install React and Expo
```bash
npx expo start
```
Then choose your platform to run.
