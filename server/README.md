# XSSpecter Server - Callback Handling & Dashboard

XSSpecter Server receives blind-XSS callbacks from client payloads, persists detailed alert data, and provides a web dashboard for monitoring, analysis, and notifications.

---

## Table of Contents
1. [Overview](#overview)
2. [Ethical Notice & Disclaimer](#ethical-notice--disclaimer)
3. [Key Features](#key-features)
4. [Architecture & Components](#architecture--components)
5. [Technologies & Libraries](#technologies--libraries)
6. [Installation & Deployment](#installation--deployment)
7. [Configuration](#configuration)
8. [Usage](#usage)
9. [Callback Handling Workflow](#callback-handling-workflow)
10. [Extending & Customizing](#extending--customizing)
11. [Contributing & License](#contributing--license)

---

## Overview

The server component of XSSpecter does the following:
- Hosts a JavaScript payload endpoint that serves minified injection scripts.
- Accepts POST callbacks (`/cb`) from executed XSS payloads with detailed client context.
- Stores alerts, DOM data, permissions, and screenshots in PostgreSQL via Prisma.
- Exposes an authenticated API (`/api`) and a Vue-powered dashboard for analysis.
- Sends notifications (Email, Discord, Slack, Telegram) based on configured channels.

## Ethical Notice & Disclaimer

> **Warning:** Only deploy this server against targets for which you have explicit permission. Unauthorized data capture and scanning are illegal and unethical. Always follow laws and your organization's rules of engagement.

## Key Features
- **Blind XSS Alert Storage:** Captures timestamp, IP, user-agent, cookies, DOM snapshot, permissions, scripts, meta tags.
- **Screenshot Capture:** Uses html2canvas to snapshot the target page.
- **Persistent Sessions:** Secure session management with Redis-like store backed by PostgreSQL.
- **Notifications:** Multi-channel (SMTP Email, Discord, Slack, Telegram) via configurable webhooks and SMTP.
- **Admin & User Management:** Role-based access and per-user notification preferences.
- **Web Dashboard:** Vue 3, PrimeVue UI components, and Chart.js for visualizing trends.
- **Dockerized Infrastructure:** Docker Compose for easy deployment of backend, frontend, and database.

## Architecture & Components
```text
server/
├─ backend/              # Node.js + Express API & callback handler
│  ├─ index.js           # Main server, routes mounting, payload endpoint
│  ├─ helpers/           # Utility modules (payload prep, admin setup, notifications)
│  ├─ routes/            # Express routers: callback.js, api.js and subroutes
│  ├─ assets/            # JavaScript templates, html2canvas lib
│  ├─ prisma/            # Prisma schema & migrations for PostgreSQL
│  └─ package.json       # Backend dependencies and startup scripts
├─ frontend/             # Vue 3 dashboard UI
│  ├─ src/               # Vue components, router, pages
│  ├─ public/            # Static assets, index.html
│  ├─ tailwind.config.js # Styling configuration
│  └─ package.json       # Frontend dependencies and build scripts
├─ docker-compose.yaml   # Orchestrates backend, frontend, and PostgreSQL
├─ nginx/                # Nginx config for reverse proxy (production)
└─ secrets/              # Docker secrets (DB password, session secret, admin pass)
```

## Technologies & Libraries

### Backend
- **Node.js & Express:** Minimalist HTTP server for handling callbacks and API routes.
- **Prisma ORM:** Type-safe database client for PostgreSQL with migrations support.
- **PostgreSQL:** Reliable relational database for storing alert and user data.
- **express-session & @quixo3/prisma-session-store:** Persistent, secure sessions backed by the database.
- **argon2:** Modern password hashing algorithm for storing user credentials.
- **nodemailer:** SMTP client for sending email notifications.
- **Global fetch (Node):** Native HTTP client for webhook notifications.
- **terser:** Minifies JavaScript payloads before serving to reduce size.
- **OpenAI SDK:** (Optional) enables AI-powered report generations.
- **Docker:** Containers for reproducible environments.

### Frontend
- **Vue 3:** Progressive UI framework for building interactive dashboard.
- **PrimeVue:** Comprehensive UI component library for tables, dialogs, and forms.
- **Tailwind CSS:** Utility-first CSS framework for rapid styling.
- **Chart.js:** Charting library for visualizing alert statistics and trends.
- **Vite:** Next-generation front-end build tool and development server.

## Installation & Deployment
1. Install Docker & Docker Compose on your host.
2. Clone the repository and navigate to the server folder:
   ```bash
   git clone <repo-url>
   cd server/
   ```
3. Populate `secrets/` directory with:
   - `db-pass.txt` (PostgreSQL password)
   - `express-session-secret.txt` (session secret)
   - `admin-pass.txt` (initial admin password, optional)
4. Launch services:
   ```bash
   docker-compose up -d --build
   ```
5. Backend listens on port 3000; frontend exposed on port 80.

_Use `docker-compose.dev.yaml` for development with hot-reloading._

## Configuration
- **Database URL:** injected via `POSTGRES_PASSWORD_FILE` and Prisma.
- **Session Secret:** provided via `SESSION_SECRET_FILE`.
- **Admin Password:** optionally via `ADMIN_PASS_FILE`; auto-generated otherwise.
- **Notification Settings:** stored in the `Settings` table and initialized at startup.

## Usage
- **Callback Endpoint:** POST alerts to `http://<host>:3000/cb`.
- **API Routes:** authenticated access under `http://<host>:3000/api/...`.
- **Payload Serve:** GET `http://<host>:3000/<UID>` returns minified client payload.
- **Dashboard:** browse to `http://<host>/` for the Vue UI.

## Callback Handling Workflow
1. Payload executes in victim browser, sending JSON to `/cb`.
2. Server extracts correct IP (supports custom header) and CORS.
3. Creates `XSSAlert` and related models (Document, Location, Permissions, Scripts, MetaTags, Screenshot) via Prisma.
4. Associates alert with `TrackingID` if UID present.
5. Dispatches notifications based on enabled channels.

## Extending & Customizing
- **Payload Templates:** edit `backend/assets/base.js` and rebuild.
- **Notification Channels:** add or modify in `backend/helpers/send-notifications.js`.
- **Settings Keys:** adjust defaults in `backend/helpers/startup.js`.
- **UI Components:** extend Vue pages and components under `frontend/src`.

## Contributing & License
- Contributions: fork repo, create a branch, open a pull request.
- Code style: ESLint & Prettier enforced for consistency.
- **License:** No default license included; consider adding an open-source license (e.g., MIT) before public use.
