-- PulseOps Observability Platform Database Schema
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    environment TEXT NOT NULL DEFAULT 'production', -- production, staging, dev
    category TEXT NOT NULL DEFAULT 'api', -- api, database, auth, worker, gateway
    status TEXT NOT NULL DEFAULT 'healthy', -- healthy, degraded, down
    latency_ms INTEGER NOT NULL DEFAULT 45,
    uptime_pct REAL NOT NULL DEFAULT 99.98,
    last_checked DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'minor', -- critical, major, minor, maintenance
    status TEXT NOT NULL DEFAULT 'resolved', -- investigating, identified, monitoring, resolved
    message TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS latency_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    status_code INTEGER NOT NULL DEFAULT 200,
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);
