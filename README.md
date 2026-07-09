# ESP32-Based Indoor Localization System

An indoor device localization system that tracks the real-time coordinates of a mobile node using RSSI (Received Signal Strength Indicator) and Trilateration. Built with ESP32 microcontrollers and enhanced with a Kalman Filter to ensure stable, low-noise tracking.

## 🚀 Project Overview
* **Project Type:** Tinkering Lab Project
* **Timeline:** Sept 2025 - Dec 2025

This system uses a network of 4 fixed ESP32 anchors to track 1 mobile ESP32 tag. By measuring the signal strength (RSSI) between the tag and the anchors, the system estimates distances and calculates the tag's (x, y) coordinates. A dynamic web dashboard visualizes this movement in real-time.

---

## ✨ Key Features
* **RSSI-Based Trilateration:** Computes real-time 2D spatial coordinates using distance estimation from multiple fixed anchor points.
* **Kalman Filter Integration:** Actively smooths volatile and noisy RSSI signals, predicting and correcting state variables to significantly enhance positional accuracy.
* **Live Web Dashboard:** A dynamic web interface that parses telemetry data and visually plots the moving tag's position on a grid.
* **Environmentally Calibrated:** Includes calibration testing protocols to account for multi-path interference, signal degradation, and varied indoor conditions.

## 🛠️ Hardware & Tech Stack
* **Microcontrollers:** 5x ESP32 Development Boards (4 Anchors, 1 Tag)
* **Firmware:** C/C++ (Arduino IDE / ESP-IDF)
* **Frontend:** HTML, CSS, JavaScript (for the live tracking dashboard)
* **Communication:** Wi-Fi / WebSockets / ESP-NOW *(Update based on your exact protocol)*

## 🏗️ System Architecture
1. **Fixed Anchors (4):** Placed at known (x, y) coordinates in the room. They constantly broadcast or listen for the mobile tag to gauge signal strength.
2. **Mobile Tag (1):** The moving device being tracked.
3. **Processing Node:** Collects the RSSI values, applies the Kalman Filter, and runs the trilateration mathematics.
4. **Web Interface:** Connects to the processing node to visually plot the calculated coordinates in real-time.

## ⚙️ Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/esp32-localization.git](https://github.com/your-username/esp32-localization.git)
