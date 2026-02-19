<?php
session_start();
if (!isset($_SESSION["is_logged_in"]) || $_SESSION["is_logged_in"] !== true) {
    header("Location: login.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Dasbor Monitoring Orion EWS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: radial-gradient(circle at top, #0ea5e9 0, #0f172a 40%, #020617 100%);
      color: #e5e7eb;
      display: flex;
      align-items: stretch;
      justify-content: center;
      padding: 24px 16px;
      box-sizing: border-box;
    }
    .monitor-shell {
      width: 100%;
      max-width: 100%;
      background: rgba(15, 23, 42, 0.9);
      border-radius: 22px;
      border: 1px solid rgba(148, 163, 184, 0.4);
      box-shadow:
        0 28px 80px rgba(15, 23, 42, 0.95),
        0 0 0 1px rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(18px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .monitor-header {
      padding: 16px 20px 12px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.35);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px 16px;
      background: linear-gradient(to right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.96));
    }
    .header-main {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header-title h1 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
      letter-spacing: 0.03em;
    }
    .header-badge {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      padding: 3px 10px;
      border-radius: 6px;
      background: radial-gradient(circle at 0 0, #22c55e, #16a34a);
      color: #ecfdf5;
      border: 1px solid rgba(6, 78, 59, 0.9);
      box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.9), 0 8px 18px rgba(15, 23, 42, 0.9);
    }
    .header-subtitle {
      font-size: 0.8rem;
      color: #cbd5f5;
      opacity: 0.9;
    }
    .header-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
    .nav-chip {
      font-size: 0.78rem;
      padding: 4px 10px;
      border-radius: 6px;
      text-decoration: none;
      border: 1px solid rgba(148, 163, 184, 0.7);
      color: #e5e7eb;
      background: rgba(15, 23, 42, 0.96);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 160ms ease, border-color 160ms ease, transform 120ms ease;
    }
    .nav-chip:hover {
      background: radial-gradient(circle at 0 0, rgba(59, 130, 246, 0.9), rgba(15, 23, 42, 0.98));
      border-color: rgba(129, 140, 248, 0.95);
      transform: translateY(-0.5px);
    }
    .monitor-content {
      padding: 16px 18px 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      background:
        radial-gradient(circle at 0 0, rgba(59, 130, 246, 0.22), transparent 55%),
        radial-gradient(circle at 100% 0, rgba(45, 212, 191, 0.18), transparent 55%),
        rgba(15, 23, 42, 0.96);
    }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }
    .stat-card {
      border-radius: 14px;
      border: 1px solid rgba(148, 163, 184, 0.35);
      padding: 10px 11px;
      background: radial-gradient(circle at 0 0, rgba(15, 118, 110, 0.35), rgba(15, 23, 42, 0.96));
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .stat-card:nth-child(2) {
      background: radial-gradient(circle at 0 0, rgba(37, 99, 235, 0.4), rgba(15, 23, 42, 0.96));
    }
    .stat-card:nth-child(3) {
      background: radial-gradient(circle at 0 0, rgba(126, 34, 206, 0.4), rgba(15, 23, 42, 0.96));
    }
    .stat-title {
      font-size: 0.78rem;
      color: #cbd5f5;
    }
    .stat-value-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .stat-value {
      font-size: 1.3rem;
      font-weight: 600;
      color: #e5e7eb;
    }
    .stat-chip {
      font-size: 0.7rem;
      padding: 2px 7px;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.8);
      background: rgba(15, 23, 42, 0.92);
      color: #e5e7eb;
    }
    .stat-footer {
      font-size: 0.72rem;
      color: #9ca3af;
    }
    .charts-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 12px;
      min-height: 320px;
    }
    .chart-card {
      border-radius: 16px;
      border: 1px solid rgba(148, 163, 184, 0.35);
      padding: 10px 12px 12px;
      background: radial-gradient(circle at 0 0, rgba(30, 64, 175, 0.45), rgba(15, 23, 42, 0.96));
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .chart-card-secondary {
      background: radial-gradient(circle at 0 0, rgba(147, 51, 234, 0.45), rgba(15, 23, 42, 0.96));
    }
    .chart-card-geo {
      background: radial-gradient(circle at 0 0, rgba(249, 115, 22, 0.4), rgba(15, 23, 42, 0.96));
    }
    .chart-card-quake {
      background: radial-gradient(circle at 0 0, rgba(239, 68, 68, 0.45), rgba(15, 23, 42, 0.96));
    }
    .chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .chart-title {
      font-size: 0.9rem;
      font-weight: 600;
    }
    .chart-subtitle {
      font-size: 0.75rem;
      color: #cbd5f5;
    }
    .chart-header-main {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .chart-controls {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .select-input {
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.7);
      background: rgba(15, 23, 42, 0.96);
      color: #e5e7eb;
      font-size: 0.78rem;
      padding: 4px 9px;
    }
    .btn-ghost {
      border-radius: 6px;
      border: 1px solid rgba(59, 130, 246, 0.8);
      background: radial-gradient(circle at 0 0, rgba(59, 130, 246, 0.85), rgba(15, 23, 42, 0.96));
      color: #eff6ff;
      font-size: 0.78rem;
      padding: 4px 10px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 150ms ease, box-shadow 150ms ease, transform 120ms ease;
    }
    .btn-ghost:hover {
      background: radial-gradient(circle at 0 0, rgba(96, 165, 250, 1), rgba(15, 23, 42, 0.98));
      box-shadow:
        0 0 0 1px rgba(15, 23, 42, 0.95),
        0 16px 30px rgba(37, 99, 235, 0.7);
      transform: translateY(-0.5px);
    }
    .btn-ghost:disabled {
      opacity: 0.7;
      cursor: default;
      box-shadow: none;
    }
    .chart-body {
      flex: 1;
      min-height: 220px;
    }
    .chart-body canvas {
      width: 100%;
      height: 100%;
    }
    .chart-footer {
      font-size: 0.75rem;
      color: #9ca3af;
      min-height: 32px;
    }
    .status-bar {
      margin-top: 6px;
      font-size: 0.75rem;
      color: #9ca3af;
    }
    .status-bar span {
      font-weight: 500;
      color: #e5e7eb;
    }
    @media (max-width: 960px) {
      .charts-row {
        grid-template-columns: minmax(0, 1fr);
      }
    }
    @media (max-width: 720px) {
      body {
        padding: 16px 10px;
      }
      .monitor-header {
        align-items: flex-start;
      }
      .stats-row {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  </style>
</head>
<body>
  <div class="monitor-shell">
    <header class="monitor-header">
      <div class="header-main">
        <div class="header-title">
          <h1>Dasbor Monitoring Orion EWS</h1>
          <span class="header-badge">Live Metrics</span>
        </div>
        <div class="header-subtitle">
          Statistik perangkat EWS Orion di Banjarnegara, termasuk level sungai dan distribusi perangkat.
        </div>
      </div>
      <div class="header-actions">
        <a href="admin_ews.php" class="nav-chip">Kelola device EWS</a>
        <a href="index.html" class="nav-chip">Kembali ke peta utama</a>
        <a href="login.php?logout=1" class="nav-chip">Keluar</a>
      </div>
    </header>
    <main class="monitor-content">
      <section class="stats-row">
        <div class="stat-card">
          <div class="stat-title">Total perangkat Orion</div>
          <div class="stat-value-row">
            <div id="statTotalDevices" class="stat-value">-</div>
            <div class="stat-chip" id="statTotalTypes">- jenis</div>
          </div>
          <div class="stat-footer" id="statTotalFooter">Memuat data perangkat…</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Status operasional</div>
          <div class="stat-value-row">
            <div id="statActiveDevices" class="stat-value">-</div>
            <div class="stat-chip" id="statStatusSplit">Aktif / Nonaktif</div>
          </div>
          <div class="stat-footer" id="statStatusFooter"></div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Sebaran jenis perangkat</div>
          <div class="stat-value-row">
            <div id="statFloodDevices" class="stat-value">-</div>
            <div class="stat-chip">FloodGuard</div>
          </div>
          <div class="stat-footer" id="statTypesFooter"></div>
        </div>
      </section>
      <section class="charts-row">
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-header-main">
              <div class="chart-title">Monitoring level sungai (FloodGuard)</div>
              <div class="chart-subtitle" id="floodChartSubtitle">Memuat daftar stasiun…</div>
            </div>
            <div class="chart-controls">
              <select id="monitorStation" class="select-input"></select>
              <button type="button" id="btnMonitorSimulate" class="btn-ghost">Tambah sampel simulasi</button>
            </div>
          </div>
          <div class="chart-body">
            <canvas id="monitorFloodChart"></canvas>
          </div>
          <div class="chart-footer" id="monitorFloodStats">
            Menunggu data riwayat level sungai…
          </div>
        </div>
      </section>
      <section class="charts-row">
        <div class="chart-card chart-card-geo">
          <div class="chart-header">
            <div class="chart-header-main">
              <div class="chart-title">Pergerakan tanah (GeoShield)</div>
              <div class="chart-subtitle" id="geoChartSubtitle">Memuat daftar stasiun longsor…</div>
            </div>
            <div class="chart-controls">
              <select id="monitorGeoStation" class="select-input"></select>
              <button type="button" id="btnGeoSimulate" class="btn-ghost">Tambah sampel simulasi</button>
            </div>
          </div>
          <div class="chart-body">
            <canvas id="monitorGeoChart"></canvas>
          </div>
          <div class="chart-footer" id="monitorGeoStats">
            Menunggu data pergerakan tanah…
          </div>
        </div>
        <div class="chart-card chart-card-quake">
          <div class="chart-header">
            <div class="chart-header-main">
              <div class="chart-title">Level getaran tanah (QuakeAlert)</div>
              <div class="chart-subtitle" id="quakeChartSubtitle">Memuat daftar stasiun gempa…</div>
            </div>
            <div class="chart-controls">
              <select id="monitorQuakeStation" class="select-input"></select>
              <button type="button" id="btnQuakeSimulate" class="btn-ghost">Tambah sampel simulasi</button>
            </div>
          </div>
          <div class="chart-body">
            <canvas id="monitorQuakeChart"></canvas>
          </div>
          <div class="chart-footer" id="monitorQuakeStats">
            Menunggu data level getaran tanah…
          </div>
        </div>
      </section>
      <div class="status-bar" id="monitorStatusBar">
        Status: <span>Memuat data dari server…</span>
      </div>
    </main>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script>
    (function () {
      var totalDevicesEl = document.getElementById("statTotalDevices");
      var totalTypesEl = document.getElementById("statTotalTypes");
      var totalFooterEl = document.getElementById("statTotalFooter");
      var activeDevicesEl = document.getElementById("statActiveDevices");
      var statusSplitEl = document.getElementById("statStatusSplit");
      var statusFooterEl = document.getElementById("statStatusFooter");
      var floodDevicesEl = document.getElementById("statFloodDevices");
      var typesFooterEl = document.getElementById("statTypesFooter");
      var monitorStatusBar = document.getElementById("monitorStatusBar");
      var stationSelect = document.getElementById("monitorStation");
      var floodSubtitleEl = document.getElementById("floodChartSubtitle");
      var floodStatsEl = document.getElementById("monitorFloodStats");
      var btnSim = document.getElementById("btnMonitorSimulate");
      var btnGeoSim = document.getElementById("btnGeoSimulate");
      var btnQuakeSim = document.getElementById("btnQuakeSimulate");
      var floodCanvas = document.getElementById("monitorFloodChart");
      var geoStationSelect = document.getElementById("monitorGeoStation");
      var quakeStationSelect = document.getElementById("monitorQuakeStation");
      var geoSubtitleEl = document.getElementById("geoChartSubtitle");
      var quakeSubtitleEl = document.getElementById("quakeChartSubtitle");
      var geoStatsEl = document.getElementById("monitorGeoStats");
      var quakeStatsEl = document.getElementById("monitorQuakeStats");
      var geoCanvas = document.getElementById("monitorGeoChart");
      var quakeCanvas = document.getElementById("monitorQuakeChart");
      if (!window.Chart) {
        if (monitorStatusBar) {
          monitorStatusBar.innerHTML = "Status: <span>Gagal memuat library Chart.js</span>";
        }
        return;
      }

      var floodCtx = floodCanvas.getContext("2d");
      var floodChart = null;
      var floodStations = [];
      var geoCtx = geoCanvas ? geoCanvas.getContext("2d") : null;
      var quakeCtx = quakeCanvas ? quakeCanvas.getContext("2d") : null;
      var geoChart = null;
      var quakeChart = null;
      var geoStations = [];
      var quakeStations = [];
      var autoSimInterval = null;

      function setMonitorStatus(text) {
        if (!monitorStatusBar) {
          return;
        }
        monitorStatusBar.innerHTML = "Status: <span>" + text + "</span>";
      }

      function statusLabel(status) {
        if (status === "bahaya") {
          return "Bahaya";
        }
        if (status === "siaga") {
          return "Siaga";
        }
        if (status === "waspada") {
          return "Waspada";
        }
        return "Normal";
      }

      function statusColor(status) {
        if (status === "bahaya") {
          return "#ef4444";
        }
        if (status === "siaga") {
          return "#f97316";
        }
        if (status === "waspada") {
          return "#eab308";
        }
        return "#22c55e";
      }

      function buildFloodGradient(ctx) {
        var gradient = ctx.createLinearGradient(0, 0, 0, 260);
        gradient.addColorStop(0, "rgba(56,189,248,0.5)");
        gradient.addColorStop(0.5, "rgba(37,99,235,0.18)");
        gradient.addColorStop(1, "rgba(15,23,42,0.02)");
        return gradient;
      }

      function renderFloodChart(rows) {
        var labels = [];
        var values = [];
        for (var i = 0; i < rows.length; i++) {
          labels.push(rows[i].measured_at);
          values.push(rows[i].water_level_cm);
        }
        if (floodChart) {
          floodChart.data.labels = labels;
          floodChart.data.datasets[0].data = values;
          floodChart.update();
          return;
        }
        var gradient = buildFloodGradient(floodCtx);
        floodChart = new Chart(floodCtx, {
          type: "line",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Level air sungai (cm)",
                data: values,
                borderColor: "#0ea5e9",
                backgroundColor: gradient,
                borderWidth: 2,
                tension: 0.25,
                pointRadius: 0,
                fill: true
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                ticks: {
                  color: "#9ca3af",
                  maxTicksLimit: 7
                },
                grid: {
                  color: "rgba(148,163,184,0.2)"
                }
              },
              y: {
                beginAtZero: false,
                ticks: {
                  color: "#9ca3af"
                },
                grid: {
                  color: "rgba(148,163,184,0.2)"
                }
              }
            },
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                mode: "index",
                intersect: false
              }
            },
            interaction: {
              mode: "index",
              intersect: false
            }
          }
        });
      }

      function renderFloodStats(stats) {
        if (!floodStatsEl) {
          return;
        }
        if (!stats || stats.count === 0) {
          floodStatsEl.textContent = "Belum ada data simulasi untuk stasiun ini.";
          return;
        }
        var lastLabel = statusLabel(stats.last_status);
        var lastColor = statusColor(stats.last_status);
        var avgText = stats.avg_level !== null ? stats.avg_level.toFixed(1) : "-";
        floodStatsEl.innerHTML =
          "Sampel: " + stats.count +
          " · Min: " + stats.min_level + " cm" +
          " · Maks: " + stats.max_level + " cm" +
          " · Rata-rata: " + avgText + " cm" +
          "<br>Level terakhir: " + stats.last_level + " cm" +
          " · Status: <span style=\"font-weight:600;color:" + lastColor + ";\">" + lastLabel + "</span>" +
          (stats.last_measured_at ? " · Diperbarui: " + stats.last_measured_at : "");
      }

      function buildGeoGradient(ctx) {
        var gradient = ctx.createLinearGradient(0, 0, 0, 260);
        gradient.addColorStop(0, "rgba(249,115,22,0.45)");
        gradient.addColorStop(0.5, "rgba(251,191,36,0.24)");
        gradient.addColorStop(1, "rgba(15,23,42,0.02)");
        return gradient;
      }

      function buildQuakeGradient(ctx) {
        var gradient = ctx.createLinearGradient(0, 0, 0, 260);
        gradient.addColorStop(0, "rgba(239,68,68,0.5)");
        gradient.addColorStop(0.5, "rgba(248,113,113,0.26)");
        gradient.addColorStop(1, "rgba(15,23,42,0.02)");
        return gradient;
      }

      function renderGeoChart(rows) {
        if (!geoCtx) {
          return;
        }
        var labels = [];
        var values = [];
        for (var i = 0; i < rows.length; i++) {
          labels.push(rows[i].measured_at);
          values.push(rows[i].water_level_cm);
        }
        if (geoChart) {
          geoChart.data.labels = labels;
          geoChart.data.datasets[0].data = values;
          geoChart.update();
          return;
        }
        var gradient = buildGeoGradient(geoCtx);
        geoChart = new Chart(geoCtx, {
          type: "line",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Pergerakan tanah (cm)",
                data: values,
                borderColor: "#f97316",
                backgroundColor: gradient,
                borderWidth: 2,
                tension: 0.3,
                pointRadius: 0,
                fill: true
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                ticks: {
                  color: "#fbbf24",
                  maxTicksLimit: 7
                },
                grid: {
                  color: "rgba(248,250,252,0.12)"
                }
              },
              y: {
                ticks: {
                  color: "#fed7aa"
                },
                grid: {
                  color: "rgba(248,250,252,0.12)"
                }
              }
            },
            plugins: {
              legend: {
                display: false
              }
            }
          }
        });
      }

      function renderGeoStats(stats) {
        if (!geoStatsEl) {
          return;
        }
        if (!stats || stats.count === 0) {
          geoStatsEl.textContent = "Belum ada data pergerakan tanah untuk stasiun ini.";
          return;
        }
        var avgText = stats.avg_level !== null ? stats.avg_level.toFixed(1) : "-";
        geoStatsEl.innerHTML =
          "Sampel: " + stats.count +
          " · Min: " + stats.min_level + " cm" +
          " · Maks: " + stats.max_level + " cm" +
          " · Rata-rata: " + avgText + " cm" +
          "<br>Pergerakan terakhir: " + stats.last_level + " cm" +
          (stats.last_measured_at ? " · Diperbarui: " + stats.last_measured_at : "");
      }

      function renderQuakeChart(rows) {
        if (!quakeCtx) {
          return;
        }
        var labels = [];
        var values = [];
        for (var i = 0; i < rows.length; i++) {
          labels.push(rows[i].measured_at);
          values.push(rows[i].water_level_cm);
        }
        if (quakeChart) {
          quakeChart.data.labels = labels;
          quakeChart.data.datasets[0].data = values;
          quakeChart.update();
          return;
        }
        var gradient = buildQuakeGradient(quakeCtx);
        quakeChart = new Chart(quakeCtx, {
          type: "line",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Level getaran tanah",
                data: values,
                borderColor: "#ef4444",
                backgroundColor: gradient,
                borderWidth: 2,
                tension: 0.3,
                pointRadius: 0,
                fill: true
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                ticks: {
                  color: "#fecaca",
                  maxTicksLimit: 7
                },
                grid: {
                  color: "rgba(248,250,252,0.12)"
                }
              },
              y: {
                ticks: {
                  color: "#fee2e2"
                },
                grid: {
                  color: "rgba(248,250,252,0.12)"
                }
              }
            },
            plugins: {
              legend: {
                display: false
              }
            }
          }
        });
      }

      function renderQuakeStats(stats) {
        if (!quakeStatsEl) {
          return;
        }
        if (!stats || stats.count === 0) {
          quakeStatsEl.textContent = "Belum ada data level getaran untuk stasiun ini.";
          return;
        }
        var avgText = stats.avg_level !== null ? stats.avg_level.toFixed(1) : "-";
        quakeStatsEl.innerHTML =
          "Sampel: " + stats.count +
          " · Min: " + stats.min_level +
          " · Maks: " + stats.max_level +
          " · Rata-rata: " + avgText +
          "<br>Level terakhir: " + stats.last_level +
          (stats.last_measured_at ? " · Diperbarui: " + stats.last_measured_at : "");
      }

      function loadFloodHistory(sensorCode) {
        if (!sensorCode) {
          if (floodSubtitleEl) {
            floodSubtitleEl.textContent = "Belum ada stasiun FloodGuard.";
          }
          renderFloodStats(null);
          return;
        }
        if (floodSubtitleEl) {
          floodSubtitleEl.textContent = "Memuat riwayat level untuk " + sensorCode + "…";
        }
        fetch("ews_levels_api.php?action=history&sensor_code=" + encodeURIComponent(sensorCode) + "&limit=60")
          .then(function (response) {
            if (!response.ok) {
              throw new Error("HTTP " + response.status);
            }
            return response.json();
          })
          .then(function (json) {
            if (!json || !json.success || !Array.isArray(json.data)) {
              throw new Error("Respon riwayat tidak valid");
            }
            renderFloodChart(json.data);
            renderFloodStats(json.stats);
            if (floodSubtitleEl) {
              floodSubtitleEl.textContent =
                json.station && json.station.name
                  ? json.station.name + " (" + json.station.sensor_code + ")"
                  : "Riwayat level sungai";
            }
          })
          .catch(function () {
            if (floodSubtitleEl) {
              floodSubtitleEl.textContent = "Gagal memuat riwayat level sungai.";
            }
            renderFloodStats(null);
          });
      }

      function loadGeoHistory(sensorCode) {
        if (!geoSubtitleEl) {
          return;
        }
        if (!sensorCode) {
          geoSubtitleEl.textContent = "Belum ada stasiun GeoShield.";
          renderGeoStats(null);
          return;
        }
        geoSubtitleEl.textContent = "Memuat pergerakan tanah untuk " + sensorCode + "…";
        fetch("ews_levels_api.php?action=history&sensor_code=" + encodeURIComponent(sensorCode) + "&limit=60")
          .then(function (response) {
            if (!response.ok) {
              throw new Error("HTTP " + response.status);
            }
            return response.json();
          })
          .then(function (json) {
            if (!json || !json.success || !Array.isArray(json.data)) {
              throw new Error("Respon riwayat tidak valid");
            }
            renderGeoChart(json.data);
            renderGeoStats(json.stats);
            if (geoSubtitleEl) {
              geoSubtitleEl.textContent =
                json.station && json.station.name
                  ? json.station.name + " (" + json.station.sensor_code + ")"
                  : "Riwayat pergerakan tanah";
            }
          })
          .catch(function () {
            if (geoSubtitleEl) {
              geoSubtitleEl.textContent = "Gagal memuat riwayat pergerakan tanah.";
            }
            renderGeoStats(null);
          });
      }

      function loadQuakeHistory(sensorCode) {
        if (!quakeSubtitleEl) {
          return;
        }
        if (!sensorCode) {
          quakeSubtitleEl.textContent = "Belum ada stasiun QuakeAlert.";
          renderQuakeStats(null);
          return;
        }
        quakeSubtitleEl.textContent = "Memuat level getaran untuk " + sensorCode + "…";
        fetch("ews_levels_api.php?action=history&sensor_code=" + encodeURIComponent(sensorCode) + "&limit=60")
          .then(function (response) {
            if (!response.ok) {
              throw new Error("HTTP " + response.status);
            }
            return response.json();
          })
          .then(function (json) {
            if (!json || !json.success || !Array.isArray(json.data)) {
              throw new Error("Respon riwayat tidak valid");
            }
            renderQuakeChart(json.data);
            renderQuakeStats(json.stats);
            if (quakeSubtitleEl) {
              quakeSubtitleEl.textContent =
                json.station && json.station.name
                  ? json.station.name + " (" + json.station.sensor_code + ")"
                  : "Riwayat level getaran tanah";
            }
          })
          .catch(function () {
            if (quakeSubtitleEl) {
              quakeSubtitleEl.textContent = "Gagal memuat riwayat level getaran tanah.";
            }
            renderQuakeStats(null);
          });
      }

      function simulateOnce() {
        var code = stationSelect ? stationSelect.value : "";
        if (!code) {
          return;
        }
        if (btnSim) {
          btnSim.disabled = true;
        }
        fetch("ews_levels_api.php?action=simulate&sensor_code=" + encodeURIComponent(code))
          .then(function (response) {
            if (!response.ok) {
              throw new Error("HTTP " + response.status);
            }
            return response.json();
          })
          .then(function () {
            loadFloodHistory(code);
          })
          .catch(function () {
            if (floodStatsEl) {
              floodStatsEl.textContent = "Gagal menjalankan simulasi level air.";
            }
          })
          .finally(function () {
            if (btnSim) {
              btnSim.disabled = false;
            }
          });
      }

      function simulateGeoOnce() {
        var code = geoStationSelect ? geoStationSelect.value : "";
        if (!code) {
          return;
        }
        if (btnGeoSim) {
          btnGeoSim.disabled = true;
        }
        fetch("ews_levels_api.php?action=simulate&sensor_code=" + encodeURIComponent(code))
          .then(function (response) {
            if (!response.ok) {
              throw new Error("HTTP " + response.status);
            }
            return response.json();
          })
          .then(function () {
            loadGeoHistory(code);
          })
          .catch(function () {
            if (geoStatsEl) {
              geoStatsEl.textContent = "Gagal menjalankan simulasi pergerakan tanah.";
            }
          })
          .finally(function () {
            if (btnGeoSim) {
              btnGeoSim.disabled = false;
            }
          });
      }

      function simulateQuakeOnce() {
        var code = quakeStationSelect ? quakeStationSelect.value : "";
        if (!code) {
          return;
        }
        if (btnQuakeSim) {
          btnQuakeSim.disabled = true;
        }
        fetch("ews_levels_api.php?action=simulate&sensor_code=" + encodeURIComponent(code))
          .then(function (response) {
            if (!response.ok) {
              throw new Error("HTTP " + response.status);
            }
            return response.json();
          })
          .then(function () {
            loadQuakeHistory(code);
          })
          .catch(function () {
            if (quakeStatsEl) {
              quakeStatsEl.textContent = "Gagal menjalankan simulasi level getaran tanah.";
            }
          })
          .finally(function () {
            if (btnQuakeSim) {
              btnQuakeSim.disabled = false;
            }
          });
      }

      function updateSummary(stations) {
        var total = stations.length;
        var active = 0;
        var inactive = 0;
        var typeCounts = {
          flood: 0,
          geo: 0,
          quake: 0,
          magma: 0,
          weather: 0
        };
        for (var i = 0; i < stations.length; i++) {
          var row = stations[i];
          if (!row) {
            continue;
          }
          var status = row.status || "";
          if (status === "aktif") {
            active++;
          } else {
            inactive++;
          }
          var type = row.type || "";
          if (typeCounts.hasOwnProperty(type)) {
            typeCounts[type]++;
          }
        }
        var distinctTypes = 0;
        var typeKeys = ["flood", "geo", "quake", "magma", "weather"];
        for (var j = 0; j < typeKeys.length; j++) {
          if (typeCounts[typeKeys[j]] > 0) {
            distinctTypes++;
          }
        }
        if (totalDevicesEl) {
          totalDevicesEl.textContent = String(total);
        }
        if (totalTypesEl) {
          totalTypesEl.textContent = distinctTypes + " jenis";
        }
        if (totalFooterEl) {
          totalFooterEl.textContent = "Termasuk FloodGuard, GeoShield, dan tipe Orion lainnya.";
        }
        if (activeDevicesEl) {
          activeDevicesEl.textContent = String(active);
        }
        if (statusSplitEl) {
          statusSplitEl.textContent = active + " aktif · " + inactive + " nonaktif";
        }
        if (statusFooterEl) {
          if (total > 0) {
            var percent = ((active / total) * 100).toFixed(1);
            statusFooterEl.textContent = "Sekitar " + percent + "% perangkat dalam status aktif.";
          } else {
            statusFooterEl.textContent = "Belum ada perangkat EWS terdaftar.";
          }
        }
        if (floodDevicesEl) {
          floodDevicesEl.textContent = String(typeCounts.flood);
        }
        if (typesFooterEl) {
          typesFooterEl.textContent =
            "GeoShield: " + typeCounts.geo +
            " · QuakeAlert: " + typeCounts.quake +
            " · MagmaShield: " + typeCounts.magma +
            " · WeatherHub: " + typeCounts.weather;
        }
      }

      function populateFloodStations(stations) {
        floodStations = [];
        if (stationSelect) {
          stationSelect.innerHTML = "";
        }
        for (var i = 0; i < stations.length; i++) {
          var row = stations[i];
          if (!row || row.type !== "flood") {
            continue;
          }
          if (!row.sensor_code) {
            continue;
          }
          floodStations.push(row);
        }
        if (!stationSelect) {
          return;
        }
        if (!floodStations.length) {
          var opt = document.createElement("option");
          opt.value = "";
          opt.textContent = "Belum ada stasiun FloodGuard";
          stationSelect.appendChild(opt);
          stationSelect.disabled = true;
          if (btnSim) {
            btnSim.disabled = true;
          }
          return;
        }
        stationSelect.disabled = false;
        if (btnSim) {
          btnSim.disabled = false;
        }
        for (var j = 0; j < floodStations.length; j++) {
          var st = floodStations[j];
          var option = document.createElement("option");
          option.value = st.sensor_code;
          option.textContent = st.name ? st.name + " (" + st.sensor_code + ")" : st.sensor_code;
          stationSelect.appendChild(option);
        }
      }

      function populateGeoStations(stations) {
        geoStations = [];
        if (geoStationSelect) {
          geoStationSelect.innerHTML = "";
        }
        for (var i = 0; i < stations.length; i++) {
          var row = stations[i];
          if (!row || row.type !== "geo") {
            continue;
          }
          if (!row.sensor_code) {
            continue;
          }
          geoStations.push(row);
        }
        if (!geoStationSelect) {
          return;
        }
        if (!geoStations.length) {
          var opt = document.createElement("option");
          opt.value = "";
          opt.textContent = "Belum ada stasiun GeoShield";
          geoStationSelect.appendChild(opt);
          geoStationSelect.disabled = true;
          return;
        }
        geoStationSelect.disabled = false;
        for (var j = 0; j < geoStations.length; j++) {
          var st = geoStations[j];
          var option = document.createElement("option");
          option.value = st.sensor_code;
          option.textContent = st.name ? st.name + " (" + st.sensor_code + ")" : st.sensor_code;
          geoStationSelect.appendChild(option);
        }
      }

      function populateQuakeStations(stations) {
        quakeStations = [];
        if (quakeStationSelect) {
          quakeStationSelect.innerHTML = "";
        }
        for (var i = 0; i < stations.length; i++) {
          var row = stations[i];
          if (!row || row.type !== "quake") {
            continue;
          }
          if (!row.sensor_code) {
            continue;
          }
          quakeStations.push(row);
        }
        if (!quakeStationSelect) {
          return;
        }
        if (!quakeStations.length) {
          var opt = document.createElement("option");
          opt.value = "";
          opt.textContent = "Belum ada stasiun QuakeAlert";
          quakeStationSelect.appendChild(opt);
          quakeStationSelect.disabled = true;
          return;
        }
        quakeStationSelect.disabled = false;
        for (var j = 0; j < quakeStations.length; j++) {
          var st = quakeStations[j];
          var option = document.createElement("option");
          option.value = st.sensor_code;
          option.textContent = st.name ? st.name + " (" + st.sensor_code + ")" : st.sensor_code;
          quakeStationSelect.appendChild(option);
        }
      }

      function loadStations() {
        setMonitorStatus("Memuat daftar perangkat EWS dari server…");
        fetch("ews_api.php?action=list")
          .then(function (response) {
            if (!response.ok) {
              throw new Error("HTTP " + response.status);
            }
            return response.json();
          })
          .then(function (json) {
            if (!json || !json.success || !Array.isArray(json.data)) {
              throw new Error("Respon EWS tidak valid");
            }
            var stations = json.data;
            updateSummary(stations);
            populateFloodStations(stations);
            if (stationSelect && stationSelect.value) {
              loadFloodHistory(stationSelect.value);
            }
            populateGeoStations(stations);
            if (geoStationSelect && geoStationSelect.value) {
              loadGeoHistory(geoStationSelect.value);
            }
            populateQuakeStations(stations);
            if (quakeStationSelect && quakeStationSelect.value) {
              loadQuakeHistory(quakeStationSelect.value);
            }
            setMonitorStatus("Data perangkat dan statistik telah dimuat.");
          })
          .catch(function () {
            setMonitorStatus("Gagal memuat data perangkat EWS dari server.");
          });
      }

      if (stationSelect) {
        stationSelect.addEventListener("change", function () {
          var code = stationSelect.value;
          loadFloodHistory(code);
        });
      }

      if (geoStationSelect) {
        geoStationSelect.addEventListener("change", function () {
          var code = geoStationSelect.value;
          loadGeoHistory(code);
        });
      }

      if (quakeStationSelect) {
        quakeStationSelect.addEventListener("change", function () {
          var code = quakeStationSelect.value;
          loadQuakeHistory(code);
        });
      }

      if (btnSim) {
        btnSim.addEventListener("click", function () {
          simulateOnce();
        });
      }

      if (btnGeoSim) {
        btnGeoSim.addEventListener("click", function () {
          simulateGeoOnce();
        });
      }

      if (btnQuakeSim) {
        btnQuakeSim.addEventListener("click", function () {
          simulateQuakeOnce();
        });
      }

      loadStations();

      if (autoSimInterval) {
        clearInterval(autoSimInterval);
      }
      autoSimInterval = setInterval(function () {
        if (stationSelect && stationSelect.value) {
          simulateOnce();
        }
        if (geoStationSelect && geoStationSelect.value) {
          simulateGeoOnce();
        }
        if (quakeStationSelect && quakeStationSelect.value) {
          simulateQuakeOnce();
        }
      }, 20000);
    })();
  </script>
</body>
</html>
