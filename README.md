# 🔗 Shrinkly — Pro URL Shortener & Analytics Platform

[![React](https://img.shields.io/badge/Frontend-React%2018-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node](https://img.shields.io/badge/Backend-Node.js-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-darkgreen?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/Security-JWT-purple?style=for-the-badge&logo=json-web-tokens)](https://jwt.io/)

**Shrinkly** is a premium, enterprise-ready full-stack URL management platform. It combines professional link shortening, custom QR code styling, robust analytics, CSV bulk utilities, team workspaces, support ticket tracking, and a stunning cinematic user interface.

---

## ✨ Key Features & Enhancements

### 🎨 Modern Dashboard Experience
- **Cinematic Landing Page**: Premium landing experience with high-end typography, dynamic GSAP micro-animations, and smooth styling.
- **Glassmorphic Sidebar Navigation**: A sleek, responsive navigation system that stays out of the way on mobile and offers intuitive links.
- **Zero-Overlap Stats Grid**: Redesigned dashboard metrics with a single-line horizontal grid layout that collapses smoothly into a swipeable/scrollable track below `1200px` screen width.
- **Responsive Layout Integrity**: Resized and padded charts, cards, and bulk panels to guarantee a perfect layout with no clipping or unwanted horizontal scrollbars.

### 📊 High-Fidelity Analytics Engine
- **Visual Trends**: Interactive charts plotting clicks over time.
- **Audience Insights**: Tracking of browser agents, operating systems, and device categories (desktop, mobile, tablet).
- **Geo-Location Logging**: Automatic, lightweight parsing of client IPs into countries and major cities.
- **CSV Data Export**: Generate and download structured Excel/CSV reports detailing link performance.

### 🛡️ Enterprise Link Security & Control
- **Password Protection**: Encrypt individual redirect paths; prompts users for credentials before routing.
- **Rate Limiting**: Protect endpoints against brute-force attempts.
- **Expiration Dates & Click Caps**: Automatically deactivate links after specific timestamps or click counts.
- **Bulk Imports & Exports**: Upload bulk redirect requests using standard CSV templates and download your entire dashboard registry.

### 👥 Advanced RBAC (Role-Based Access Control)
Shrinkly supports a two-tier permissions model (Global System Roles & Local Workspace Roles):

#### Global Roles
| Role | Capabilities |
|---|---|
| **superadmin** | Can view global analytics, suspend/unsuspend any user, and elevate/revoke user roles. |
| **admin** | Moderate user links, resolve pending tickets, and suspend standard users. |
| **user** | Normal registered account; creates links, views personal dashboards, and joins workspaces. |

#### Local Workspace Roles (Collaboration)
| Role | Scope |
|---|---|
| **owner** | Full workspace authority. Can rename, delete workspace, manage billing, and invite/remove members. |
| **admin** | Manage members (invite/remove editors & viewers), edit workspace configurations, edit all links. |
| **editor** | Can create, edit, and archive links within the workspace. |
| **viewer** | Read-only access to the workspace dashboard, links list, and analytics charts. |

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v6, Chart.js, React-Chartjs-2, GSAP, CSS Variables |
| **Backend** | Node.js, Express.js, Mongoose ODM |
| **Database** | MongoDB (Local / Atlas) |
| **Security** | JWT, Bcryptjs, Passport.js (Social OAuth) |
| **Email** | Nodemailer (SMTP Service) |
| **Parsing** | geoip-lite, ua-parser-js |

---

## ⚙️ Quick Start & Local Setup

### 1. Repository Setup
```bash
git clone https://github.com/bilalchannar/Shrinkly.git
cd Shrinkly
```

### 2. Backend Environment Configuration
Create a `.env` file in the `Backend` directory containing:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/shrinkly
JWT_SECRET=your_jwt_signing_key_here

# Nodemailer Settings (SMTP)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Frontend and Backend URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Social Login (OAuth Credentials)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_TENANT_ID=common

LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

### 3. Start Backend Services
```bash
cd Backend
npm install
# Seed the database & configure role privileges
node seed/promote.js
# Run server under nodemon watch mode
npm run dev
```

### 4. Start Frontend Dev Server
```bash
cd ../Frontend
npm install
npm start
```
The React development server runs by default on [http://localhost:3000](http://localhost:3000).

---

## 🔐 Demo / Admin Credentials

To verify the platform's role-based dashboard, use the seeded superadmin account:
- **Email**: `demo@shrinkly.com`
- **Password**: `Demo123`

To promote any existing registered user to **superadmin**, execute the database seeding script:
```bash
node seed/promote.js
```
*This elevates both `demo@shrinkly.com` and `bilalchannar01@gmail.com` to `superadmin` status.*

---

## 📁 Project Architecture

```
Shrinkly/
├── Backend/
│   ├── config/         # SMTP, Mongoose Connection & Passport Configurations
│   ├── controllers/    # API Logics (Auth, Link, Analytics, Support Tickets, Workspace)
│   ├── models/         # Mongoose Schemas (User, Link, Click, Ticket, Workspace)
│   ├── routes/         # Express Router endpoints
│   ├── seed/           # Promotion & Seeding scripts
│   └── utils/          # Email Templates & QR codes
└── Frontend/
    ├── public/         # Static assets and HTML Entrypoint
    └── src/
        ├── Auth/       # Auth Pages (Login, Sign-Up, Verify Email)
        ├── Components/ # Shared Layout (Sidebar, Footer, Charts, Social Logins)
        ├── Css/        # Responsive Styles (Home, Profile, Variables)
        ├── Pages/      # Views (Home, Landing, Links, Analytics, Support, QrCode)
        └── Routes/     # React Router setup
```

---

## 📄 License & Credits

This project is licensed under the **MIT License**.

Developed with ❤️ by [Bilal Channar](https://github.com/bilalchannar)