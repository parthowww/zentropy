# Zentropy 🌀

> **Zero-Entropy Microservice Telemetry & System Order Platform**

Zentropy is a minimalist observability platform designed to eliminate operational chaos and system degradation. Inspired by the clean, elevated aesthetic of Xenodochy, Zentropy replaces cluttered monitoring suites with floating frosted-glass islands, subtle radial dot grids, and zero intrusive popup dialogs.

---

## ✨ Features

- **Xenodochy Aesthetic:** Off-white canvas (`#F8F9FA`), subtle radial matrix dot grid, floating rounded frosted islands (`rounded-[32px]`), and crisp Bricolage Grotesque typography.
- **Zero-Modal Workflow:** All telemetry interactions (adding endpoints, verifying latency pings, resolving incident trails) happen in-place via smooth inline drawers.
- **Microservice Health & Latency:** Real-time tracking of p99 latency, global uptime equilibrium, and degraded state triggers.
- **Embedded Database:** Zero-configuration SQLite database powered by Node's native `node:sqlite`.
- **RESTful API:** Clean, structured endpoints for services, incident tracking, and metric aggregates.

---

## 🏗️ Architecture

```
zentropy/
├── backend/
│   ├── database/
│   │   ├── schema.sql      # SQLite relational table schemas
│   │   ├── db.js           # Database connection using node:sqlite
│   │   └── seed.js         # Telemetry seed script
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
| `GET` | `/api/health` | Health check for Zentropy Core |

---

## 🛠️ Tech Stack
- **Frontend:** Vanilla ES6+, CSS3, Lucide Icons, Google Bricolage Grotesque & Inter
- **Backend:** Node.js, Express.js
- **Database:** SQLite (`node:sqlite`)
