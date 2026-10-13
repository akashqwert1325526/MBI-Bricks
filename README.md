# 🧱 MBI Bricks Industries

> **Full-Stack E-Commerce & Business Management Web Application**
> Premier brick manufacturer in Karnataka, India — Online ordering, Admin panel, Real-time management.

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-LTS-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Overview](#-api-overview)
- [Pages & Routes](#-pages--routes)
- [Screenshots](#-screenshots)
- [Contact](#-contact)

---

## 🏭 About

**MBI Bricks Industries** is a full-stack web platform built for a brick manufacturing company based in **Bommenahalli, Karnataka (572119)**. The system replaces all manual, paper-based operations with a digital platform that includes:

- 🛒 **Customer E-Commerce Portal** — Browse, order, and track bricks online
- 🛠️ **Admin Business Management Panel** — Manage orders, inventory, payments, deliveries, invoices & reports
- 📱 **WhatsApp Integration** — Instant customer-business communication
- 🌐 **Bilingual UI** — English + Kannada (ಕನ್ನಡ) support
- 📍 **GPS-based Delivery Pricing** — Auto-calculates delivery charge based on distance from factory

---

## ✨ Features

### Customer Portal
- ✅ Register / Login with Email or Google SSO
- ✅ Browse Wirecut & Table Mould brick products
- ✅ Add to cart, manage quantities
- ✅ Multi-step checkout with GPS address detection
- ✅ Auto-calculated delivery charge by distance
- ✅ Multiple payment methods — UPI / Cash on Delivery / Bank Transfer
- ✅ Order tracking (Pending → Dispatched → Delivered)
- ✅ WhatsApp contact button
- ✅ Wishlist, Profile, Address management
- ✅ English / Kannada language toggle

### Admin Panel
- ✅ Secure admin login with JWT
- ✅ Real-time KPI dashboard (Sales, Orders, Customers, Stock)
- ✅ Low-stock alerts
- ✅ Order management + dispatch with vehicle/driver details
- ✅ WhatsApp dispatch notification to customer
- ✅ Product management with image upload
- ✅ Inventory tracking (Wirecut + Table Mould)
- ✅ Payment logging & tracking
- ✅ PDF invoice generation (download)
- ✅ Expense tracking by category
- ✅ Revenue & sales analytics reports
- ✅ Business settings configuration

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 19 + Vite 8 |
| **Routing** | React Router v7 |
| **Styling** | Vanilla CSS (custom design system) |
| **HTTP Client** | Axios |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **PDF Generation** | jsPDF + jsPDF-AutoTable |
| **Notifications** | react-hot-toast |
| **Backend Framework** | Node.js + Express v5 |
| **Database** | SQLite (better-sqlite3) |
| **Authentication** | Firebase Auth + JWT (jsonwebtoken) |
| **Cloud DB** | Firebase Firestore |
| **Password Hashing** | bcryptjs |
| **File Uploads** | Multer |
| **Analytics** | Firebase Analytics |

---

## 📁 Project Structure

\\\
MBI-Bricks/
├── backend/
│   ├── server.js               # Express entry point
│   ├── database.js             # SQLite schema & seed data
│   ├── sync-to-firestore.mjs   # Optional Firestore sync script
│   ├── middleware/
│   │   └── auth.js             # JWT verification middleware
│   ├── routes/                 # 13 API route modules
│   │   ├── auth.js
│   │   ├── orders.js
│   │   ├── products.js
│   │   ├── cart.js
│   │   ├── customers.js
│   │   ├── inventory.js
│   │   ├── payments.js
│   │   ├── invoices.js
│   │   ├── deliveries.js
│   │   ├── expenses.js
│   │   ├── reports.js
│   │   ├── settings.js
│   │   └── notifications.js
│   └── utils/
│       └── delivery.js         # GPS delivery charge calculator
│
├── frontend/
│   └── src/
│       ├── App.jsx             # Root router
│       ├── firebase.js         # Firebase config
│       ├── api.js              # Axios instance + interceptors
│       ├── index.css           # Global design system
│       ├── context/
│       │   ├── AuthContext.jsx     # Auth state + Firebase
│       │   ├── CartContext.jsx     # Cart state
│       │   └── LanguageContext.jsx # EN/KN language toggle
│       ├── pages/              # 12 customer pages
│       │   ├── HomePage.jsx
│       │   ├── ProductsPage.jsx
│       │   ├── ProductDetailPage.jsx
│       │   ├── CartPage.jsx
│       │   ├── CheckoutPage.jsx
│       │   ├── OrderConfirmPage.jsx
│       │   ├── OrdersPage.jsx
│       │   ├── OrderDetailPage.jsx
│       │   ├── ProfilePage.jsx
│       │   ├── WishlistPage.jsx
│       │   ├── LoginPage.jsx
│       │   └── RegisterPage.jsx
│       ├── admin/              # 15 admin pages
│       │   ├── AdminDashboard.jsx
│       │   ├── AdminOrders.jsx
│       │   ├── AdminOrderDetail.jsx
│       │   ├── AdminProducts.jsx
│       │   ├── AdminInventory.jsx
│       │   ├── AdminCustomers.jsx
│       │   ├── AdminPayments.jsx
│       │   ├── AdminInvoices.jsx
│       │   ├── AdminDeliveries.jsx
│       │   ├── AdminExpenses.jsx
│       │   ├── AdminReports.jsx
│       │   └── AdminSettings.jsx
│       ├── components/
│       │   ├── Header.jsx
│       │   ├── Footer.jsx
│       │   └── utils.jsx
│       ├── services/
│       │   └── firebaseService.js  # Firestore operations
│       └── translations/
│           └── index.js            # EN + KN strings
│
├── firestore.rules             # Firestore security rules
├── dev.js                      # Run frontend + backend together
└── package.json
\\\

---

## 🚀 Getting Started

### Prerequisites

- Node.js (LTS) installed
- npm installed
- Firebase project set up (for Auth + Firestore)
- Git installed

### 1. Clone the Repository

\\\ash
git clone https://github.com/akashqwert1325526/MBI-Bricks.git
cd MBI-Bricks
\\\

### 2. Install All Dependencies

\\\ash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
\\\

### 3. Configure Environment Variables

Create \ackend/.env\:

\\\env
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
\\\

Update \rontend/src/firebase.js\ with your own Firebase project credentials.

### 4. Run the Development Server

\\\ash
# From the root — starts both frontend & backend together
npm run dev
\\\

| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5173 |
| Backend (Express) | http://localhost:5000 |
| Admin Panel | http://localhost:5173/admin |

### 5. Default Login Credentials

| Role | Email | Password |
|------|-------|---------|
| Admin | admin@mbibricks.com | admin123 |
| Customer | ravi@example.com | password123 |

---

## 🔐 Environment Variables

### Backend (\ackend/.env\)

| Variable | Description |
|----------|------------|
| \JWT_SECRET\ | Secret key for JWT token signing |
| \PORT\ | Server port (default: 5000) |

### Frontend (\rontend/src/firebase.js\)

Configure your Firebase project credentials directly in the file:

\\\js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
\\\

---

## 🔌 API Overview

| Module | Base Route | Key Endpoints |
|--------|-----------|---------------|
| Auth | \/api/auth\ | POST /register, /login, /firebase-login |
| Products | \/api/products\ | GET /, POST /, PUT /:id, DELETE /:id |
| Cart | \/api/cart\ | GET /, POST /items, PUT /items/:id, DELETE /items/:id |
| Orders | \/api/orders\ | GET /, POST /, PATCH /:id/status |
| Customers | \/api/customers\ | GET /, GET /:id, addresses CRUD |
| Inventory | \/api/inventory\ | GET /, POST / |
| Payments | \/api/payments\ | GET /, POST / |
| Expenses | \/api/expenses\ | GET /, POST /, DELETE /:id |
| Deliveries | \/api/deliveries\ | GET /, POST / |
| Reports | \/api/reports\ | GET /summary |
| Settings | \/api/settings\ | GET /, PUT / |
| Notifications | \/api/notifications\ | POST /delivery-charge |

All protected routes require: \Authorization: Bearer <JWT_TOKEN>\

---

## 🗺️ Pages & Routes

### Customer Routes
| Path | Page |
|------|------|
| \/\ | Home Page |
| \/products\ | Products Listing |
| \/product/:id\ | Product Detail |
| \/cart\ | Shopping Cart |
| \/checkout\ | Multi-step Checkout |
| \/order-confirm/:id\ | Order Confirmation |
| \/orders\ | My Orders |
| \/orders/:id\ | Order Detail |
| \/profile\ | User Profile |
| \/wishlist\ | Wishlist |
| \/login\ | Login |
| \/register\ | Register |

### Admin Routes
| Path | Page |
|------|------|
| \/admin/dashboard\ | KPI Dashboard |
| \/admin/orders\ | Orders Management |
| \/admin/orders/:id\ | Order Detail + Dispatch |
| \/admin/products\ | Product Management |
| \/admin/inventory\ | Inventory Tracking |
| \/admin/customers\ | Customer List |
| \/admin/customers/:id\ | Customer Detail |
| \/admin/payments\ | Payment Records |
| \/admin/invoices\ | Invoice Generator |
| \/admin/deliveries\ | Delivery Tracking |
| \/admin/expenses\ | Expense Logger |
| \/admin/reports\ | Analytics Reports |
| \/admin/settings\ | Business Settings |

---

## 📞 Contact

**MBI Bricks Industries**
- 📍 H96P+4X5, Bommenahalli, Handanakere Hobli, C N Halli Tq, Karnataka 572119
- 📞 +91 63661 94899
- ✉️ contact@mbibricks.com
- 💬 [WhatsApp](https://wa.me/916366194899)
- 🗺️ [Google Maps](https://www.google.com/maps/search/?api=1&query=H96P%2B4X5,Bommenahalli,Karnataka)

**Owner**: Nandakumar B C

---

<p align="center">Made with ❤️ for MBI Bricks Industries, Karnataka</p>
