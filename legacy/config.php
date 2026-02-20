<?php

$DB_HOST = getenv("DB_HOST") !== false ? getenv("DB_HOST") : "localhost";
$DB_NAME = getenv("DB_NAME") !== false ? getenv("DB_NAME") : "sungai_app";
$DB_USER = getenv("DB_USER") !== false ? getenv("DB_USER") : "root";
$DB_PASS = getenv("DB_PASS") !== false ? getenv("DB_PASS") : "";

function get_pdo()
{
    static $pdo = null;
    global $DB_HOST, $DB_NAME, $DB_USER, $DB_PASS;
    if ($pdo === null) {
        $dsn = "mysql:host=" . $DB_HOST . ";dbname=" . $DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ];
        $pdo = new PDO($dsn, $DB_USER, $DB_PASS, $options);
    }
    return $pdo;
}
