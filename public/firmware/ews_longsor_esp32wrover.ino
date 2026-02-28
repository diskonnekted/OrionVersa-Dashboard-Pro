#include <WiFi.h>
#include <HTTPClient.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>

// KONFIGURASI PERANGKAT (DIGENERATE OTOMATIS)
const char* WIFI_SSID = "NAMA_WIFI_ANDA";
const char* WIFI_PASS = "PASSWORD_WIFI_ANDA";
const char* SERVER_URL = "http://192.168.1.10:3000/api/ews/push"; // Ganti IP Server
const char* DEVICE_ID = "{{SENSOR_CODE}}"; // ID Unik (Contoh: EWS-LGS-001)

// KONFIGURASI PIN (ESP32 Wrover - Freenove)
// I2C untuk MPU6050
#define I2C_SDA 21
#define I2C_SCL 22
// Analog Pin untuk Soil Moisture
#define SOIL_PIN 34
#define LED_PIN 2

Adafruit_MPU6050 mpu;
float soilMoisture = 0;
float vibration = 0;

void setup() {
  Serial.begin(115200);
  pinMode(SOIL_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  Wire.begin(I2C_SDA, I2C_SCL);

  // Inisialisasi MPU6050
  if (!mpu.begin()) {
    Serial.println("MPU6050 Gagal Terhubung!");
    while (1) delay(10);
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  // KONEKSI WIFI
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
  }
  Serial.println("\nConnected!");
  digitalWrite(LED_PIN, HIGH);
}

void loop() {
  // BACA SENSOR SOIL MOISTURE
  int rawSoil = analogRead(SOIL_PIN);
  soilMoisture = map(rawSoil, 4095, 0, 0, 100); // 0-100% (Kalibrasi manual diperlukan)

  // BACA SENSOR MPU6050 (PERGERAKAN TANAH)
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  // Deteksi getaran signifikan (Magnitude Acceleration)
  float accelMag = sqrt(sq(a.acceleration.x) + sq(a.acceleration.y) + sq(a.acceleration.z));
  // Baseline gravitasi ~9.8 m/s^2. Selisihnya adalah getaran.
  vibration = abs(accelMag - 9.8);

  Serial.print("Soil: "); Serial.print(soilMoisture);
  Serial.print("% | Vibration: "); Serial.println(vibration);

  // KIRIM DATA KE SERVER
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");

    // Format JSON payload
    // Kirim vibration sebagai 'value' utama, dan soil sebagai info tambahan
    String payload = "{";
    payload += "\"id\":\"" + String(DEVICE_ID) + "\",";
    payload += "\"type\":\"landslide\",";
    payload += "\"value\":" + String(vibration) + ",";
    payload += "\"soil\":" + String(soilMoisture) + ",";
    payload += "\"battery\":85,"; // Dummy battery
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
