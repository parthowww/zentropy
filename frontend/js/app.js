// PulseOps Frontend Orchestrator
const API_BASE = '/api';

// State
let services = [];
let incidents = [];
let metrics = {};

// DOM Elements
const servicesTableBody = document.getElementById('services-table-body');
const incidentsContainer = document.getElementById('incidents-container');
const metricServicesCount = document.getElementById('metric-services-count');
const metricLatency = document.getElementById('metric-latency');
const metricUptime = document.getElementById('metric-uptime');
const metricIncidents = document.getElementById('metric-incidents');
const systemStatusPill = document.getElementById('system-status-pill');
const toggleAddBtn = document.getElementById('toggle-add-btn');
const addServiceDrawer = document.getElementById('add-service-drawer');
const addServiceForm = document.getElementById('add-service-form');
const cancelAddBtn = document.getElementById('cancel-add-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchOverview();
  fetchServices();
  fetchIncidents();
  setupEventListeners();

  // Lucide icons init
  if (window.lucide) {
    lucide.createIcons();
  }
});

function setupEventListeners() {
  toggleAddBtn.addEventListener('click', () => {
    addServiceDrawer.classList.toggle('open');
    if (addServiceDrawer.classList.contains('open')) {
      document.getElementById('svc-name').focus();
    }
  });

  cancelAddBtn.addEventListener('click', () => {
    addServiceDrawer.classList.remove('open');
    addServiceForm.reset();
  });

  addServiceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('svc-name').value.trim();
    const url = document.getElementById('svc-url').value.trim();
    const category = document.getElementById('svc-category').value;

    if (!name || !url) return;

    try {
      const res = await fetch(`${API_BASE}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, category, environment: 'production' })
      });
      const data = await res.json();
      if (data.success) {
        addServiceDrawer.classList.remove('open');
        addServiceForm.reset();
        await fetchServices();
        await fetchOverview();
      }
    } catch (err) {
      console.error('Error adding service:', err);
    }
  });

  // Tab switching
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// Fetch Metrics Overview
async function fetchOverview() {
  try {
    const res = await fetch(`${API_BASE}/metrics/overview`);
    const json = await res.json();
    if (json.success) {
      metrics = json.data;
      metricServicesCount.textContent = metrics.total_services;
      metricLatency.textContent = `${metrics.avg_latency_ms} ms`;
      metricUptime.textContent = `${metrics.avg_uptime_pct}%`;
      metricIncidents.textContent = metrics.active_incidents;

      if (metrics.down_services > 0) {
        systemStatusPill.className = 'status-badge status-critical';
        systemStatusPill.innerHTML = `<span style="width: 6px; height: 6px; background: currentColor; border-radius: 50%;"></span><span>Degraded State</span>`;
      } else {
        systemStatusPill.className = 'status-badge status-operational';
        systemStatusPill.innerHTML = `<span style="width: 6px; height: 6px; background: currentColor; border-radius: 50%;"></span><span>All Systems Operational</span>`;
      }
    }
  } catch (err) {
    console.error('Failed to load metrics:', err);
  }
}

// Fetch Services
async function fetchServices() {
  try {
    const res = await fetch(`${API_BASE}/services`);
    const json = await res.json();
    if (json.success) {
      services = json.data;
      renderServices();
    }
  } catch (err) {
    servicesTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #EF4444; padding: 2rem;">Failed to connect to backend service.</td></tr>`;
  }
}

// Render Services Table
function renderServices() {
  if (services.length === 0) {
    servicesTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No services registered yet. Click "Add Endpoint" above.</td></tr>`;
    return;
  }

  servicesTableBody.innerHTML = services.map(svc => {
    const statusPillClass = svc.status === 'healthy' 
      ? 'pill-healthy' 
      : svc.status === 'degraded' 
        ? 'pill-degraded' 
        : 'pill-down';

    return `
      <tr id="service-row-${svc.id}">
        <td>
          <div style="font-weight: 600; color: var(--primary);">${escapeHtml(svc.name)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">${escapeHtml(svc.url)}</div>
        </td>
        <td>
          <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; color: var(--text-muted);">${svc.category}</span>
        </td>
        <td>
          <span class="pill-status ${statusPillClass}">
            <span style="width: 6px; height: 6px; background: currentColor; border-radius: 50%;"></span>
            ${svc.status}
          </span>
        </td>
        <td>
          <span style="font-weight: 600; color: ${svc.latency_ms > 200 ? '#D97706' : 'var(--primary)'}">${svc.latency_ms} ms</span>
        </td>
        <td>
          <span style="font-weight: 600; color: #059669;">${svc.uptime_pct}%</span>
        </td>
        <td style="text-align: right;">
          <button onclick="pingService(${svc.id})" class="btn-quiet" style="font-size: 0.75rem; padding: 0.35rem 0.75rem;">
            Check Ping
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Fetch Incidents
async function fetchIncidents() {
  try {
    const res = await fetch(`${API_BASE}/incidents`);
    const json = await res.json();
    if (json.success) {
      incidents = json.data;
      renderIncidents();
    }
  } catch (err) {
    console.error('Failed to load incidents:', err);
  }
}

// Render Incidents
function renderIncidents() {
  if (incidents.length === 0) {
    incidentsContainer.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No active or historical incidents recorded.</div>`;
    return;
  }

  incidentsContainer.innerHTML = incidents.map(inc => {
    const isResolved = inc.status === 'resolved';
    const badgeClass = isResolved ? 'pill-healthy' : 'pill-down';

    return `
      <div class="incident-item">
        <div class="incident-header">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span class="pill-status ${badgeClass}" style="text-transform: capitalize;">${inc.status}</span>
            <span class="incident-title">${escapeHtml(inc.title)}</span>
          </div>
          ${!isResolved ? `
            <button onclick="resolveIncident(${inc.id})" class="btn-quiet" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;">
              Mark Resolved
            </button>
          ` : ''}
        </div>
        <p class="incident-msg">${escapeHtml(inc.message)}</p>
        <div class="incident-meta">
          <span>Service: <strong>${escapeHtml(inc.service_name || 'System')}</strong></span>
          <span>Logged: ${new Date(inc.created_at).toLocaleDateString()} ${new Date(inc.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          ${inc.resolved_at ? `<span>Resolved: ${new Date(inc.resolved_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Ping Action
async function pingService(id) {
  try {
    const res = await fetch(`${API_BASE}/services/${id}/ping`, { method: 'PATCH' });
    const json = await res.json();
    if (json.success) {
      await fetchServices();
      await fetchOverview();
    }
  } catch (err) {
    console.error('Ping failed:', err);
  }
}

// Resolve Incident Action
async function resolveIncident(id) {
  try {
    const res = await fetch(`${API_BASE}/incidents/${id}/resolve`, { method: 'PATCH' });
    const json = await res.json();
    if (json.success) {
      await fetchIncidents();
      await fetchOverview();
    }
  } catch (err) {
    console.error('Resolve failed:', err);
  }
}

// Security Helper
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}
