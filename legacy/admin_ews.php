<?php

session_start();
if (!isset($_SESSION["is_logged_in"]) || $_SESSION["is_logged_in"] !== true) {
    header("Location: login.php");
    exit;
}

require __DIR__ . "/config.php";

$pdo = get_pdo();
$message = "";
$error = "";
$editing = null;

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $mode = isset($_POST["mode"]) ? $_POST["mode"] : "";
    $id = isset($_POST["id"]) ? (int) $_POST["id"] : 0;
    $name = isset($_POST["name"]) ? trim($_POST["name"]) : "";
    $location = isset($_POST["location"]) ? trim($_POST["location"]) : "";
    $sensorCode = isset($_POST["sensor_code"]) ? trim($_POST["sensor_code"]) : "";
    $status = isset($_POST["status"]) ? trim($_POST["status"]) : "aktif";
    $type = isset($_POST["type"]) ? trim($_POST["type"]) : "";
    $latitude = isset($_POST["latitude"]) ? (float) $_POST["latitude"] : 0.0;
    $longitude = isset($_POST["longitude"]) ? (float) $_POST["longitude"] : 0.0;
    $description = isset($_POST["description"]) ? trim($_POST["description"]) : "";

    if ($mode === "create") {
        if ($name === "" || !$latitude || !$longitude) {
            $error = "Nama, latitude, dan longitude wajib diisi.";
        } else {
            $stmt = $pdo->prepare("INSERT INTO ews_stations (name, location, sensor_code, type, status, latitude, longitude, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$name, $location, $sensorCode, $type, $status, $latitude, $longitude, $description]);
            $message = "Data EWS baru berhasil ditambahkan.";
        }
    } elseif ($mode === "update" && $id > 0) {
        if ($name === "" || !$latitude || !$longitude) {
            $error = "Nama, latitude, dan longitude wajib diisi.";
        } else {
            $stmt = $pdo->prepare("UPDATE ews_stations SET name = ?, location = ?, sensor_code = ?, type = ?, status = ?, latitude = ?, longitude = ?, description = ? WHERE id = ?");
            $stmt->execute([$name, $location, $sensorCode, $type, $status, $latitude, $longitude, $description, $id]);
            $message = "Data EWS berhasil diperbarui.";
        }
    } elseif ($mode === "delete" && $id > 0) {
        $stmt = $pdo->prepare("DELETE FROM ews_stations WHERE id = ?");
        $stmt->execute([$id]);
        $message = "Data EWS berhasil dihapus.";
    }
}

if (isset($_GET["edit"])) {
    $editId = (int) $_GET["edit"];
    if ($editId > 0) {
        $stmt = $pdo->prepare("SELECT * FROM ews_stations WHERE id = ?");
        $stmt->execute([$editId]);
        $editing = $stmt->fetch();
    }
}

$stmt = $pdo->query("SELECT * FROM ews_stations ORDER BY id DESC");
$rows = $stmt->fetchAll();

function h($value)
{
    return htmlspecialchars((string) $value, ENT_QUOTES, "UTF-8");
}

?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Admin EWS Banjarnegara</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""
  >
  <style>
    body {
      margin: 0;
      padding: 24px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: radial-gradient(circle at top, #1e293b 0, #020617 55%);
      color: #e5e7eb;
    }
    .shell {
      max-width: 100%;
      margin: 0;
      background: rgba(15, 23, 42, 0.96);
      border-radius: 18px;
      border: 1px solid rgba(148, 163, 184, 0.4);
      padding: 20px 22px 24px;
      box-shadow: 0 25px 60px rgba(15, 23, 42, 0.8);
    }
    h1 {
      margin: 0 0 4px 0;
      font-size: 1.25rem;
    }
    .subtitle {
      font-size: 0.82rem;
      color: #9ca3af;
      margin-bottom: 8px;
    }
    .subtitle-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }
    .nav-link {
      font-size: 0.78rem;
      padding: 4px 10px;
      border-radius: 6px;
      text-decoration: none;
      border: 1px solid rgba(148, 163, 184, 0.6);
      color: #e5e7eb;
      background: radial-gradient(circle at 0 0, rgba(59, 130, 246, 0.4), rgba(15, 23, 42, 0.95));
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 160ms ease, border-color 160ms ease, transform 120ms ease;
    }
    .nav-link:hover {
      background: radial-gradient(circle at 0 0, rgba(96, 165, 250, 0.9), rgba(15, 23, 42, 0.98));
      border-color: rgba(129, 140, 248, 0.9);
      transform: translateY(-0.5px);
    }
    .nav-link-secondary {
      background: rgba(15, 23, 42, 0.96);
    }
    .grid {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.5fr);
      gap: 18px;
    }
    .card {
      border-radius: 14px;
      border: 1px solid rgba(148, 163, 184, 0.4);
      padding: 14px 14px 16px;
      background: radial-gradient(circle at top left, rgba(15, 118, 110, 0.2), rgba(15, 23, 42, 0.98));
    }
    .card-table {
      border-radius: 14px;
      border: 1px solid rgba(148, 163, 184, 0.4);
      padding: 14px;
      background: radial-gradient(circle at top right, rgba(30, 64, 175, 0.25), rgba(15, 23, 42, 0.98));
      overflow-x: auto;
    }
    .card h2 {
      margin: 0 0 10px 0;
      font-size: 1rem;
    }
    label {
      display: block;
      font-size: 0.78rem;
      color: #9ca3af;
      margin-bottom: 3px;
    }
    input[type="text"],
    input[type="number"],
    select,
    textarea {
      width: 100%;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.6);
      background: rgba(15, 23, 42, 0.96);
      color: #e5e7eb;
      font-size: 0.82rem;
      padding: 6px 8px;
      box-sizing: border-box;
    }
    textarea {
      min-height: 60px;
      resize: vertical;
    }
    .form-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px 10px;
      margin-bottom: 8px;
    }
    .form-row-full {
      margin-bottom: 8px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px 11px;
      border-radius: 6px;
      border: none;
      font-size: 0.8rem;
      cursor: pointer;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: #022c22;
      font-weight: 600;
    }
    .btn-secondary {
      background: rgba(15, 23, 42, 0.9);
      color: #e5e7eb;
      border: 1px solid rgba(148, 163, 184, 0.7);
    }
    .btn-danger {
      background: linear-gradient(135deg, #fb7185, #ef4444);
      color: #fee2e2;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
    }
    th,
    td {
      border-bottom: 1px solid rgba(51, 65, 85, 0.9);
      padding: 6px 6px;
      text-align: left;
      white-space: nowrap;
    }
    th {
      color: #9ca3af;
      font-weight: 500;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 2px 7px;
      border-radius: 999px;
      font-size: 0.7rem;
    }
    .status-aktif {
      background: rgba(34, 197, 94, 0.2);
      color: #bbf7d0;
    }
    .status-nonaktif {
      background: rgba(248, 113, 113, 0.2);
      color: #fecaca;
    }
    .flash {
      margin-bottom: 10px;
      font-size: 0.82rem;
      padding: 6px 9px;
      border-radius: 10px;
    }
    .flash-ok {
      background: rgba(22, 163, 74, 0.2);
      border: 1px solid rgba(22, 163, 74, 0.7);
      color: #bbf7d0;
    }
    .flash-error {
      background: rgba(248, 113, 113, 0.16);
      border: 1px solid rgba(248, 113, 113, 0.7);
      color: #fecaca;
    }
    .map-pick-shell {
      margin-top: 6px;
    }
    .map-pick {
      width: 100%;
      height: 260px;
      border-radius: 14px;
      border: 1px solid rgba(148, 163, 184, 0.4);
      overflow: hidden;
    }
    .map-pick-hint {
      margin-top: 4px;
      font-size: 0.75rem;
      color: #9ca3af;
    }
    @media (max-width: 900px) {
      .grid {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <h1>Admin Lokasi EWS Banjarnegara</h1>
    <div class="subtitle">
      Kelola titik sensor EWS yang akan ditampilkan pada peta utama.
    </div>
    <div class="subtitle-links">
      <a href="monitor_ews.php" class="nav-link">Buka dasbor monitoring & statistik</a>
      <a href="index.html" class="nav-link nav-link-secondary">Kembali ke peta utama</a>
      <a href="login.php?logout=1" class="nav-link nav-link-secondary">Keluar</a>
    </div>

    <?php if ($message !== ""): ?>
      <div class="flash flash-ok"><?php echo h($message); ?></div>
    <?php endif; ?>

    <?php if ($error !== ""): ?>
      <div class="flash flash-error"><?php echo h($error); ?></div>
    <?php endif; ?>

    <div class="grid">
      <div class="card">
        <h2><?php echo $editing ? "Edit lokasi EWS" : "Tambah lokasi EWS baru"; ?></h2>
        <form method="post">
          <input type="hidden" name="id" value="<?php echo $editing ? (int) $editing["id"] : 0; ?>">
          <input type="hidden" name="mode" value="<?php echo $editing ? "update" : "create"; ?>">

          <div class="form-row">
            <div>
              <label for="name">Nama EWS</label>
              <input type="text" id="name" name="name" value="<?php echo $editing ? h($editing["name"]) : ""; ?>">
            </div>
            <div>
              <label for="sensor_code">Kode / ID sensor</label>
              <input type="text" id="sensor_code" name="sensor_code" value="<?php echo $editing ? h($editing["sensor_code"]) : ""; ?>">
            </div>
          </div>

          <div class="form-row-full">
            <label for="type">Jenis Orion</label>
            <select id="type" name="type">
              <option value="">Pilih jenis Orion</option>
              <option value="flood" <?php echo $editing && $editing["type"] === "flood" ? "selected" : ""; ?>>Orion FloodGuard (banjir)</option>
              <option value="geo" <?php echo $editing && $editing["type"] === "geo" ? "selected" : ""; ?>>Orion GeoShield (longsor)</option>
              <option value="quake" <?php echo $editing && $editing["type"] === "quake" ? "selected" : ""; ?>>Orion QuakeAlert (gempa)</option>
              <option value="magma" <?php echo $editing && $editing["type"] === "magma" ? "selected" : ""; ?>>Orion MagmaShield (gunung api)</option>
              <option value="weather" <?php echo $editing && $editing["type"] === "weather" ? "selected" : ""; ?>>Orion WeatherHub (cuaca)</option>
            </select>
          </div>

          <div class="form-row">
            <div>
              <label for="latitude">Latitude</label>
              <input type="number" id="latitude" name="latitude" step="0.000001" value="<?php echo $editing ? h($editing["latitude"]) : ""; ?>">
            </div>
            <div>
              <label for="longitude">Longitude</label>
              <input type="number" id="longitude" name="longitude" step="0.000001" value="<?php echo $editing ? h($editing["longitude"]) : ""; ?>">
            </div>
          </div>

          <div class="form-row-full">
            <div class="map-pick-shell">
              <div id="mapPicker" class="map-pick"></div>
              <div class="map-pick-hint">
                Klik pada peta di atas untuk mengisi latitude dan longitude secara otomatis.
              </div>
            </div>
          </div>

          <div class="form-row">
            <div>
              <label for="location">Lokasi (desa/kecamatan)</label>
              <input type="text" id="location" name="location" value="<?php echo $editing ? h($editing["location"]) : ""; ?>">
            </div>
            <div>
              <label for="status">Status</label>
              <select id="status" name="status">
                <option value="aktif" <?php echo $editing && $editing["status"] === "aktif" ? "selected" : ""; ?>>Aktif</option>
                <option value="nonaktif" <?php echo $editing && $editing["status"] === "nonaktif" ? "selected" : ""; ?>>Nonaktif</option>
              </select>
            </div>
          </div>

          <div class="form-row-full">
            <label for="description">Keterangan</label>
            <textarea id="description" name="description"><?php echo $editing ? h($editing["description"]) : ""; ?></textarea>
          </div>

          <button type="submit" class="btn">
            <?php echo $editing ? "Simpan perubahan" : "Simpan lokasi EWS"; ?>
          </button>
          <?php if ($editing): ?>
            <a href="admin_ews.php" class="btn btn-secondary" style="margin-left:6px;text-decoration:none;">Batal edit</a>
          <?php endif; ?>
        </form>
      </div>

      <div class="card-table">
        <h2>Daftar lokasi EWS</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama</th>
              <th>Koordinat</th>
              <th>Lokasi</th>
              <th>Kode</th>
              <th>Jenis</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
          <?php if (!$rows): ?>
            <tr>
              <td colspan="8">Belum ada data EWS.</td>
            </tr>
          <?php else: ?>
            <?php foreach ($rows as $row): ?>
              <tr>
                <td><?php echo (int) $row["id"]; ?></td>
                <td><?php echo h($row["name"]); ?></td>
                <td><?php echo h($row["latitude"]); ?>, <?php echo h($row["longitude"]); ?></td>
                <td><?php echo h($row["location"]); ?></td>
                <td><?php echo h($row["sensor_code"]); ?></td>
                <td>
                  <?php
                  $typeLabel = "";
                  if ($row["type"] === "flood") {
                      $typeLabel = "FloodGuard";
                  } elseif ($row["type"] === "geo") {
                      $typeLabel = "GeoShield";
                  } elseif ($row["type"] === "quake") {
                      $typeLabel = "QuakeAlert";
                  } elseif ($row["type"] === "magma") {
                      $typeLabel = "MagmaShield";
                  } elseif ($row["type"] === "weather") {
                      $typeLabel = "WeatherHub";
                  }
                  echo h($typeLabel);
                  ?>
                </td>
                <td>
                  <span class="status-pill <?php echo $row["status"] === "aktif" ? "status-aktif" : "status-nonaktif"; ?>">
                    <?php echo $row["status"] === "aktif" ? "Aktif" : "Nonaktif"; ?>
                  </span>
                </td>
                <td>
                  <a href="admin_ews.php?edit=<?php echo (int) $row["id"]; ?>" class="btn btn-secondary" style="padding:3px 8px;font-size:0.72rem;">Edit</a>
                  <form method="post" style="display:inline;" onsubmit="return confirm('Hapus data EWS ini?');">
                    <input type="hidden" name="id" value="<?php echo (int) $row["id"]; ?>">
                    <input type="hidden" name="mode" value="delete">
                    <button type="submit" class="btn btn-danger" style="padding:3px 8px;font-size:0.72rem;">Hapus</button>
                  </form>
                </td>
              </tr>
            <?php endforeach; ?>
          <?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""
  ></script>
  <script>
    (function () {
      var latInput = document.getElementById("latitude");
      var lngInput = document.getElementById("longitude");
      var typeSelect = document.getElementById("type");
      var mapEl = document.getElementById("mapPicker");
      if (!latInput || !lngInput || !mapEl) {
        return;
      }

      var startLat = latInput.value ? parseFloat(latInput.value) : -7.45;
      var startLng = lngInput.value ? parseFloat(lngInput.value) : 109.68;
      if (isNaN(startLat) || isNaN(startLng)) {
        startLat = -7.45;
        startLng = 109.68;
      }

      var map = L.map(mapEl).setView([startLat, startLng], 10);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(map);

      var marker = null;

      function colorForType(type) {
        if (type === "flood") {
          return "#0ea5e9";
        }
        if (type === "geo") {
          return "#f97316";
        }
        if (type === "quake") {
          return "#ef4444";
        }
        if (type === "magma") {
          return "#a855f7";
        }
        if (type === "weather") {
          return "#22c55e";
        }
        return "#22c55e";
      }

      function updateMarker(lat, lng) {
        var t = typeSelect ? typeSelect.value : "";
        var stroke = colorForType(t);
        if (marker) {
          marker.setLatLng([lat, lng]);
          marker.setStyle({
            color: stroke,
            fillColor: stroke
          });
        } else {
          marker = L.circleMarker([lat, lng], {
            radius: 7,
            color: stroke,
            weight: 2,
            fillColor: stroke,
            fillOpacity: 0.95
          }).addTo(map);
        }
      }

      if (latInput.value && lngInput.value && !isNaN(startLat) && !isNaN(startLng)) {
        updateMarker(startLat, startLng);
      }

      map.on("click", function (e) {
        var lat = e.latlng.lat;
        var lng = e.latlng.lng;
        latInput.value = lat.toFixed(6);
        lngInput.value = lng.toFixed(6);
        updateMarker(lat, lng);
      });

      if (typeSelect) {
        typeSelect.addEventListener("change", function () {
          if (marker) {
            var latLng = marker.getLatLng();
            updateMarker(latLng.lat, latLng.lng);
          }
        });
      }
  </script>
</body>
</html>
