# PulseOps ⚡

> **Minimalist Zero-Noise Microservice Telemetry & Reliability Orchestrator**

PulseOps is an AI-friendly, high-signal service reliability dashboard designed with the clean, elevated aesthetic of Xenodochy: floating frosted-glass card containers, subtle radial dot grids, and zero clutter or intrusive modals.

---

## ✨ Features

- **Xenodochy Design Language:** Off-white background (`#F8F9FA`), subtle radial matrix dot grid, floating frosted glass islands (`rounded-[32px]`), and crisp typography.
- **Zero-Modal Workflow:** All actions (adding endpoints, verifying pings, resolving incident trails) happen in-place via smooth inline drawers.
- **Microservice Health & Latency:** Real-time tracking of p99 latency, global uptime percentages, and status alerts.
- **Embedded Database:** Built-in SQLite database using Node's native `node:sqlite` for zero native build dependencies.
- **RESTful API:** Structured endpoints for services, incident tracking, and metric aggregates.

---

## 🏗️ Architecture

```
pulse-ops/
├── backend/
│   ├── database/
│   │   ├── schema.sql      # SQLite relational table schemas
│   │   ├── db.js           # Database connection using node:sqlite
│   │   └── seed.js         # Initial mock telemetry seed script
│   ├── routes/
│   │   ├── services.js     # Endpoint CRUD & health check simulation
│   │   ├── incidents.js    # Incident lifecycle operations
│   │   └── metrics.js      # Global telemetry & uptime KPIs
│   ├── server.js           # Express API & static server
│   └── package.json
├── frontend/
│   ├── css/
│   │   └── style.css       # Clean styling & radial grid
│   ├── js/
│   │   └── app.js          # Reactive frontend controller
│   └── index.html          # Floating dashboard canvas
└── README.md
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Run the Application
```bash
npm start
```
The server will seed the database automatically and launch on:
👉 **`http://localhost:4000`**

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/services` | List all monitored services |
| `POST` | `/api/services` | Register a new service endpoint |
| `PATCH` | `/api/services/:id/ping` | Trigger a live ping check |
| `DELETE` | `/api/services/:id` | Remove a service from monitoring |
| `GET` | `/api/incidents` | Retrieve incident log history |
| `PATCH` | `/api/incidents/:id/resolve` | Mark an incident as resolved |
| `GET` | `/api/metrics/overview` | Fetch global telemetry KPIs |
| `GET` | `/api/health` | Health check for PulseOps Core |

---

## 🛠️ Tech Stack
- **Frontend:** Vanilla ES6+, CSS3, Lucide Icons, Google Bricolage Grotesque & Inter
- **Backend:** Node.js, Express.js
- **Database:** SQLite (`node:sqlite`)
