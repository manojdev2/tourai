# Zeezo - AI Trip Planner (FastAPI + Next.js)

## Structure
- backend/ → FastAPI server with Google Generative AI
- frontend/ → Next.js + Leaflet UI

## Run Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Run Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000  
Backend: http://localhost:8000
