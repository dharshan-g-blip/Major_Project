# Unfazed — Practice-in-a-Box SaaS for Therapists in India

**Unfazed** is a comprehensive, production-ready SaaS platform engineered for independent mental health professionals (psychologists, psychotherapists, psychiatrists) in India to run their private practice end-to-end: client acquisition, scheduling, advance payments, role-restricted clinical documentation (EHR), and business analytics — all anchored through one branded link (e.g., `unfazed.in/dr-sharma`).

---

## 🌟 Key Architecture & Single-Port Setup

Per the project specification and instructions, **the entire application runs on ONE SINGLE PORT (Port 5000)**:
* **Frontend**: React SPA compiled with Vite + Tailwind CSS served directly by the Express server.
* **Backend API**: REST API mounted on `/api/...`.
* **Real-Time Communication**: Socket.io real-time chat running on the exact same HTTP server instance (`ws://localhost:5000`).
* **Static Assets & PDF Invoices**: Served directly from `/uploads/...`.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
* **Node.js**: v18+ installed
* **MongoDB**: Running locally at `mongodb://127.0.0.1:27017/unfazed`

### 2. Seed Realistic Test Data
Populate demo therapists (Dr. Ananya Sharma), clients, multi-month revenue records, and clinical notes:
```bash
cd unfazed-backend
npm run seed
```

### 3. Run the Automated Test Suite (15/15 Tests)
Validate all 7 modules, auth, double-booking lock, role-based note security, GST PDF generation, and MongoDB aggregations:
```bash
cd unfazed-backend
npm test
```

### 4. Run the Unified Application (Single Port)
```bash
cd unfazed-backend
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser!

---

## 🔑 Pre-Seeded Demo Credentials

| Role | Access URL | Credentials | Notes |
| :--- | :--- | :--- | :--- |
| **Therapist Dashboard** | `http://localhost:5000/login` | **Email**: `dr.sharma@unfazed.in`<br>**Password**: `Password123!` | Active on **Pro Plan** with one-click autofill on login page |
| **Public Branded Page** | `http://localhost:5000/dr-sharma` | *Public Access (No login required)* | Hero, specializations, packages, slot picker, intake & Razorpay |
| **Client Portal** | `http://localhost:5000/portal` | **Email**: `rohan.verma@example.com` | Appointments, strictly shared notes, live socket chat, invoices |
| **Profile Settings** | `http://localhost:5000/therapist/profile` | *Logged in practitioner* | Edit bio, qualifications, rates, buffer times, and custom slug |

---

## 🎨 UI/UX Design System & Platform Benchmark

Our UI was designed after analyzing the category leaders: **SimplePractice**, **Alma**, **Headway**, **Cal.com**, and **Practo**:
1. **Calming Clinical Aesthetics**: Warm forest teal (`#115E59`), soft sage neutrals, and emerald accents preventing cognitive fatigue during charting.
2. **TipTap Rich Text WYSIWYG Editor**: Formatting bar (Bold, Italic, Strikethrough, Heading 2/3, Bullet/Numbered Lists, Quotes, Undo/Redo) in the clinical note editor.
3. **Toast Notifications**: Lightweight, accessible floating toasts replacing browser `alert()` popups.
4. **Priority Waitlist Engine**: One-click waitlist registration when slots are filled or for prospective lead capture.
5. **Emergency Crisis Support Banner**: Compassionate national helpline notice (Tele-MANAS 14416 / Vandrevala / AASRA).
6. **Floating Feature Navigator**: Seamlessly switch between Therapist Hub, Public Link, Client Portal, Notes EHR, and Analytics with one click.

---

## 🏗️ 7-Module Architecture Implementation

### Module 1: Foundations — Auth, Profile & the Branded Link
* **Therapist Schema**: `name`, `email`, `password_hash` (bcryptjs), `slug` (unique validation), `bio`, `specializations[]`, `languages[]`, `qualifications`, `sessionFee`.
* **Public Profile (`/:slug`)**: Open Graph meta tags, verified credential badge, fee display.
* **Authentication**: JWT token verification middleware protecting all provider routes.

### Module 2: Scheduling System
* **Availability Schema**: Recurring weekly schedule windows, buffer times (15 min default), duration options (30, 45, 60, 90 mins).
* **Timezone Converter**: Slot generator supporting IST, GST, BST, ET, PT, and SGT.
* **Double-Booking Prevention**: Database-level overlap lock rejecting race conditions with `409 Conflict`.
* **Waitlist Engine**: Allows prospective clients to register for occupied slots or custom times.

### Module 3: Client CRM & Intake
* **Client Schema**: Foreign-key reference to therapist, sortable/filterable client roster.
* **Informed Digital Consent**: Auditable consent capture recording user agreement, timestamp, IP address, and consent schema version (`v1.0`).
* **Intake Form**: Demographics, presenting concerns, emergency contacts, and therapy history.

### Module 4: Payments & Packages
* **Razorpay Integration**: Order creation, signature verification, and mock fallback for seamless testing.
* **Session Packages**: 3, 6, and 12-session discounted bundles with expiry tracking and session balance decrementing.
* **GST Invoice PDF Generation**: Automated PDF invoice creation using PDFKit with SAC code `999312` (Healthcare Psychotherapy) and 18% GST breakdown.

### Module 5: Clinical Documentation (EHR)
* **Strict Role-Restricted Split**:
  * **Private Notes**: Diagnostic hypotheses, transference notes, and clinical impressions. Strictly blocked by the API serializer from ever leaking into any client-facing route.
  * **Shared Notes**: Homework action items, thought record diaries, and psychoeducation worksheets accessible in the Client Portal.
* **Structured Templates**: Freeform TipTap rich text, structured **SOAP** (Subjective, Objective, Assessment, Plan), and **DAP** (Data, Assessment, Plan).

### Module 6: Communication (Real-Time Chat & Notifications)
* **Socket.io Chat**: Real-time messaging, typing indicators, and read receipts between therapist and client.
* **Event-Driven Notification Architecture**: Domain events trigger on session booking, payment, 24h reminders, and post-session follow-ups.
* **WhatsApp Stub**: Logs structured WhatsApp notifications into an auditable queue.
* **Email Layer**: Nodemailer transport integration.

### Module 7: Subscription Tiers & Business Analytics
* **Centralized Entitlements**: Single source of truth via `entitlementService.canAccess(therapistId, featureKey)`. No route checks tier strings directly.
* **Config-Driven Caps**: Dynamic active client limits (Free: 5, Starter: 25, Pro: Unlimited), note template access, and package sales.
* **Upgrade Interstitial**: Interactive modal displaying Indian pricing (₹0 / ₹1,499 / ₹3,499 per month) with real-time tier switching.
* **MongoDB Aggregation Dashboard**:
  * Revenue Trend pipeline (`$dateToString: "%Y-%m"` grouping)
  * Session status attendance breakdown (Completed, Scheduled, Cancelled, No-Show)
  * Real no-show rate percentage calculation

---

## 🚢 Production Deployment Options

### Option A: Docker / Docker Compose (Recommended)
The repository contains a production-ready multi-stage `Dockerfile` and `docker-compose.yml`:
```bash
docker compose up -d --build
```
This launches both the unified app on port `5000` and MongoDB on port `27017` with persistent volumes and auto-restart.

### Option B: 1-Click Cloud Deployment (Render / Railway / Heroku)
1. **Repository Settings**: Connect this repo to Render or Railway.
2. **Build Command**: `npm run build`
3. **Start Command**: `npm start`
4. **Environment Variables**:
   * `NODE_ENV=production`
   * `PORT=5000`
   * `MONGO_URI=<your-mongodb-atlas-uri>`
   * `JWT_SECRET=<strong-random-key>`
   * `RAZORPAY_KEY_ID=rzp_test_unfazedDemoKey`
   * `RAZORPAY_KEY_SECRET=rzp_test_secret_unfazedDemoSecret`
   * `CLIENT_URL=https://your-app-domain.com`

---

## 🛡️ Automated Safety Snapshot & Database Recovery
* **Instant Snapshot**: Created automatically on every startup and stored safely at `unfazed-backend/uploads/backups/data_snapshot.json`.
* **Manual Snapshot**: Triggered via `POST /api/backup/trigger` or viewed at `GET /api/backup/status`.
* **Automatic Cold-Start Recovery**: If connected to an empty cloud MongoDB instance, the system automatically hydrates all collections without manual intervention.
