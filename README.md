# 🌍 UrbanPulse — Geospatial Database for Urban Planning

> Enterprise-grade MERN platform for real-time urban infrastructure analysis, planning, and reporting — powered by OpenStreetMap and MongoDB.

[![MongoDB](https://img.shields.io/badge/MongoDB-18_Collections-47A248?logo=mongodb)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)](https://nodejs.org/)
[![OpenStreetMap](https://img.shields.io/badge/Data-OpenStreetMap-7EBC6F?logo=openstreetmap)](https://www.openstreetmap.org/)

---

## 📋 Overview

UrbanPulse transforms raw geospatial data into actionable urban planning intelligence. Search any area worldwide, analyze infrastructure coverage, design urban layouts, generate PDF reports, and collaborate on infrastructure proposals — all with persistent MongoDB storage and real-time OpenStreetMap integration.

### Key Features

| Feature | Description |
|---|---|
| 🗺️ **Interactive Map** | Leaflet-based dark-themed map with dynamic markers, clustering, and coverage circles |
| 🔍 **Area Search & Analysis** | Geocode any location → fetch infrastructure → run weighted scoring → persist results |
| 📐 **Urban Planner** | Drag-and-drop element placement with real-time distance analysis and rule-based feedback |
| 📄 **PDF Reports** | Auto-generated PDFKit reports with scores, coverage data, and recommendations |
| 💾 **Full Persistence** | Every search, design, and report is saved to MongoDB for instant reload |
| 🔔 **Notifications** | In-app notification system with unread badge and real-time polling |
| 📊 **Area Comparison** | Side-by-side scoring comparison of multiple saved areas |
| 🏗️ **Infrastructure Proposals** | Community-driven infrastructure request system with voting |
| 📁 **Project Workspaces** | Group areas, designs, and reports into named projects |
| 🔖 **Bookmarks** | Save favorites across landmarks, areas, designs, and cities |
| 🗂️ **Custom Map Layers** | Create private/public GeoJSON layers with custom styling |
| 📈 **Activity Tracking** | Full audit trail of all user actions |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Dashboard │  │ Planner  │  │Analytics │  │7 New Pages│    │
│  │(Leaflet) │  │(Drag/Drop)│  │(Charts)  │  │(CRUD)     │    │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘    │
│        └──────────────┴─────────────┴─────────────┘          │
│                    mapsApi.js (fetch wrapper)                 │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP/JSON
┌────────────────────────────┴────────────────────────────────┐
│                 Backend (Express.js + Node 18)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Auth MW   │  │22 Routes │  │Services  │  │Middleware│    │
│  │(JWT+RBAC)│  │(REST API)│  │(OSM,Cache)│  │(Error)   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└────────────────────────────┬────────────────────────────────┘
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
   │  MongoDB    │   │ Nominatim   │   │  Overpass   │
   │ 18 Collections│  │ (Geocoding) │   │  (Places)   │
   │ + 2dsphere  │   └─────────────┘   └─────────────┘
   └─────────────┘
```

---

## 🗄️ Database Schema (18 Collections)

| # | Collection | Purpose |
|---|---|---|
| 1 | `users` | Auth, roles (admin/planner/viewer) |
| 2 | `landmarks` | Hospitals, schools, parks, etc. (from OSM + user) |
| 3 | `roads` | Road network data with geometry |
| 4 | `zones` | Administrative zone boundaries |
| 5 | `utilities` | Water, electricity, gas infrastructure |
| 6 | `populationdatas` | Census/population data by area |
| 7 | `saved_areas` | User search history with cached scores |
| 8 | `analytics_results` | Full analysis snapshots per area |
| 9 | `planner_designs` | Saved urban plan layouts |
| 10 | `reports` | Generated PDF report metadata |
| 11 | `city_profiles` | Cached city metadata from Nominatim |
| 12 | `activity_logs` | User action audit trail |
| 13 | `notifications` | In-app notification messages |
| 14 | `project_workspaces` | Grouped workspaces |
| 15 | `area_comparisons` | Side-by-side comparison results |
| 16 | `infrastructure_requests` | Community infrastructure proposals |
| 17 | `bookmarks` | User favorites |
| 18 | `map_layers` | Custom GeoJSON layers |

---

## 🚀 How to Run the Project Locally

Follow these step-by-step instructions to get the UrbanPulse platform running on your local machine.

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **MongoDB** (running locally on port 27017 or a MongoDB Atlas URI)
- **Git**

### Step 1: Clone the Repository

```bash
git clone https://github.com/Hassan136-nust/Geo-Spatial-Database-for-Urban-Planning-.git
cd Geo-Spatial-Database-for-Urban-Planning-
```

### Step 2: Install Dependencies

You need to install dependencies for both the frontend (React) and the backend (Express).

```bash
# 1. Install frontend dependencies (in the root directory)
npm install

# 2. Install backend dependencies (in the server directory)
cd server
npm install
cd ..
```

### Step 3: Environment Setup

Create a `.env` file inside the `server` directory (`server/.env`) and add the following configuration:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/urbanpulse
JWT_SECRET=supersecretkey_change_in_production
JWT_EXPIRE=30d
```
*(Make sure MongoDB is running on your machine if you use the local URI).*

### Step 4: Seed the Database (Optional but recommended)

To populate the database with demo users:

```bash
cd server
node seed/seedData.js
cd ..
```

This will create 3 demo accounts you can use to log in:
- **Admin**: `admin@urbanpulse.pk` (Password: `admin123`)
- **Planner**: `planner@urbanpulse.pk` (Password: `planner123`)
- **Viewer**: `viewer@urbanpulse.pk` (Password: `viewer123`)

### Step 5: Start the Development Servers

**Option A: Using the Batch File (Windows Only - Recommended)**
Simply double-click the `start.bat` file located in the root directory. This will automatically open two new command windows and start both the frontend and backend servers simultaneously.

**Option B: Manual Start (Mac/Linux/Windows)**
You will need **two separate terminals** to run both the frontend and backend at the same time.

**Terminal 1 (Start the Backend Server):**
```bash
cd server
npm run dev
```
*The backend should say: `✅ MongoDB Connected: 127.0.0.1`*

**Terminal 2 (Start the Frontend React App):**
```bash
# Note: Keep Terminal 1 running, open a new terminal window
npm run dev
```
*The frontend should say: `VITE ready in ... ➜ Local: http://localhost:5173/`*

### Step 6: Open the App

Open your web browser and go to:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/signup` | — | Alias for register |
| POST | `/api/auth/login` | — | Login, get JWT token |
| GET | `/api/auth/me` | 🔒 | Get current user profile |
| PUT | `/api/auth/profile` | 🔒 | Update profile |
| PUT | `/api/auth/password` | 🔒 | Change password |

### Areas (Persistent Search)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/areas/search` | 🔒* | Search area → geocode → analyze → persist |
| GET | `/api/areas/history` | 🔒 | Get saved search history |
| GET | `/api/areas/:id` | — | Get saved area with analytics |
| DELETE | `/api/areas/:id` | 🔒 | Delete saved area |

### Planner Designs
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/planner/save` | 🔒 | Save/update design |
| GET | `/api/planner/user-designs` | 🔒 | Get all user designs |
| GET | `/api/planner/:id` | 🔒 | Get single design |
| PUT | `/api/planner/:id` | 🔒 | Update design |
| DELETE | `/api/planner/:id` | 🔒 | Delete design |

### Reports
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/report/generate` | — | Generate PDF report |
| GET | `/api/report/history` | 🔒 | Get report history |
| GET | `/api/report/:id/download` | 🔒 | Download saved PDF |
| DELETE | `/api/report/:id` | 🔒 | Delete report |

### Notifications
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | 🔒 | Get notifications (paginated) |
| GET | `/api/notifications/unread-count` | 🔒 | Unread count |
| PUT | `/api/notifications/:id/read` | 🔒 | Mark as read |
| PUT | `/api/notifications/read-all` | 🔒 | Mark all read |

### Projects
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/projects` | 🔒 | Create project |
| GET | `/api/projects` | 🔒 | List projects |
| GET | `/api/projects/:id` | 🔒 | Get project details |
| PUT | `/api/projects/:id` | 🔒 | Update project |
| PUT | `/api/projects/:id/items` | 🔒 | Add/remove items |
| DELETE | `/api/projects/:id` | 🔒 | Delete project |

### Comparisons
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/comparisons` | 🔒 | Compare 2+ areas |
| GET | `/api/comparisons` | 🔒 | List comparisons |
| GET | `/api/comparisons/:id` | 🔒 | Get comparison detail |
| DELETE | `/api/comparisons/:id` | 🔒 | Delete comparison |

### Infrastructure Requests
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/infra-requests` | 🔒 | Submit proposal |
| GET | `/api/infra-requests` | — | List all (filterable) |
| GET | `/api/infra-requests/mine` | 🔒 | My proposals |
| PUT | `/api/infra-requests/:id/vote` | 🔒 | Upvote/downvote |
| PUT | `/api/infra-requests/:id/review` | 🔒🛡️ | Admin review |

### Bookmarks
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/bookmarks` | 🔒 | Add bookmark |
| GET | `/api/bookmarks` | 🔒 | List bookmarks |
| DELETE | `/api/bookmarks/:id` | 🔒 | Remove bookmark |

### Map Layers
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/map-layers` | 🔒 | Create layer |
| GET | `/api/map-layers` | 🔒 | List user layers |
| GET | `/api/map-layers/public` | — | Public layers |
| PUT | `/api/map-layers/:id` | 🔒 | Update layer |
| DELETE | `/api/map-layers/:id` | 🔒 | Delete layer |

### Cities & Activity
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/cities` | — | List cached city profiles |
| GET | `/api/cities/:name` | — | City profile + stats |
| GET | `/api/activity` | 🔒 | Activity feed |
| GET | `/api/activity/stats` | 🔒 | Activity statistics |

🔒 = requires JWT token • 🛡️ = admin only

---

## 🧩 Frontend Pages

| Route | Page | Description |
|---|---|---|
| `/` | Home | Landing page with feature showcase |
| `/login` | Login/Register | JWT authentication |
| `/dashboard` | Map Dashboard | Interactive map with search & analysis |
| `/planner` | Urban Planner | Drag-and-drop layout editor |
| `/analytics` | Analytics | Charts and data visualization |
| `/saved-areas` | Saved Areas | Search history with cached scores |
| `/my-designs` | My Designs | Saved planner layouts |
| `/saved-reports` | Saved Reports | PDF report history |
| `/projects` | Projects | Workspace organization |
| `/compare` | Compare Areas | Side-by-side area scoring |
| `/infra-requests` | Proposals | Infrastructure request board |
| `/bookmarks` | Bookmarks | Saved favorites |
| `/profile` | Profile | User settings |
| `/admin` | Admin Panel | User management (admin only) |

---

## 🔧 Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Framer Motion, Leaflet, Lucide Icons |
| **Backend** | Node.js, Express.js, JWT, bcrypt |
| **Database** | MongoDB with Mongoose ODM, 2dsphere indexes |
| **Maps** | OpenStreetMap (Nominatim + Overpass + OSRM) |
| **Reports** | PDFKit with auto-generated analysis reports |
| **Styling** | TailwindCSS with glassmorphism dark theme |

---

## 📂 Project Structure

```
├── server/
│   ├── config/       # DB connection
│   ├── controllers/  # 22 controllers
│   ├── middleware/    # auth, error handler
│   ├── models/       # 18 Mongoose models
│   ├── routes/       # 22 route files
│   ├── services/     # OSM, cache, analysis, scoring, reports
│   ├── seed/         # Demo user seeding
│   ├── reports/      # Generated PDFs (auto-created)
│   └── server.js     # Express entry point
├── src/
│   ├── app/
│   │   ├── components/  # Navigation, GlassPanel, etc.
│   │   ├── context/     # AuthContext, MapContext
│   │   ├── pages/       # 16 page components
│   │   ├── services/    # api.js, mapsApi.js
│   │   └── routes.jsx   # React Router config
│   ├── index.css
│   └── main.jsx
├── index.html
├── vite.config.js
└── package.json
```

---

## 🔒 Security

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: 30-day expiry, stored in localStorage
- **Role-Based Access**: admin, planner, viewer roles
- **Input Sanitization**: Non-ASCII text stripped for PDF safety
- **Owner Checks**: Users can only modify their own resources

---

## 📊 Data Flow

1. **User searches** "Lahore" on Dashboard
2. **Backend** geocodes via Nominatim API
3. **Cache check** — if landmarks exist in DB for that area, use cached
4. **If not cached** — fetch from Overpass API → bulk upsert to MongoDB
5. **Analysis engine** runs weighted scoring (healthcare, education, green space, connectivity)
6. **Results saved** to `saved_areas` + `analytics_results` collections
7. **Activity logged** to `activity_logs`
8. **Notification created** — "Analysis Complete ✅"
9. **Frontend displays** markers, analysis sidebar, and all data

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

---

## 📝 License

This project is developed for educational purposes as part of database systems coursework.

---

*Built with ❤️ using the MERN stack + OpenStreetMap*
