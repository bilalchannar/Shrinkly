# 🔗 Shrinkly — URL Shortener & Analytics Platform

A full-stack URL shortener with analytics, link management, email verification, and a rich dashboard.

---

## 🚀 Tech Stack

| Layer | Tech |
|---|---|
| **Frontend** | React 18, React Router v6, react-hot-toast |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **Email** | Nodemailer (Gmail) |
| **Analytics** | geoip-lite, ua-parser-js |
| **Scheduling** | node-cron |
| **Security** | express-rate-limit, express-validator |

---

## ⚙️ Prerequisites

- **Node.js** v18+
- **MongoDB** running locally on port 27017 (or a MongoDB Atlas URI)
- **Gmail account** with [App Password](https://myaccount.google.com/apppasswords) (requires 2FA enabled)

---

## 📦 Setup & Installation

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/shrinkly.git
cd shrinkly
```

### 2. Configure Backend

```bash
cd Backend
cp .env.example .env
```

Edit `Backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/shrinkly
JWT_SECRET=your_strong_secret_here
PORT=5000
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Gmail App Password (NOT your regular Gmail password)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_char_app_password
```

Install dependencies:

```bash
npm install
```

### 3. Configure Frontend

```bash
cd ../Frontend
cp .env.example .env
```

Edit `Frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Install dependencies:

```bash
npm install
```

---

## ▶️ Running the App

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd Backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd Frontend
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔗 Short Link Redirect

Visiting `http://localhost:5000/r/<shortCode>` will:
1. Check if the link exists and is active
2. Check if it has expired (auto-marks as `expired`)
3. Check if it has hit its max click limit (auto-marks as `inactive`)
4. If password-protected, redirect to frontend password prompt
5. Record analytics (IP, country, city, browser, device, OS)
6. Redirect the user to the original URL

---

## ✨ Features

### Authentication
- ✅ Signup / Login with JWT
- ✅ **Email verification** (must verify before logging in)
- ✅ **Forgot password** / Reset password via email link
- ✅ Rate limiting (brute-force protection)
- ✅ Server-side input validation

### Link Management
- ✅ Create short links with custom slugs
- ✅ **Link expiry** (auto-expires on a date/time)
- ✅ **Click limits** (auto-deactivates after N clicks)
- ✅ **Password-protected links**
- ✅ Tag support (multi-tag, filter by tag)
- ✅ Bulk delete / activate
- ✅ **Pagination** (10 links per page)
- ✅ Search + advanced filters (date, clicks, status, tag)
- ✅ CSV export

### Analytics
- ✅ Real geo-location (country & city via geoip-lite)
- ✅ Device, browser, OS tracking
- ✅ QR scan tracking

### Automated Jobs (Cron)
- ✅ **Hourly**: auto-expire links past their expiry date
- ✅ **Weekly (Monday 9AM)**: send email reports to subscribed users

### UX
- ✅ Toast notifications (react-hot-toast)
- ✅ Skeleton loading states
- ✅ 404 Not Found page
- ✅ Password-prompt page for protected links

---

## 🔒 Security Notes

- **Never commit `.env` files** — they are in `.gitignore`
- Passwords hashed with **bcrypt (10 rounds)**
- Verification & reset tokens are **cryptographically random** (32 bytes)
- Tokens expire: verification = 24h, reset = 1h
- Rate limits: login = 10/15min, signup = 5/hr, email = 3/hr

---

## 📁 Project Structure

```
Shrinkly/
├── Backend/
│   ├── config/         # Email transporter
│   ├── controllers/    # Business logic
│   ├── middleware/     # Auth, validation
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routes
│   ├── utils/          # sendEmail, emailTemplates
│   └── server.js       # Entry point + cron jobs
└── Frontend/
    ├── src/
    │   ├── Auth/       # Login, Signup, VerifyEmail, ForgotPw, ResetPw
    │   ├── Components/ # Sidebar, Footer, ProtectedRoute
    │   ├── Css/        # Stylesheets
    │   ├── Pages/      # Home, Link, Analytics, Profile, QrCode, NotFound
    │   ├── Routes/     # AppRoutes.jsx
    │   ├── context/    # AuthContext
    │   └── services/   # api.js (all API calls)
    └── public/
```

---

## 🛣️ API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/signup` | Register (sends verification email) |
| POST | `/login` | Login (blocked if unverified) |
| GET | `/me` | Get current user |
| GET | `/verify-email?token=...` | Verify email |
| POST | `/resend-verification` | Resend verification email |
| POST | `/forgot-password` | Send reset link |
| POST | `/reset-password` | Reset password with token |

### Links (`/api`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/shorten` | Create short link |
| GET | `/links?page=1&limit=10` | Get all links (paginated) |
| GET | `/links/:id` | Get single link |
| PUT | `/links/:id` | Update link |
| DELETE | `/links/:id` | Delete link |
| POST | `/links/bulk-delete` | Bulk delete |
| POST | `/links/bulk-status` | Bulk update status |
| GET | `/links/export` | Export as CSV |
| POST | `/links/check-password/:code` | Check link password |

### Redirect
| Method | Endpoint | Description |
|---|---|---|
| GET | `/r/:code` | Redirect short link |

---

## 📄 License

MIT