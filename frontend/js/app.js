// Zentropy Console Application Controller
const API_BASE = '/api';

// Check Auth
const token = localStorage.getItem('zentropy_token');
const userStr = localStorage.getItem('zentropy_user');

if (!token) {
  window.location.href = '/login';
}

let currentUser = {};
try {
  currentUser = JSON.parse(userStr) || {};
} catch (e) {
  currentUser = { name: 'Alex Vance', company: 'Infrastructure Team' };
}

// State
let services = [];
let incidents = [];

// DOM Elements
const userDisplayName = document.getElementById('user-display-name');
const userDisplayCompany = document.getElementById('user-display-company');
const btnSignout = document.getElementById('btn-signout');

const servicesTableBody = document.getElementById('services-table-body');
const incidentsContainer = document.getElementById('incidents-container');

const kpiCount = document.getElementById('kpi-count');
const kpiUptime = document.getElementById('kpi-uptime');
const kpiLatency = document.getElementById('kpi-latency');
const kpiIncidents = document.getElementById('kpi-incidents');
const kpiIncidentsSub = document.getElementById('kpi-incidents-sub');

const btnToggleAdd = document.getElementById('btn-toggle-add');
const addDrawer = document.getElementById('add-drawer');
const btnCancelAdd = document.getElementById('btn-cancel-add');
const addEndpointForm = document.getElementById('add-endpoint-form');
const btnCheckAll = document.getElementById('btn-check-all');

// Init
document.addEventListener('DOMContentLoaded', () => {
  if (userDisplayName && currentUser.name) {
    userDisplayName.textContent = currentUser.name;
    userDisplayCompany.textContent = `${currentUser.company || 'Enterprise'} • ${currentUser.role || 'SRE'}`;
  }

  fetchMetrics();
  fetchServices();
  fetchIncidents();
  setupEventListeners();

  if (window.lucide) {
    lucide.createIcons();
  }
});

function setupEventListeners() {
  // Signout
  btnSignout.addEventListener('click', () => {
    localStorage.removeItem('zentropy_token');
    localStorage.removeItem('zentropy_user');
    window.location.href = '/';
  });

  // Toggle drawer
  btnToggleAdd.addEventListener('click', () => {
    addDrawer.classList.toggle('open');
    if (addDrawer.classList.contains('open')) {
      document.getElementById('svc-name').focus();
    }
  });

  btnCancelAdd.addEventListener('click', () => {
    addDrawer.classList.remove('open');
    addEndpointForm.reset();
  });

  // Add endpoint
  addEndpointForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('svc-name').value.trim();
    let url = document.getElementById('svc-url').value.trim();
    const category = document.getElementById('svc-category').value;

    if (!name || !url) return;

    const submitBtn = addEndpointForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Probing & Registering...';
    submitBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, category })
      });
      const data = await res.json();
      if (data.success) {
        addDrawer.classList.remove('open');
        addEndpointForm.reset();
        await fetchServices();
        await fetchMetrics();
        await fetchIncidents();
      } else {
        alert(data.message || 'Failed to add endpoint');
      }
    } catch (err) {
      alert('Network error connecting to probe engine');
    } finally {
      submitBtn.textContent = 'Execute Check & Save';
      submitBtn.disabled = false;
    }
  });

  // Check all endpoints live
  btnCheckAll.addEventListener('click', async () => {
    btnCheckAll.innerHTML = '<i data-lucide="loader-2" class="spin" style="width: 15px; height: 15px;"></i> Probing All Targets...';
    btnCheckAll.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/services/check-all`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchServices();
        await fetchMetrics();
        await fetchIncidents();
      }
    } catch (err) {
      console.error('Failed to probe all services:', err);
    } finally {
      btnCheckAll.innerHTML = '<i data-lucide="refresh-cw" style="width: 15px; height: 15px;"></i> Check All (Live Probe)';
      btnCheckAll.disabled = false;
      lucide.createIcons();
    }
  });
}

// Fetch Metrics Overview
async function fetchMetrics() {
  try {
    const res = await fetch(`${API_BASE}/metrics/overview`);
    const json = await res.json();
    if (json.success) {
      const m = json.data;
      kpiCount.textContent = m.total_services;
      kpiUptime.textContent = `${m.avg_uptime_pct}%`;
      kpiLatency.textContent = `${m.avg_latency_ms} ms`;
      kpiIncidents.textContent = m.active_incidents;

      if (m.active_incidents > 0) {
        kpiIncidentsSub.style.color = '#F87171';
        kpiIncidentsSub.textContent = `${m.active_incidents} alert(s) requiring attention`;
      } else {
        kpiIncidentsSub.style.color = '#34D399';
        kpiIncidentsSub.textContent = 'Zero degradation detected';
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
    servicesTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #EF4444; padding: 2rem;">Error connecting to probe service.</td></tr>`;
  }
}

// Render Services Table
function renderServices() {
  if (services.length === 0) {
    servicesTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem;">No endpoints registered yet. Click "Add Endpoint" above to add your first real URL.</td></tr>`;
    return;
  }

  servicesTableBody.innerHTML = services.map(svc => {
    let pillClass = 'status-healthy';
    let statusLabel = `HTTP ${svc.last_status_code || 200}`;
    if (svc.status === 'degraded') {
      pillClass = 'status-degraded';
      statusLabel = `HTTP ${svc.last_status_code || 400} DEGRADED`;
    } else if (svc.status === 'down') {
      pillClass = 'status-down';
      statusLabel = `HTTP ${svc.last_status_code || 500} DOWN`;
    }

    const latencyColor = svc.latency_ms < 100 ? '#34D399' : (svc.latency_ms < 300 ? '#FBBF24' : '#F87171');
    const timeFormatted = svc.last_checked ? new Date(svc.last_checked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never';

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: white;">${escapeHtml(svc.name)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono); margin-top: 0.2rem;">
            <a href="${escapeHtml(svc.url)}" target="_blank" style="color: var(--text-muted); text-decoration: none;">
              ${escapeHtml(svc.url)} ↗
            </a>
          </div>
        </td>
        <td>
          <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.05em;">
            ${svc.category}
          </span>
        </td>
        <td>
          <span class="status-pill ${pillClass}">
            <span style="width: 6px; height: 6px; background: currentColor; border-radius: 50%;"></span>
            ${statusLabel}
          </span>
        </td>
        <td>
          <span style="font-family: var(--font-mono); font-weight: 700; color: ${latencyColor};">
            ${svc.latency_ms} ms
          </span>
        </td>
        <td>
          <span style="font-family: var(--font-mono); font-weight: 600; color: #34D399;">
            ${svc.uptime_pct}%
          </span>
        </td>
        <td>
          <span style="font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono);">
            ${timeFormatted}
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; align-items: center; gap: 0.5rem;">
            <button onclick="pingSingleEndpoint(${svc.id})" id="ping-btn-${svc.id}" class="btn-ping">
              Ping Probe
            </button>
            <button onclick="deleteEndpoint(${svc.id})" class="btn-del" title="Delete Endpoint">
              <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  lucide.createIcons();
}

// Single Endpoint Probe Action
async function pingSingleEndpoint(id) {
  const btn = document.getElementById(`ping-btn-${id}`);
  if (btn) {
    btn.textContent = 'Probing...';
    btn.disabled = true;
  }

  try {
    const res = await fetch(`${API_BASE}/services/${id}/ping`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      await fetchServices();
      await fetchMetrics();
      await fetchIncidents();
    }
  } catch (err) {
    console.error('Ping probe failed:', err);
  } finally {
    if (btn) {
      btn.textContent = 'Ping Probe';
      btn.disabled = false;
    }
  }
}

// Delete Endpoint
async function deleteEndpoint(id) {
  if (!confirm('Are you sure you want to stop monitoring this endpoint?')) return;

  try {
    const res = await fetch(`${API_BASE}/services/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      await fetchServices();
      await fetchMetrics();
    }
  } catch (err) {
    alert('Failed to delete endpoint');
  }
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
    incidentsContainer.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1rem;">
        <i data-lucide="check-circle" style="color: #34D399; width: 20px; height: 20px; display: block; margin: 0 auto 0.5rem auto;"></i>
        All services are currently healthy. Zero open incidents.
      </div>
    `;
    lucide.createIcons();
    return;
  }

  incidentsContainer.innerHTML = incidents.map(inc => {
    const isResolved = inc.status === 'resolved';
    const badgeColor = isResolved ? 'status-healthy' : 'status-down';

    return `
      <div style="padding: 1rem 0; border-bottom: 1px solid var(--border-line); display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem;">
            <span class="status-pill ${badgeColor}">${inc.status.toUpperCase()}</span>
            <span style="font-weight: 700; color: white; font-size: 0.95rem;">${escapeHtml(inc.title)}</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5;">${escapeHtml(inc.message)}</p>
          ${inc.error_details ? `<div style="font-family: var(--font-mono); font-size: 0.75rem; color: #F87171; margin-top: 0.25rem;">Error: ${escapeHtml(inc.error_details)}</div>` : ''}
          <div style="font-size: 0.75rem; color: #64748B; margin-top: 0.4rem;">
            <span>Target: <strong>${escapeHtml(inc.service_name || 'System')}</strong></span> • 
            <span>Logged: ${new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        ${!isResolved ? `
          <button onclick="resolveIncident(${inc.id})" class="btn-secondary" style="font-size: 0.75rem; padding: 0.35rem 0.75rem;">
            Mark Resolved
          </button>
        ` : ''}
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

// Resolve incident
async function resolveIncident(id) {
  try {
    const res = await fetch(`${API_BASE}/incidents/${id}/resolve`, { method: 'PATCH' });
    const data = await res.json();
    if (data.success) {
      await fetchIncidents();
      await fetchMetrics();
    }
  } catch (err) {
    console.error('Failed to resolve incident:', err);
  }
}

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
