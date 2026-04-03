### disclaimer: vibecoded slop

# pv260-dashboard

Visualization tool for PV260 seminar points. Displays student scores collected from IS MUNI as charts and tables.

**Stack:** React + Recharts (frontend), Express + SQLite (backend), served as a single Node.js app.

## Run with Docker (recommended)

```bash
docker compose up --build
```

App is available at http://localhost:3001.

Data is persisted in a named Docker volume (`db-data`).

## Build Docker image manually

```bash
docker build -t pv260-dashboard .
docker run -p 3001:3001 -v pv260-data:/data pv260-dashboard
```

## Run locally (development)

**Backend:**

```bash
cd src/backend
npm install
node index.js
```

Backend runs on http://localhost:3001.

**Frontend (dev server with HMR):**

```bash
cd src/frontend
npm install
npm run dev
```

Frontend dev server runs on http://localhost:5173 and proxies API requests to the backend.

## Run tests

```bash
cd src/backend
npm test
```
