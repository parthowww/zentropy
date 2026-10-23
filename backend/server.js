const express = require('express');
const path = require('node:path');
const cors = require('cors');

const servicesRouter = require('./routes/services');
const incidentsRouter = require('./routes/incidents');
const metricsRouter = require('./routes/metrics');
const seedDatabase = require('./database/seed');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/services', servicesRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/metrics', metricsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Zentropy System Order API', timestamp: new Date().toISOString() });
});

// Seed data on launch if empty
seedDatabase();

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Zentropy System Order Platform`);
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` API Health: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});
