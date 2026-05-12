// ═══════════════════════════════════════════════════════
//   CSH AthleticTrack — Client-Side JS
// ═══════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // ─── Live Search ──────────────────────────────────────
  const searchInput = document.getElementById('searchInput');
  const sportFilter = document.getElementById('sportFilter');
  const resultsBody = document.getElementById('resultsBody');

  async function runSearch() {
    const q     = searchInput?.value.trim()   || '';
    const sport = sportFilter?.value          || '';
    if (!resultsBody) return;

    resultsBody.innerHTML = `
      <tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gray-400);">
        <em>Searching…</em>
      </td></tr>`;

    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}&sport=${encodeURIComponent(sport)}`);
      const data = await res.json();

      if (!data.length) {
        resultsBody.innerHTML = `
          <tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gray-400);">
            No reports found.
          </td></tr>`;
        return;
      }

      resultsBody.innerHTML = data.map(r => `
        <tr>
          <td><strong>${r.studentName}</strong></td>
          <td>${r.subject}</td>
          <td class="grade-${r.grade?.charAt(0)}">${r.grade}</td>
          <td>
            <span class="badge ${
              r.attendance === 'Present' ? 'badge-green' :
              r.attendance === 'Tardy'   ? 'badge-gold'  : 'badge-red'
            }">${r.attendance}</span>
          </td>
          <td>
            <span class="badge ${
              r.behavior === 'Excellent'         ? 'badge-green' :
              r.behavior === 'Good'              ? 'badge-green' :
              r.behavior === 'Needs Improvement' ? 'badge-gold'  : 'badge-red'
            }">${r.behavior}</span>
          </td>
          <td>${r.sport || '—'}</td>
          <td class="text-muted text-sm">${r.teacherName}</td>
        </tr>
      `).join('');
    } catch (err) {
      resultsBody.innerHTML = `
        <tr><td colspan="7" style="text-align:center;padding:2rem;color:#c00;">
          Error loading results.
        </td></tr>`;
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', debounce(runSearch, 350));
    runSearch(); // initial load
  }
  if (sportFilter) {
    sportFilter.addEventListener('change', runSearch);
  }

  // ─── Debounce Helper ──────────────────────────────────
  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  // ─── Auto-dismiss alerts ──────────────────────────────
  const alerts = document.querySelectorAll('.alert[data-auto-dismiss]');
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.5s';
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 500);
    }, 4000);
  });

  // ─── Form Validation ──────────────────────────────────
  const reportForm = document.getElementById('reportForm');
  if (reportForm) {
    reportForm.addEventListener('submit', (e) => {
      const required = reportForm.querySelectorAll('[required]');
      let valid = true;
      required.forEach(field => {
        if (!field.value.trim()) {
          field.style.borderColor = '#e00';
          valid = false;
          field.addEventListener('input', () => {
            field.style.borderColor = '';
          }, { once: true });
        }
      });
      if (!valid) {
        e.preventDefault();
        showToast('Please fill in all required fields.', 'error');
      }
    });
  }

  // ─── Toast Notification ───────────────────────────────
  function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      background: ${type === 'error' ? '#c00' : 'var(--green-600)'};
      color: white; padding: 14px 24px; border-radius: 12px;
      font-family: var(--font-body); font-weight: 600; font-size: 0.9rem;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      animation: fadeUp 0.4s ease;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s';
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  // ─── Mobile Nav Toggle ────────────────────────────────
  const menuBtn = document.getElementById('menuBtn');
  const mobileNav = document.getElementById('mobileNav');
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });
  }

  // ─── Grade Chart (if canvas present) ─────────────────
  const gradeChart = document.getElementById('gradeChart');
  if (gradeChart) {
    const studentId = gradeChart.dataset.student;
    fetch(`/api/grades/${studentId}`)
      .then(r => r.json())
      .then(data => {
        if (!data.length) return;
        drawGradeChart(gradeChart, data);
      });
  }

  function drawGradeChart(canvas, data) {
    const ctx = canvas.getContext('2d');
    const gradeMap = { A: 95, B: 82, C: 72, D: 62, F: 50 };
    const labels   = data.map(d => d.subject);
    const values   = data.map(d => gradeMap[d.grade?.charAt(0)] || 70);
    const W = canvas.width, H = canvas.height;
    const pad = 40, chartW = W - pad * 2, chartH = H - pad * 2;

    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = '#eef2ee';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad + (chartH / 5) * i;
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
    }

    if (values.length < 2) return;
    const xStep = chartW / (values.length - 1);

    // Fill under line
    ctx.beginPath();
    ctx.moveTo(pad, pad + chartH * (1 - (values[0] - 50) / 50));
    values.forEach((v, i) => {
      ctx.lineTo(pad + xStep * i, pad + chartH * (1 - (v - 50) / 50));
    });
    ctx.lineTo(pad + xStep * (values.length - 1), pad + chartH);
    ctx.lineTo(pad, pad + chartH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad, 0, pad + chartH);
    grad.addColorStop(0, 'rgba(34,133,47,0.3)');
    grad.addColorStop(1, 'rgba(34,133,47,0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#22852f';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    values.forEach((v, i) => {
      const x = pad + xStep * i;
      const y = pad + chartH * (1 - (v - 50) / 50);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Dots
    values.forEach((v, i) => {
      const x = pad + xStep * i, y = pad + chartH * (1 - (v - 50) / 50);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#22852f'; ctx.fill();
      ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
    });

    // X labels
    ctx.fillStyle = '#5a6e5a';
    ctx.font = '11px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((l, i) => {
      ctx.fillText(l, pad + xStep * i, H - 10);
    });
  }

});