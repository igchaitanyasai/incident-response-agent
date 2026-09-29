# Intelligent Incident Response Agent with Persistent Hindsight Memory

An AI-powered Investigation Assistant that helps engineering and DevOps teams investigate, analyze, and resolve recurring application incidents using structured log evidence and **Hindsight Persistent Memory**.

---

## 🌟 Key Architecture & Capabilities

1. **Structured Incident Detection & Log Ingestion**:
   - Parses multi-line stack traces, Syslog, Spring/Log4j, and structured JSON logs.
   - **Secret & Credential Masking**: Automatically redacts database passwords (`postgresql://user:pass@host`), JWT tokens, AWS access keys, and Bearer authorization headers before storage or LLM processing.
   - **Severity Evaluator**: Automatically assigns initial incident severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).

2. **AI Investigation & Evidence-Backed Reasoning**:
   - Formulates probabilistic root cause hypotheses supported by explicit log evidence lines and unverified assumptions.
   - Clearly distinguishes between **unverified AI hypotheses** and **confirmed engineer root causes**.
   - Identifies missing log diagnostic data requests when evidence is incomplete.

3. **Hindsight Persistent Memory Integration**:
   - Retains confirmed root causes, environmental symptoms, failed attempts, and verified resolutions.
   - Performs **selective contextual retrieval** using composite weighted vector + pattern matching ($35\%$ Error pattern, $40\%$ Symptom overlap, $15\%$ Service layer, $10\%$ Historical success score).
   - Evolves memory nodes when engineers provide feedback, preserving uncertainty if findings are mixed.

4. **Human-in-the-Loop Operational Guardrails**:
   - Action classification: `SAFE` (diagnostic telemetry) vs `HIGH_IMPACT` (destructive/remediation ops).
   - `HIGH_IMPACT` operations generate an authorization ticket requiring explicit human engineer approval before execution.

5. **React 18 + TypeScript Control Dashboard**:
   - Real-time incident list, structured log viewer with stack trace expansion, AI evidence cards, Hindsight memory diff, interactive action execution console, engineer resolution feedback modal, and Hindsight Memory explorer.

---

## 🚀 Quick Start Guide

### Option 1: One-Command Docker Deployment (Recommended)

Make sure Docker and Docker Compose are installed:

```bash
docker-compose up --build
```

Access the services:
- **Frontend Dashboard**: `http://localhost:3000`
- **FastAPI Backend API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`

---

### Option 2: Local Standalone Development

#### Backend Setup:

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Frontend Setup:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` or `http://localhost:5173` in your browser.

---

## 🧪 Running Automated Tests

Run backend unit tests for log parsing, secret redaction, Hindsight Memory search, and guardrailed action execution:

```bash
cd backend
python -m pytest
```

To verify frontend TypeScript compilation & build:

```bash
cd frontend
npm run build
```

---

## 🎬 Demonstrating Hindsight Memory Recall (Evaluation Walkthrough)

The application includes a built-in **Interactive Demo Tour** accessible via the top navigation bar or the "Simulate Incident" menu:

### Step 1: Ingest First-Time Database Timeout Incident
1. Click **Simulate Incident** -> Select **1. DB Timeout (First Time)**.
2. An incident is created on `payment-service` with `CRITICAL` severity due to `HikariPool$PoolInitializationException`.
3. Click **Run AI Investigation**. Notice that Hindsight Memory reports **No prior precedent found**.
4. Click **Resolve & Store Memory**. Enter confirmed root cause: `"HikariCP pool size exhausted due to connection leaks in payment repository"` and verified fix: `"Increased max connections to 200"`.
5. Click **Commit to Hindsight Memory**. Findings are saved to the persistent memory bank!

### Step 2: Ingest Recurring Incident on Another Service
1. Click **Simulate Incident** -> Select **2. DB Timeout (Recurring Memory)**.
2. A new incident occurs on `order-service` with similar symptoms.
3. Click **Run AI Investigation**.
4. **Hindsight Memory Recall activates with a ~95% similarity match!** The AI Agent presents the confirmed root cause and proven resolution from Step 1!

---

## 🛠️ Tech Stack Summary

- **Backend**: Python 3.12, FastAPI, SQLAlchemy, Pydantic v2, Pytest
- **AI Agent**: Google Gemini API (`google-generativeai`) with built-in Expert Fallback Engine
- **Memory Layer**: Hindsight Memory Composite Retrieval & Evolution Engine
- **Database**: PostgreSQL / SQLite
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Deployment**: Docker, docker-compose, Nginx
