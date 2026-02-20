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

$action = isset($_GET["action"]) ? $_GET["action"] : "history";

function findStationByCode(PDO $pdo, $sensorCode)
{
    $stmt = $pdo->prepare("SELECT id, sensor_code, type, status, name FROM ews_stations WHERE sensor_code = ? LIMIT 1");
    $stmt->execute([$sensorCode]);
    $row = $stmt->fetch();
    if (!$row) {
        return null;
    }
    return $row;
}

if ($action === "simulate") {
    $sensorCode = isset($_GET["sensor_code"]) ? trim($_GET["sensor_code"]) : "";

    try {
        $stations = [];
        if ($sensorCode !== "") {
            $station = findStationByCode($pdo, $sensorCode);
            if (
                $station &&
                in_array($station["type"], ["flood", "geo", "quake"], true) &&
                $station["status"] === "aktif"
            ) {
                $stations[] = $station;
            }
        } else {
            $stmt = $pdo->query(
                "SELECT id, sensor_code, type, status, name
                 FROM ews_stations
                 WHERE type IN ('flood', 'geo', 'quake') AND status = 'aktif'"
            );
            $stations = $stmt->fetchAll();
        }

        if (!$stations) {
            echo json_encode([
                "success" => true,
                "message" => "Tidak ada stasiun EWS (flood/geo/quake) aktif untuk disimulasikan",
                "inserted" => 0
            ]);
            exit;
        }

        $selectLast = $pdo->prepare(
            "SELECT water_level_cm FROM ews_levels WHERE station_id = ? ORDER BY measured_at DESC, id DESC LIMIT 1"
        );
        $insertLevel = $pdo->prepare(
            "INSERT INTO ews_levels (station_id, water_level_cm, status, note) VALUES (?, ?, ?, ?)"
        );

        $inserted = 0;
        $resultStations = [];

        foreach ($stations as $station) {
            $stationId = (int) $station["id"];

            $selectLast->execute([$stationId]);
            $last = $selectLast->fetch();
            $lastLevel = $last ? (int) $last["water_level_cm"] : null;

            $type = $station["type"];
            $newLevel = 0;
            $status = "normal";
            $note = "";

            if ($type === "flood") {
                if ($lastLevel === null) {
                    $lastLevel = 140;
                }
                $delta = random_int(-5, 8);
                $newLevel = $lastLevel + $delta;
                if ($newLevel < 80) {
                    $newLevel = 80;
                } elseif ($newLevel > 320) {
                    $newLevel = 320;
                }

                if ($newLevel >= 250) {
                    $status = "bahaya";
                } elseif ($newLevel >= 200) {
                    $status = "siaga";
                } elseif ($newLevel >= 150) {
                    $status = "waspada";
                } else {
                    $status = "normal";
                }

                if ($status === "normal") {
                    $note = "Level aman";
                } elseif ($status === "waspada") {
                    $note = "Level meningkat, waspada banjir";
                } elseif ($status === "siaga") {
                    $note = "Level tinggi, siaga banjir";
                } elseif ($status === "bahaya") {
                    $note = "Level sangat tinggi, potensi banjir";
                }
            } elseif ($type === "geo") {
                if ($lastLevel === null) {
                    $lastLevel = 2;
                }
                $delta = random_int(-2, 4);
                $newLevel = $lastLevel + $delta;
                if ($newLevel < 0) {
                    $newLevel = 0;
                } elseif ($newLevel > 40) {
                    $newLevel = 40;
                }

                if ($newLevel >= 25) {
                    $status = "bahaya";
                } elseif ($newLevel >= 15) {
                    $status = "siaga";
                } elseif ($newLevel >= 5) {
                    $status = "waspada";
                } else {
                    $status = "normal";
                }

                if ($status === "normal") {
                    $note = "Pergerakan tanah stabil";
                } elseif ($status === "waspada") {
                    $note = "Pergerakan tanah mulai meningkat";
                } elseif ($status === "siaga") {
                    $note = "Pergerakan signifikan, siaga longsor";
                } elseif ($status === "bahaya") {
                    $note = "Pergerakan ekstrem, potensi longsor tinggi";
                }
            } elseif ($type === "quake") {
                if ($lastLevel === null) {
                    $lastLevel = 1;
                }
                $delta = random_int(-1, 3);
                $newLevel = $lastLevel + $delta;
                if ($newLevel < 0) {
                    $newLevel = 0;
                } elseif ($newLevel > 10) {
                    $newLevel = 10;
                }

                if ($newLevel >= 7) {
                    $status = "bahaya";
                } elseif ($newLevel >= 4) {
                    $status = "siaga";
                } elseif ($newLevel >= 2) {
                    $status = "waspada";
                } else {
                    $status = "normal";
                }

                if ($status === "normal") {
                    $note = "Getaran tanah sangat lemah";
                } elseif ($status === "waspada") {
                    $note = "Getaran tanah mulai terasa";
                } elseif ($status === "siaga") {
                    $note = "Getaran kuat, siaga gempa";
                } elseif ($status === "bahaya") {
                    $note = "Getaran sangat kuat, potensi kerusakan";
                }
            } else {
                continue;
            }

            $insertLevel->execute([$stationId, $newLevel, $status, $note]);
            $inserted++;

            $resultStations[] = [
                "sensor_code" => $station["sensor_code"],
                "name" => $station["name"],
                "water_level_cm" => $newLevel,
                "status" => $status
            ];
        }

        echo json_encode([
            "success" => true,
            "inserted" => $inserted,
            "stations" => $resultStations
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "Gagal menjalankan simulasi data EWS"
        ]);
    }
    exit;
}

if ($action === "history") {
    $sensorCode = isset($_GET["sensor_code"]) ? trim($_GET["sensor_code"]) : "";
    if ($sensorCode === "") {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Parameter sensor_code wajib diisi"
        ]);
        exit;
    }

    $limit = isset($_GET["limit"]) ? (int) $_GET["limit"] : 60;
    if ($limit < 1) {
        $limit = 1;
    } elseif ($limit > 240) {
        $limit = 240;
    }

    $station = findStationByCode($pdo, $sensorCode);
    if (!$station) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "error" => "Stasiun dengan kode tersebut tidak ditemukan"
        ]);
        exit;
    }

    try {
        $stmt = $pdo->prepare(
            "SELECT measured_at, water_level_cm, status
             FROM ews_levels
             WHERE station_id = ?
             ORDER BY measured_at DESC, id DESC
             LIMIT " . $limit
        );
        $stmt->execute([(int) $station["id"]]);
        $rows = $stmt->fetchAll();

        if ($rows) {
            $rows = array_reverse($rows);
        }

        $count = count($rows);
        $minLevel = null;
        $maxLevel = null;
        $sumLevel = 0;
        $lastLevel = null;
        $lastStatus = null;
        $lastMeasuredAt = null;

        foreach ($rows as $row) {
            $level = (int) $row["water_level_cm"];
            if ($minLevel === null || $level < $minLevel) {
                $minLevel = $level;
            }
            if ($maxLevel === null || $level > $maxLevel) {
                $maxLevel = $level;
            }
            $sumLevel += $level;
            $lastLevel = $level;
            $lastStatus = $row["status"];
            $lastMeasuredAt = $row["measured_at"];
        }

        $avgLevel = $count > 0 ? $sumLevel / $count : null;

        echo json_encode([
            "success" => true,
            "station" => [
                "sensor_code" => $station["sensor_code"],
                "name" => $station["name"]
            ],
            "data" => $rows,
            "stats" => [
                "count" => $count,
                "min_level" => $minLevel,
                "max_level" => $maxLevel,
                "avg_level" => $avgLevel,
                "last_level" => $lastLevel,
                "last_status" => $lastStatus,
                "last_measured_at" => $lastMeasuredAt
            ]
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "Gagal mengambil riwayat level air"
        ]);
    }
    exit;
}

http_response_code(400);
echo json_encode([
    "success" => false,
    "error" => "Aksi tidak dikenal"
]);
