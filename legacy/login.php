<?php
session_start();

if (isset($_GET["logout"])) {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), "", time() - 42000, $params["path"], $params["domain"], $params["secure"], $params["httponly"]);
    }
    session_destroy();
    header("Location: login.php");
    exit;
}

$error = "";

if (isset($_SESSION["is_logged_in"]) && $_SESSION["is_logged_in"] === true) {
    header("Location: admin_ews.php");
    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $username = isset($_POST["username"]) ? trim($_POST["username"]) : "";
    $password = isset($_POST["password"]) ? $_POST["password"] : "";

    $validUser = "admin";
    $validPass = "orion123";

    if ($username === $validUser && $password === $validPass) {
        $_SESSION["is_logged_in"] = true;
        $_SESSION["username"] = $username;
        header("Location: admin_ews.php");
        exit;
    } else {
        $error = "Username atau password salah.";
    }
}

function h($value)
{
    return htmlspecialchars((string) $value, ENT_QUOTES, "UTF-8");
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Masuk Orion EWS Banjarnegara</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: stretch;
      justify-content: center;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: radial-gradient(circle at top, #0ea5e9 0, #020617 60%);
      color: #e5e7eb;
    }
    .login-shell {
      width: 100%;
      max-width: 1040px;
      margin: 24px 16px;
      border-radius: 22px;
      border: 1px solid rgba(148, 163, 184, 0.45);
      overflow: hidden;
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
      box-shadow:
        0 30px 90px rgba(15, 23, 42, 0.95),
        0 0 0 1px rgba(15, 23, 42, 0.9);
      background: rgba(15, 23, 42, 0.98);
      backdrop-filter: blur(18px);
    }
    .login-visual {
      position: relative;
      overflow: hidden;
      background:
        linear-gradient(to bottom, rgba(15, 23, 42, 0.3), rgba(15, 23, 42, 0.92)),
        url("img/login.jpg") center center / cover no-repeat;
    }
    .login-visual-inner {
      position: absolute;
      inset: 0;
      padding: 22px 22px 26px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .brand-row {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 10px;
    }
    .brand-logo {
      max-width: 70px;
    }
    .brand-logo img {
      width: 100%;
      height: auto;
      display: block;
      object-fit: contain;
    }
    .brand-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .brand-title {
      font-size: 0.9rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .brand-sub {
      font-size: 0.75rem;
      color: #cbd5f5;
      opacity: 0.9;
    }
    .visual-caption {
      max-width: 260px;
    }
    .visual-caption-title {
      font-size: 1.02rem;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .visual-caption-text {
      font-size: 0.8rem;
      color: #cbd5f5;
      opacity: 0.92;
      line-height: 1.45;
    }
    .login-panel {
      padding: 22px 24px 26px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: radial-gradient(circle at 0 0, rgba(59, 130, 246, 0.22), rgba(15, 23, 42, 0.98));
    }
    .login-header {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .login-logo {
      margin-bottom: 6px;
    }
    .login-logo img {
      display: block;
      max-width: 150px;
      height: auto;
    }
    .login-header h1 {
      margin: 0;
      font-size: 1.2rem;
      letter-spacing: 0.03em;
    }
    .login-subtitle {
      font-size: 0.83rem;
      color: #9ca3af;
    }
    .login-subtitle span {
      color: #e5e7eb;
      font-weight: 500;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 4px;
    }
    label {
      font-size: 0.78rem;
      color: #cbd5f5;
      margin-bottom: 2px;
      display: block;
    }
    .input {
      width: 100%;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.7);
      background: rgba(15, 23, 42, 0.98);
      color: #e5e7eb;
      padding: 7px 12px;
      font-size: 0.83rem;
      outline: none;
      transition: border-color 140ms ease, box-shadow 140ms ease, background 140ms ease;
    }
    .input:focus {
      border-color: rgba(59, 130, 246, 0.9);
      box-shadow:
        0 0 0 1px rgba(37, 99, 235, 0.8),
        0 0 0 4px rgba(37, 99, 235, 0.35);
      background: rgba(15, 23, 42, 1);
    }
    .login-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .error-box {
      border-radius: 10px;
      border: 1px solid rgba(239, 68, 68, 0.7);
      background: rgba(127, 29, 29, 0.7);
      color: #fee2e2;
      padding: 6px 9px;
      font-size: 0.78rem;
    }
    .button {
      border-radius: 6px;
      border: 1px solid rgba(59, 130, 246, 0.9);
      background: radial-gradient(circle at 0 0, rgba(59, 130, 246, 1), rgba(37, 99, 235, 1));
      color: #eff6ff;
      font-size: 0.86rem;
      font-weight: 500;
      padding: 8px 14px;
      width: 100%;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: background 150ms ease, box-shadow 150ms ease, transform 120ms ease;
    }
    .button:hover {
      background: radial-gradient(circle at 0 0, rgba(96, 165, 250, 1), rgba(30, 64, 175, 1));
      box-shadow:
        0 0 0 1px rgba(15, 23, 42, 0.95),
        0 16px 32px rgba(37, 99, 235, 0.75);
      transform: translateY(-0.5px);
    }
    .button:active {
      transform: translateY(0);
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.9);
    }
    .login-meta {
      font-size: 0.75rem;
      color: #9ca3af;
      margin-top: 2px;
    }
    .login-meta span {
      color: #e5e7eb;
    }
    .login-links {
      font-size: 0.75rem;
      display: flex;
      justify-content: space-between;
      margin-top: 4px;
      color: #9ca3af;
    }
    .login-links a {
      color: #93c5fd;
      text-decoration: none;
    }
    .login-links a:hover {
      text-decoration: underline;
    }
    @media (max-width: 880px) {
      .login-shell {
        grid-template-columns: minmax(0, 1fr);
      }
      .login-visual {
        display: none;
      }
    }
    @media (max-width: 600px) {
      .login-shell {
        margin: 16px 10px;
      }
      .login-panel {
        padding: 18px 16px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="login-shell">
    <div class="login-visual">
      <div class="login-visual-inner">
        <div class="brand-row">
          <div class="brand-logo">
            <img src="img/orion.png" alt="Orion logo">
          </div>
          <div class="brand-text">
            <div class="brand-title">Orion Early Warning System</div>
            <div class="brand-sub">dasbor monitoring deteksi bencana alam untuk wilayah Banjarnegara</div>
          </div>
        </div>
        <div class="visual-caption">
          <div class="visual-caption-title">Satu pintu untuk memantau semua EWS Orion.</div>
          <div class="visual-caption-text">
            Masuk untuk mengelola lokasi perangkat, status operasional, dan memantau simulasi
            data banjir, longsor, serta getaran tanah dalam satu dasbor terpadu.
          </div>
        </div>
      </div>
    </div>
    <div class="login-panel">
      <div class="login-header">
        <div class="login-logo">
          <img src="orionweb.png" alt="Orion EWS logo">
        </div>
        <h1>Masuk ke Orion EWS</h1>
        <div class="login-subtitle">
          Gunakan akun admin untuk mengakses <span>dasbor monitoring</span> dan <span>panel perangkat</span>.
        </div>
      </div>
      <?php if ($error !== ""): ?>
      <div class="error-box">
        <?php echo h($error); ?>
      </div>
      <?php endif; ?>
      <form method="post" class="login-form" action="login.php">
        <div class="login-row">
          <label for="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            class="input"
            autocomplete="username"
            required
          >
        </div>
        <div class="login-row">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            class="input"
            autocomplete="current-password"
            required
          >
        </div>
        <button type="submit" class="button">
          Masuk ke aplikasi
        </button>
      </form>
      <div class="login-meta">
        Default akun contoh: <span>admin / orion123</span>. Ubah kredensial ini langsung di file login.php.
      </div>
      <div class="login-links">
        <span>© <?php echo date("Y"); ?> Orion EWS Banjarnegara</span>
        <a href="index.html">Lihat peta tanpa login</a>
      </div>
    </div>
  </div>
</body>
</html>
