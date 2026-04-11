# 🌍 UrbanPulse: GeoSpatial Urban Intelligence Platform

A premium, cinematic 3D web application featuring a persistent interactive Earth globe and real-time urban analytics. This MERN-stack platform provides powerful infrastructure analysis, route planning, PDF report generation, and interactive spatial data via real-world geospatial data (OpenStreetMap).

## ✨ Features

- **3D Earth Globe**: Persistent, physics-based, interactive 3D globe using Three.js / React Three Fiber.
- **Glassmorphic UI**: Premium frosted glass aesthetic with backdrop blurring and dynamic layout transitions.
- **Real-Time OSM Integration**: Dynamic geospatial analysis via Overpass API for features like infrastructure scoring, amenities detection, and routing.
- **Interactive Mapping**: Leaflet-based map with custom markers, multiple map layers, and live drawing controls.
- **Automated Insights & PDF Reports**: Generate comprehensive infrastructure and zoning reports for selected areas, ready for download in PDF format.
- **Full-Stack MERN Architecture**: Node.js/Express backend paired with a React frontend and MongoDB data storage.

---

## 🚀 How to Run the Project

This project requires both the **Frontend** and **Backend** to be running simultaneously.

### 1. Prerequisites
- **Node.js** (v16 or higher recommended)
- **MongoDB** (running locally on `mongodb://127.0.0.1:27017` or provide your own `.env` connection string)

### 2. Backend Setup
1. Open a terminal and navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. *(Optional)* Configure environment:
   Create a `.env` file in the `server` directory. The defaults (if not provided) fallback to:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/urbanpulse
   ```
4. Start the backend server:
   ```bash
   node server.js
   ```
   *The server should now be running on http://localhost:5000 and connect to MongoDB.*

### 3. Frontend Setup
1. Open a **new** terminal and navigate to the project root:
   ```bash
   cd urban2
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
   *(Note: The project also works with `pnpm` if you prefer).*
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the application in your browser (usually `http://localhost:5173`).

---

## 🏗️ Architecture Summary

- **Frontend**: React 18, React Three Fiber, Framer Motion, Tailwind CSS, Leaflet.
- **Backend**: Node.js, Express, Puppeteer (for PDFs), Axios.
- **Database**: MongoDB & Mongoose.

## 📄 License
Proprietary Platform.

Enjoy exploring the immersive 3D spatial dimensions of UrbanPulse!
