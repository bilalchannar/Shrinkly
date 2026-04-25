# 🔗 Shrinkly — Pro URL Shortener & Analytics Platform

[![React](https://img.shields.io/badge/Frontend-React%2018-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node](https://img.shields.io/badge/Backend-Node.js-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-darkgreen?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/Security-JWT-purple?style=for-the-badge&logo=json-web-tokens)](https://jwt.io/)

**Shrinkly** is a premium, full-stack URL management platform designed for professionals. It combines powerful link shortening with high-fidelity analytics, automated reporting, and a stunning, cinematic user experience.

---

## ✨ New "Pro" Features

### 🎨 Premium Dashboard Experience
- **Cinematic Home Page**: Featuring a high-end, auto-playing testimonial carousel with Ken Burns zoom effects and smooth cross-fades.
- **Unified Pro Sidebar**: A modern, responsive sidebar that provides seamless navigation across the entire ecosystem.
- **Glassmorphism UI**: Sleek, modern interface with vibrant gradients and subtle micro-animations.

### 📊 Advanced Analytics Engine
- **Visual Insights**: Interactive charts for tracking click performance over time.
- **Traffic Intelligence**: Real-time tracking of visitor sources, device types, browsers, and operating systems.
- **Geo-Location Mapping**: Detailed insights into visitor locations down to the city level.
- **QR Code Performance**: Integrated tracking for QR code scans vs. direct link clicks.

### 🛡️ Enterprise-Grade Security
- **Email Verification**: Mandatory account activation for robust user security.
- **Password Protection**: Secure individual links with custom passwords.
- **Rate Limiting**: Protection against brute-force attacks on login and signup.
- **Link Expiry & Limits**: Set auto-expiry dates or click thresholds for temporary campaigns.

### 📞 Professional Support System
- **Ticketing Dashboard**: Users can track their support requests in a dedicated "My Submissions" section.
- **Automated Notifications**: Instant admin alerts via email for every support query.
- **Status Tracking**: Visual badges for "Pending", "Read", and "Replied" tickets.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v6, Chart.js, GSAP Animations |
| **Backend** | Node.js, Express.js, Node-Cron |
| **Database** | MongoDB (Mongoose ODM) |
| **Auth** | JWT, bcryptjs, Express-Validator |
| **Email** | Nodemailer (SMTP Service) |
| **Analytics** | geoip-lite, ua-parser-js |

---

## ⚙️ Quick Start

### 1. Installation
```bash
git clone https://github.com/bilalchannar/Shrinkly.git
cd Shrinkly
```

### 2. Backend Setup
```bash
cd Backend
npm install
# Configure your .env file (see .env.example)
npm run dev
```

### 3. Frontend Setup
```bash
cd ../Frontend
npm install
# Ensure your API_URL matches the backend port
npm start
```

---

## 📁 Project Architecture

```
Shrinkly/
├── Backend/
│   ├── config/         # SMTP & Database Configuration
│   ├── controllers/    # Business Logic (Auth, Links, Analytics, Contact)
│   ├── models/         # Mongoose Data Schemas
│   ├── routes/         # REST API Endpoints
│   └── utils/          # Email Templates & Utility Functions
└── Frontend/
    ├── src/
    │   ├── Auth/       # Login, Signup, & Verification Logic
    │   ├── Components/ # Shared UI (Sidebar, Footer, Charts)
    │   ├── Pages/      # Dashboard, Home, Analytics, Profile, Contact
    │   └── services/   # Axios API Client Configuration
```

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use it for your own projects!

---

Developed with ❤️ by **Bilal Channar**
| Export as CSV |
| POST | `/links/check-password/:code` | Check link password |

### Redirect
| Method | Endpoint | Description |
|---|---|---|
| GET | `/r/:code` | Redirect short link |

---

## 📄 License

MIT