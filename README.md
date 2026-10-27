<p align="center">
  <img src="docs/images/banner.png" alt="Transaction Ranking System Banner">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-blue.svg?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.5-blue.svg?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/FastAPI-0.100-009688.svg?logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/SQLite-Database-003B57.svg?logo=sqlite" alt="SQLite">
  <img src="https://img.shields.io/badge/JWT-Auth-black.svg?logo=jsonwebtokens" alt="JWT">
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/Version-1.0-orange.svg" alt="Version">
</p>

<h2 align="center">Production-Ready Full Stack SaaS Application</h2>

> **Transaction Ranking System (TRS)** is a high-performance web application that tracks financial transactions, computes multi-factor user scores, and displays live leaderboards. It includes a robust **Admin Panel** for system management, analytics, and audit logging.

---

## 📖 Table of Contents
- [Demo](#-demo)
- [Project Overview](#-project-overview)
- [Features](#-features)
- [Application Preview](#-application-preview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Evaluation Access](#-evaluation-access)
- [Developer Information](#-developer-information)

---

## 🎬 Demo

![Application Demo](docs/images/demo.gif)

---

## 🌟 Project Overview

Transaction Ranking System is designed as a SaaS platform with role-based authentication (`admin` and `user`). The system securely hashes passwords, utilizes JWTs for API protection, and provides real-time analytical capabilities via Recharts and Framer Motion.

*For detailed insights on the ranking algorithm and system design, please see the [Extended Documentation (EXPLANATION.md)](./EXPLANATION.md).*

---

## 🚀 Features

| User Application | Admin Panel | Security & Infrastructure |
|------------------|-------------|---------------------------|
| 📊 Interactive Dashboard | 📈 Full System Analytics | 🔒 bcrypt Password Hashing |
| 💸 Transaction Management | 👥 User Management & Filtering | 🔑 JWT Bearer Tokens |
| 🏆 Live Leaderboard | 💸 Global Transaction History | 🛡️ Role-Based Access Control |
| 👤 Profile & Settings | ⚙️ Audit Logs & System Health | 📱 Responsive Mobile-First UI |
| 🌙 Dark Mode Support | 📊 CSV Data Export | 🚦 FastAPI Data Validation |

---

## 📸 Application Preview

### Login
![Login](docs/images/login.png)

---

### Dashboard
![Dashboard](docs/images/dashboard.png)

---

### Leaderboard
![Leaderboard](docs/images/leaderboard.png)

---

### New Transaction Page
![New Transaction](docs/images/new-transaction.png)

---

### User Summary
![User Summary](docs/images/user-summary.png)

---

### Transaction History
![Transaction History](docs/images/transaction-history.png)

---

### Admin Dashboard
![Admin Dashboard](docs/images/admin-dashboard.png)

---

### Admin Users
![Admin Users](docs/images/admin-users.png)

---

### Admin Analytics
![Admin Analytics](docs/images/admin-analytics.png)

---

### Admin Transactions
![Admin Transactions](docs/images/admin-transactions.png)

---

### Settings
![Settings](docs/images/settings.png)

---

### Evaluation Access Expanded
![Evaluation Access Expanded](docs/images/evaluation-access.png)

---

### Dark Theme
![Dark Theme](docs/images/dark-theme.png)

---

### Swagger API Documentation
![Swagger API Documentation](docs/images/swagger.png)

---

## 🏗️ Architecture

```
┌─────────────────┐     REST / JWT      ┌─────────────────┐
│  React Frontend │ ◄──────────────────► │  FastAPI Backend │
│  (Vite + TS)    │     /api proxy       │  (SQLAlchemy)    │
└─────────────────┘                      └────────┬────────┘
                                                  │
                                          ┌───────▼────────┐
                                          │  SQLite DB     │
                                          └────────────────┘
```

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion, Recharts
- **Backend**: FastAPI, SQLAlchemy, bcrypt, python-jose (JWT)
- **Auth**: JWT Bearer tokens with role claims (`admin` | `user`)
- **Admin**: Separate route tree at `/admin/*`, protected by backend HTTP 403

---

## 💻 Tech Stack

| Layer    | Technologies                                      |
|----------|---------------------------------------------------|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, Recharts |
| **Backend**  | Python 3, FastAPI, Pydantic, SQLAlchemy, bcrypt |
| **Database** | SQLite (default, production-ready via ORM)      |
| **DevOps**   | concurrently, ESLint, PostCSS                     |

---

## ⚡ Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/NrxD-14/transaction-ranking-system.git
cd transaction-ranking-system

# Install Frontend dependencies
npm run install:frontend

# Install Backend dependencies
pip install -r backend/requirements.txt
```

### Running the Application

```bash
# Run both Frontend and Backend concurrently
npm run dev

# Alternatively, run them separately:
npm run dev:frontend
npm run dev:backend
```

- App URL: `https://transaction-ranking-system-chi.vercel.app/login`
- API URL: `http://localhost:8000`
- Swagger Docs: `http://localhost:8000/docs`

---

## 🔌 API Documentation

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/login` | Authenticate user & get JWT | No |
| `POST` | `/auth/signup` | Register new account | No |
| `GET` | `/transactions` | List all current user transactions | Yes (User) |
| `POST` | `/transaction` | Create a new transaction | Yes (User) |
| `GET` | `/ranking` | Get live leaderboard standings | Yes (User) |
| `GET` | `/admin/analytics`| System-wide chart data | Yes (Admin) |

*For a full list of endpoints, visit `http://localhost:8000/docs` after starting the server.*

---

## 🔑 Evaluation Access

For assignment evaluation purposes, administrator credentials can be revealed on the Login page:

1. Open the Login page.
2. Expand **Evaluation Access**.
3. Enter the Evaluation Code: `DEVN1427`
4. Use the revealed credentials to access the Admin Panel.

---

## 🔮 Future Improvements

- PostgreSQL production deployment with connection pooling.
- Refresh token rotation and token revocation mechanisms.
- Real-time WebSocket updates for leaderboard.
- Docker Compose setup for one-command cloud deployment.
- End-to-end test suite using Playwright & Pytest.

---

## 👨‍💻 Developer Information

| | |
|---|---|
| **Developer** | Narayan Dev |
| **Email** | [devn038@gmail.com](mailto:devn038@gmail.com) |
| **GitHub** | [https://github.com/NrxD-14](https://github.com/NrxD-14) |

---

<p align="center">
  <i>© 2026 Narayan Dev · Transaction Ranking System · Version 1.0</i>
</p>
