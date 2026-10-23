const db = require('./db');

function seedZentropy() {
  // Ensure default demo user exists
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@zentropy.io');
  if (!existingUser) {
    db.prepare(`
      INSERT INTO users (email, password_hash, name, company, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('demo@zentropy.io', 'demo123', 'Alex Vance', 'Vance Cloud Technologies', 'Lead Infrastructure Engineer');
    console.log('Seeded demo user: demo@zentropy.io');
  }

  // Check if services exist
  const count = db.prepare('SELECT COUNT(*) as count FROM services').get().count;
  if (count === 0) {
    console.log('Seeding initial real-world endpoints for Zentropy...');
    const insertService = db.prepare(`
      INSERT INTO services (name, url, category, status, last_status_code, latency_ms, uptime_pct, last_checked)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    // Real accessible endpoints that will succeed on live checks
    insertService.run('GitHub Public REST API', 'https://api.github.com', 'api', 'healthy', 200, 85, 100.0);
    insertService.run('Cloudflare Edge DNS / CDN', 'https://1.1.1.1', 'api', 'healthy', 200, 24, 99.99);
    insertService.run('HTTPBin Gateway Probe', 'https://httpbin.org/status/200', 'api', 'healthy', 200, 115, 99.95);
    insertService.run('Stripe Webhook Ping Simulator', 'https://httpbin.org/delay/0', 'api', 'healthy', 200, 130, 99.90);
    console.log('Real services seeded.');
  }
}

if (require.main === module) {
  seedZentropy();
}

module.exports = seedZentropy;
