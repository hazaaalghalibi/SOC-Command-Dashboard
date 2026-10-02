# SOC dashboard: database and API setup

This project has:

- **Frontend:** React + Vite (port **5173** by default)
- **Backend:** Node.js + Express (port **4000** by default)
- **Database:** **SQLite** file at `server/prisma/dev.db` (via Prisma ORM)

The UI talks to the API using **`/api/...`**. In development, Vite **proxies** `/api` to `http://127.0.0.1:4000`, so you do not need CORS configuration for localhost.

---

## Step-by-step: create the database (first time)

These commands run from a terminal in the **project root** (`d:\SOC dashboard`).  
You need **Node.js + npm** (or use `Start-Dashboard.ps1`, which can install portable Node).

### 1) Install dependencies

```powershell
cd "d:\SOC dashboard"
npm install
npm install --prefix server
```

`postinstall` in `server` runs `prisma generate` so the Prisma Client is ready.

### 2) Create the SQLite database and tables

If you upgraded from an older schema (e.g. `ActivityLog` → `Activity`, new `User` / `Log` / `Incident` models), **delete** `server/prisma/dev.db` first, then push.

From the **server** folder context:

```powershell
npm run db:push --prefix server
```

This reads `server/prisma/schema.prisma` and creates / updates **`server/prisma/dev.db`**.

The connection string is in **`server/.env`**:

```env
DATABASE_URL="file:./prisma/dev.db"
```

### 3) Seed sample SOC data

```powershell
npm run db:seed --prefix server
```

This fills **alerts**, **activity** rows, and **metric** counters.

### 4) One-liner (push + seed)

```powershell
npm run db:setup --prefix server
```

### 5) (Optional) Inspect data

```powershell
npm run db:studio --prefix server
```

Opens Prisma Studio in the browser to browse tables.

---

## API overview (v2)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health check |
| GET | `/api/metrics` | Dashboard summary + metric counters + analytics bundle |
| GET | `/api/summary` | Summary only (legacy; prefer `/api/metrics`) |
| GET | `/api/analytics` | Chart aggregates |
| GET | `/api/alerts` | Alerts (query: `severity`, `status`, `eventType`, `sourceIp`, `from`, `to`) |
| GET | `/api/incidents` | All incidents |
| GET | `/api/incidents/:id` | Incident detail |
| PATCH | `/api/incidents/:id/status` | Body: `{ "status": "..." }` |
| GET | `/api/activity` | Activity feed |
| POST | `/api/logs/upload` | Body: `{ "logs": [ { sourceIp, message, ... } ] }` |
| POST | `/api/detection/run` | Run rule engine on stored logs |
| POST | `/api/tick/live` | Simulated live tick (dev) |
| POST | `/api/tick/ingest` | Simulated ingest tick (dev) |

---

## Run the full stack (UI + API)

### Option A — launcher (Windows)

Double-click **`START DASHBOARD.bat`**.  
It installs deps if needed, runs **`db:setup`** when `dev.db` is missing, then starts **`npm run dev:full`** (Vite + API together).

### Option B — two terminals

**Terminal 1 — API**

```powershell
cd "d:\SOC dashboard\server"
npm run dev
```

**Terminal 2 — UI**

```powershell
cd "d:\SOC dashboard"
npm run dev
```

### Option C — one terminal (root)

```powershell
cd "d:\SOC dashboard"
npm run dev:full
```

Open **http://127.0.0.1:5173/**. The header should show **“API + DB”** when `/api/health` succeeds.

---

## Production build notes

- Run `npm run build` in the root for the static UI (`dist/`).
- Build the API with `npm run build --prefix server` and start with `npm start --prefix server` (set `NODE_ENV=production` and serve `dist` behind your gateway or add static middleware — not configured by default).

---

## Using PostgreSQL instead of SQLite (optional)

1. Install PostgreSQL and create a database and user.
2. Change **`server/.env`**:

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/soc_dashboard?schema=public"
   ```

3. In `server/prisma/schema.prisma`, change:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

4. Run:

   ```powershell
   npm run db:push --prefix server
   npm run db:seed --prefix server
   ```

---

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| UI shows **“Browser demo”** | API not running or `/api/health` failing. Start `server` (`npm run dev --prefix server`) and ensure port **4000** is free. |
| **ERR_CONNECTION_REFUSED** on :5173 | Vite not running; keep the terminal open. |
| Prisma errors about **schema** | Run `npm run db:push --prefix server` after changing `schema.prisma`. |
| **Port 4000 in use** | Stop the other process or set `PORT=4001` in `server/.env` and adjust Vite `proxy.target` in `vite.config.ts` to match. |
