# SentinelAI FastAPI backend for Vercel

This backend is now configured for Vercel deployment.

## Key setup:
- FastAPI app instance is named `app` in `backend/main.py`.
- `pyproject.toml` points to the app entrypoint.
- `vercel.json` routes `/api/*` to the FastAPI backend.
- All dependencies are in `backend/requirements.txt`.
- Static assets are in `public/`.

## Local development
```
cd backend
python -m venv .venv
.venv\Scripts\activate  # or source .venv/bin/activate on Mac/Linux
pip install -r requirements.txt
vercel dev
```

## Deploy
```
vercel deploy
```

See https://vercel.com/docs/frameworks/backend/fastapi for more details.
