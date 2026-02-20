<?php

header("Content-Type: application/json; charset=utf-8");

require __DIR__ . "/config.php";

try {
    $pdo = get_pdo();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Gagal terhubung ke database"
    ]);
    exit;
}

$action = isset($_GET["action"]) ? $_GET["action"] : "list";

if ($action === "list") {
    try {
        $stmt = $pdo->query(
            "SELECT
                s.id,
                s.name,
                s.latitude,
                s.longitude,
                s.location,
                s.sensor_code,
                s.type,
                s.status,
                (SELECT water_level_cm FROM ews_levels e WHERE e.station_id = s.id ORDER BY e.measured_at DESC, e.id DESC LIMIT 1) AS water_level_cm,
                (SELECT status FROM ews_levels e WHERE e.station_id = s.id ORDER BY e.measured_at DESC, e.id DESC LIMIT 1) AS level_status,
                (SELECT measured_at FROM ews_levels e WHERE e.station_id = s.id ORDER BY e.measured_at DESC, e.id DESC LIMIT 1) AS last_measured_at
             FROM ews_stations s
             ORDER BY s.id DESC"
        );
        $rows = $stmt->fetchAll();
        echo json_encode([
            "success" => true,
            "data" => $rows
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "Gagal mengambil data EWS"
        ]);
    }
    exit;
}

if ($action === "control") {
    $sensorCode = "";
    if (isset($_POST["sensor_code"])) {
        $sensorCode = trim($_POST["sensor_code"]);
    } elseif (isset($_GET["sensor_code"])) {
        $sensorCode = trim($_GET["sensor_code"]);
    }

    $command = "";
    if (isset($_POST["command"])) {
        $command = trim($_POST["command"]);
    } elseif (isset($_GET["command"])) {
        $command = trim($_GET["command"]);
    }

    if ($sensorCode === "" || $command === "") {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Parameter sensor_code dan command wajib diisi"
        ]);
        exit;
    }

    $allowedCommands = ["reboot", "reset", "update", "shutdown"];
    if (!in_array($command, $allowedCommands, true)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Perintah tidak dikenal"
        ]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT id, name, sensor_code, type, status FROM ews_stations WHERE sensor_code = ? LIMIT 1");
        $stmt->execute([$sensorCode]);
        $station = $stmt->fetch();
        if (!$station) {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "error" => "Stasiun dengan kode tersebut tidak ditemukan"
            ]);
            exit;
        }

        echo json_encode([
            "success" => true,
            "message" => "Perintah " . $command . " untuk " . $station["sensor_code"] . " telah diterima",
            "command" => $command,
            "station" => [
                "sensor_code" => $station["sensor_code"],
                "name" => $station["name"],
                "type" => $station["type"],
                "status" => $station["status"]
            ]
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "Gagal memproses perintah kontrol EWS"
        ]);
    }
    exit;
}

http_response_code(400);
echo json_encode([
    "success" => false,
    "error" => "Aksi tidak dikenal"
]);
