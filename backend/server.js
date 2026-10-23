const express = require('express');
const path = require('node:path');
const cors = require('cors');

const authRouter = require('./routes/auth');
const servicesRouter = require('./routes/services');
const incidentsRouter = require('./routes/incidents');
const metricsRouter = require('./routes/metrics');
const seedZentropy = require('./database/seed');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Explicit UI Page Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/app.html'));
});

// Serve frontend static assets
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/services', servicesRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/metrics', metricsRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    product: 'Zentropy Zero-Entropy Telemetry Engine',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Seed demo data on start
seedZentropy();

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Zentropy Platform Started`);
  console.log(` Landing:   http://localhost:${PORT}/`);
  console.log(` Login:     http://localhost:${PORT}/login`);
  console.log(` Console:   http://localhost:${PORT}/app`);
  console.log(`===============================================`);
});
