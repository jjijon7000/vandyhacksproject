# SentinelAI

An autonomous Security Operations Center (SOC) platform powered by Gemini AI, Snowflake, and MongoDB. SentinelAI ingests real-time security logs, detects anomalies, and uses AI to explain threats, identify root causes, and recommend actions — all from a single dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, Tailwind CSS, TypeScript |
| Backend | FastAPI (Python) |
| AI Reasoning | Google Gemini API |
| Data / Alerts | Snowflake |
| Incident Memory | MongoDB Atlas |
| Auth | Supabase |

---

## Features

- **Live Threat Alerts** — Pulls real-time alerts from Snowflake, falls back to MongoDB, then demo data
- **AI Analysis** — Gemini explains each incident: root cause, severity, and recommended action
- **Incident Memory** — MongoDB stores past incidents so Gemini can detect repeated attack patterns
- **Autonomous Response** — Execute, assign, or suppress alerts directly from the dashboard
- **Incident Chatbot** — Ask SentinelAI anything about a selected alert or general security questions
- **Supabase Auth** — Secure login and session management

---

## Project Structure

```
/
├── app/
│   ├── page.tsx          # Landing page
│   ├── login/            # Auth page
│   └── dashboard/        # Main SOC dashboard
├── components/           # UI components (BorderGlow, CountUp, Plasma, etc.)
├── lib/
│   ├── api.ts            # Frontend API calls to FastAPI
│   └── supabase.ts       # Supabase client
└── backend/
    ├── main.py           # FastAPI app + all routes
    ├── snowflake_service.py
    ├── mongo_service.py
    └── ai_intelligence/
        ├── analyzer.py   # Gemini incident analysis
        ├── chat_helper.py
        └── schemas.py
```

---

## Prerequisites

- Node.js 18+
- Python 3.10+
- A [Snowflake](https://snowflake.com) account with alert data
- A [MongoDB Atlas](https://mongodb.com/atlas) cluster
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)
- A [Supabase](https://supabase.com) project

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/jjijon7000/vandyhacksproject.git
cd sentinelai
```

### 2. Frontend setup

```bash
npm install
```

Create `.env.local` in the project root:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8001
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=db_name

SNOWFLAKE_USER=your_user
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_ACCOUNT=your_account
SNOWFLAKE_WAREHOUSE=your_warehouse
SNOWFLAKE_DATABASE=your_database
SNOWFLAKE_SCHEMA=your_schema
SNOWFLAKE_ROLE=your_role

GEMINI_API_KEY=your_gemini_api_key
```

---

## Running Locally

You need two terminals running simultaneously.

**Terminal 1 — Backend:**

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8001
```

**Terminal 2 — Frontend:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment

### Frontend → Vercel

1. Push your repo to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add your environment variables under **Settings → Environment Variables**:
   - `NEXT_PUBLIC_BACKEND_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-deploys on every push to `main`

### Backend → Railway

1. Push your repo to GitHub
2. Create a new project at [railway.app](https://railway.app) and connect your repo
3. Set the root directory to `/backend`
4. Add all backend environment variables under the **Variables** tab
5. Set the start command:

```bash
uvicorn main:app --host 0.0.0.0 --port 8001
```

6. Deploy — Railway auto-deploys on every push
7. After deploying the backend, update `NEXT_PUBLIC_BACKEND_URL` in Vercel to your Railway public URL.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/health/mongo` | MongoDB connection status |
| GET | `/snowflake/alerts` | Fetch live alerts from Snowflake |
| GET | `/incidents` | List all MongoDB incidents |
| POST | `/incidents` | Store a new incident |
| POST | `/analyze-incident` | Run Gemini AI analysis on an incident |
| POST | `/incident-chat` | Chat with SentinelAI about an incident |
| GET | `/memory-context` | Retrieve historical context for an event |
| GET | `/debug` | View loaded environment variables |

---

## License

MIT
