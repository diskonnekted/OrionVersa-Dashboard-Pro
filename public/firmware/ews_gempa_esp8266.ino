#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

// KONFIGURASI PERANGKAT (DIGENERATE OTOMATIS)
const char* WIFI_SSID = "NAMA_WIFI_ANDA";
const char* WIFI_PASS = "PASSWORD_WIFI_ANDA";
const char* SERVER_URL = "http://192.168.1.10:3000/api/ews/push"; // Ganti IP Server
const char* DEVICE_ID = "{{SENSOR_CODE}}"; // ID Unik (Contoh: EWS-GMP-001)

// KONFIGURASI PIN (ESP8266 NodeMCU)
#define VIB_PIN D1 // SW-420 Digital Output
#define LED_PIN D4 // Built-in LED (Active LOW)

void setup() {
  Serial.begin(115200);
  pinMode(VIB_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);

  // KONEKSI WIFI
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_PIN, LOW); delay(100); digitalWrite(LED_PIN, HIGH);
  }
  Serial.println("\nConnected!");
}

void loop() {
  // BACA SENSOR GETARAN
  // SW-420 output LOW saat ada getaran, HIGH saat diam (tergantung modul)
  // Asumsi: LOW = Getaran terdeteksi
  long vibrationStart = millis();
  int vibrationCount = 0;
  
  // Hitung durasi getaran dalam 1 detik
  while (millis() - vibrationStart < 1000) {
    if (digitalRead(VIB_PIN) == LOW) {
      vibrationCount++;
    }
  }

  // Konversi count ke skala kasar Richter (Hanya estimasi dummy)
  float magnitude = 0;
  if (vibrationCount > 100) magnitude = 3.0;
  if (vibrationCount > 500) magnitude = 5.0;
  if (vibrationCount > 1000) magnitude = 7.0;

  Serial.print("Vibration Count: "); Serial.print(vibrationCount);
  Serial.print(" | Magnitude: "); Serial.println(magnitude);

  // KIRIM DATA KE SERVER
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;
    http.begin(client, SERVER_URL);
    http.addHeader("Content-Type", "application/json");

    // Format JSON payload
    String payload = "{";
    payload += "\"id\":\"" + String(DEVICE_ID) + "\",";
    payload += "\"type\":\"earthquake\",";
    payload += "\"value\":" + String(magnitude) + ",";
    payload += "\"count\":" + String(vibrationCount) + ",";
    payload += "\"battery\":100,"; // Selalu on grid
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
  }

  // Jika gempa terdeteksi, kirim lebih sering. Jika tenang, kirim per 10 detik.
  if (magnitude > 0) delay(1000);
  else delay(10000);
}
