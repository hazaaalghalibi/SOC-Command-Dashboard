\# SOC Command — Security Operations Dashboard



A full-stack web application that demonstrates common Security Operations Center (SOC) workflows in one dashboard. It includes alerts, incidents, log ingestion, example detections, analyst activity, and CSV reports.



> This project uses synthetic demo data. It is for learning and demonstration, not a production SIEM.



\## Features



| Area | Features |

|---|---|

| Dashboard | Summary cards, analytics charts, activity feed, recent alerts, and incidents |

| Alerts | Filterable alert queue with severity, status, and MITRE ATT\&CK fields |

| Incidents | Case details, status updates, notes, assignees, and incident timeline |

| Log ingestion | Upload structured logs into the local SQLite database |

| Log search | Search logs stored in the project's database |

| Detection | Run example rules against stored logs: brute-force patterns, after-hours logins, repeated admin access, and SQL injection indicators |

| Reports | Download alerts and incidents as CSV files |

| Threat intelligence | Maintain a browser-local watchlist for IPs, domains, and hashes |

| Settings | Save analyst preferences in the current browser |

| Simulation | Generate sample activity for demonstrations and UI testing |

| Authentication | JWT login with admin, analyst, and viewer demo roles |

| Audit and notifications | Review analyst activity and manage in-app notifications |



\## Screenshots



\### Dashboard



!\[SOC Dashboard](screenshots/dashboard.png)



\### Incidents



!\[Incident Management](screenshots/incidents.png)



\## Current limitations



\- The application is not connected to Wazuh, Elasticsearch, or another live SIEM.

\- The IOC watchlist is stored in the browser and does not check reputation against external threat feeds.

\- Settings are stored in the browser. Refresh and notification preferences are not connected to system-wide behavior.

\- Detection rules use basic heuristics and require further testing and tuning before real operational use.

\- Demo accounts and sample data are for local demonstrations only.



\## Technology stack



\### Frontend



\- React 18 and TypeScript

\- Vite 5

\- Tailwind CSS

\- Recharts

\- React Router

\- Lucide React



\### Backend



\- Node.js and Express

\- Prisma ORM

\- SQLite

\- bcryptjs

\- jsonwebtoken



During development, Vite proxies `/api` requests to the Express API on port `4000`.



\## Architecture



```mermaid

flowchart LR

&#x20; Browser\["Browser: React + Vite"] -->|" /api proxy "| API\["Express API"]

&#x20; API --> Prisma\["Prisma Client"]

&#x20; Prisma --> DB\[("SQLite database")]

```



\## Requirements



\- Node.js 20 or later

\- npm



\## Run locally



Run the following commands from the repository root.



\### 1. Install dependencies



```bash

npm install

npm install --prefix server

```



\### 2. Set up the demo database



```bash

npm run db:setup --prefix server

```



This creates the local database and seeds demo users and sample data.



For more database details, see \[SOC\_DATABASE\_SETUP.md](SOC\_DATABASE\_SETUP.md).



\### 3. Start the application



```bash

npm run dev:full

```



Open the URL printed by Vite. The default is:



```text

http://localhost:5173

```



On Windows, you can also use `START DASHBOARD.bat` if it is included in the repository.



\## Demo accounts



After setting up the database, use one of these local demo accounts:



| Role | Email | Password |

|---|---|---|

| Analyst | `analyst@soc.local` | `socdemo2026` |

| Admin | `admin@soc.local` | `socdemo2026` |

| Viewer | `viewer@soc.local` | `socdemo2026` |



These credentials are for the local demo database only. Do not use them in a production deployment.



\## Default ports



| Service | Port |

|---|---:|

| Vite frontend | `5173` |

| Express API | `4000` |



If a port is already in use, Vite may start on another port and print the new URL in the terminal.



\## Useful commands



| Command | Purpose |

|---|---|

| `npm run dev:full` | Start the frontend and API |

| `npm run dev` | Start the frontend only |

| `npm run dev --prefix server` | Start the API only |

| `npm run build` | Build the frontend |

| `npm run build --prefix server` | Build the API |

| `npm run db:setup --prefix server` | Create and seed the demo database |

| `npm run db:studio --prefix server` | Open Prisma Studio |



\## Repository structure



```text

src/                  React frontend

server/prisma/        Prisma schema and seed data

server/src/           Express API, controllers, services, middleware

scripts/               Development scripts

SOC\_DATABASE\_SETUP.md  Database setup notes

screenshots/           Project screenshots

```



\## API overview



Except for `GET /api/health` and `POST /api/auth/login`, API routes require authentication.



| Area | Example endpoints |

|---|---|

| Dashboard | `GET /api/dashboard`, `GET /api/metrics`, `GET /api/analytics` |

| Logs | `GET /api/logs`, `POST /api/logs/upload` |

| Detection | `POST /api/detection/run` |

| Alerts and incidents | `GET /api/alerts`, `GET /api/incidents`, alert and incident update routes |

| Exports | `GET /api/export/alerts`, `GET /api/export/incidents` |

| Search and audit | `GET /api/search`, `GET /api/audit` |

| Simulation | `POST /api/simulation/run` |



For the full route list, see \[SOC\_DATABASE\_SETUP.md](SOC\_DATABASE\_SETUP.md).



\## Security notes



\- Do not upload `.env` files, passwords, API keys, or local database files.

\- Keep real secrets in local environment files. Use placeholder values in `.env.example`.

\- Demo accounts are for local use only.

\- Do not expose this development setup to the public internet as a production service.



\## Acknowledgment



This project is based on \[SOC-Dashboard by dinujathishean](https://github.com/dinujathishean/SOC-Dashboard). The original project is credited here.

