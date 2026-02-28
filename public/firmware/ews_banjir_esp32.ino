#include <WiFi.h>
#include <HTTPClient.h>

// KONFIGURASI PERANGKAT (DIGENERATE OTOMATIS)
const char* WIFI_SSID = "NAMA_WIFI_ANDA";
const char* WIFI_PASS = "PASSWORD_WIFI_ANDA";
const char* SERVER_URL = "http://192.168.1.10:3000/api/ews/push"; // Ganti IP Server
const char* DEVICE_ID = "{{SENSOR_CODE}}"; // ID Unik (Contoh: EWS-BJR-001)

// KONFIGURASI PIN (ESP32 Dev Module)
#define TRIG_PIN 5
#define ECHO_PIN 18
#define LED_PIN 2

// VARIABEL GLOBAL
long duration;
int distance;
int waterLevel; // Konversi jarak ke level air (cm)
const int MAX_DEPTH = 500; // Kedalaman sungai total (cm)

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);

  // KONEKSI WIFI
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_PIN, !digitalRead(LED_PIN)); // Blink saat connect
  }
  Serial.println("\nConnected!");
  digitalWrite(LED_PIN, HIGH);
}

void loop() {
  // BACA SENSOR ULTRASONIK
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  duration = pulseIn(ECHO_PIN, HIGH);
  distance = duration * 0.034 / 2; // Hitung jarak (cm)
  
  // Hitung ketinggian air (Total Kedalaman - Jarak Sensor ke Air)
  waterLevel = MAX_DEPTH - distance;
  if (waterLevel < 0) waterLevel = 0;

  Serial.print("Distance: "); Serial.print(distance);
  Serial.print(" cm | Water Level: "); Serial.println(waterLevel);

  // KIRIM DATA KE SERVER
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");

    // Format JSON payload
    String payload = "{";
    payload += "\"id\":\"" + String(DEVICE_ID) + "\",";
    payload += "\"type\":\"flood\",";
    payload += "\"value\":" + String(waterLevel) + ",";
    payload += "\"battery\":100,"; // Dummy battery
    payload += "\"wifi\":" + String(WiFi.RSSI());
    payload += "}";

    int httpResponseCode = http.POST(payload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Server Response: " + response);
    } else {
      Serial.print("Error on sending POST: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  } else {
    Serial.println("WiFi Disconnected");
    WiFi.reconnect();
  }

  delay(5000); // Kirim data setiap 5 detik
}
