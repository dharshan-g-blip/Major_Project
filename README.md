# Serenova — Mental Healthcare Practice Suite & Telehealth SaaS

**Serenova** is an end-to-end, production-ready SaaS platform engineered for independent mental health professionals (clinical psychologists, psychotherapists, and psychiatrists) in India. It empowers practitioners to run their private practice autonomously: client acquisition, scheduling, advance Razorpay/UPI payments, role-restricted clinical documentation (EHR/SOAP), and business analytics — all anchored through a single branded link (`serenova.care/dr-sharma`).

---

## 🌐 Live URLs & Project Links

* **Live Cloud Deployment**: [https://serenova.onrender.com](https://serenova.onrender.com)
* **GitHub Repository**: [https://github.com/dharshan-g-blip/Major_Project](https://github.com/dharshan-g-blip/Major_Project)
* **Unified Single-Port Local Service**: `http://localhost:5000`

---

## 🔑 Demo Access Credentials

| Role | Access URL | Credentials | Notes |
| :--- | :--- | :--- | :--- |
| **Doctor / Practitioner Workspace** | `https://serenova.onrender.com/login?role=doctor` | **Email**: `dr.sharma@serenova.care`<br>**Password**: `Password123!` | Active on **Pro Tier** with 1-click demo login buttons |
| **Client / Patient Sanctuary** | `https://serenova.onrender.com/login?role=client` | **Email**: `rohan.verma@example.com` | Confidential sanctuary for upcoming sessions, shared notes & chat |
| **Public Practitioner Profile** | `https://serenova.onrender.com/dr-sharma` | *Public Access (No login required)* | Hero, RCI credentials, packages, slot picker, intake & advance payment |
| **Full Calendar & Schedule** | `https://serenova.onrender.com/therapist/schedule` | *Logged in Doctor* | Weekly schedule, slot buffers, session duration controls |
| **Clinical Notes EHR** | `https://serenova.onrender.com/therapist/notes` | *Logged in Doctor* | Private clinical charting + shared homework exercises |
| **Business Intelligence** | `https://serenova.onrender.com/therapist/analytics` | *Logged in Doctor* | Revenue trends, session breakdown, no-show rate analytics |

---

## 🌟 Key Architecture & Single-Port Setup

Per the enterprise specification, **the entire application runs on ONE SINGLE PORT (Port 5000)**:
* **Frontend**: React 18 SPA compiled with Vite + Tailwind CSS served directly by Express.
* **Backend API**: REST API mounted on `/api/...`.
* **Real-Time Communication**: Socket.io real-time chat running on the exact same HTTP server instance (`ws://...`).
* **Resilient Snapshot Engine**: Pre-loaded clinical snapshot database ensuring zero-config 20ms responses even during database spin-ups or cloud maintenance.
* **Static Assets & PDF Invoices**: Served directly from `/uploads/...`.

---

## 🚀 Quick Start Guide (Local Development)

### 1. Prerequisites
* **Node.js**: v18+ installed
* **MongoDB**: Running locally at `mongodb://127.0.0.1:27017/unfazed` (or runs in zero-config snapshot mode)

### 2. Install All Dependencies
```bash
npm run install:all
```

### 3. Build & Run the Unified Application
```bash
npm run build
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser!

### 4. Run Automated Test Suite
```bash
npm test
```

---

## 🏗️ 7-Module Architecture Implementation

### Module 1: Foundations — Auth, Profile & the Branded Link
* **Therapist Schema**: `name`, `email`, `password_hash` (bcryptjs), `slug` (unique validation), `bio`, `specializations[]`, `languages[]`, `qualifications`, `sessionFee`.
* **Public Profile (`/:slug`)**: Open Graph meta tags, verified credential badge, fee display.
* **Authentication**: JWT token verification middleware protecting all provider routes.

### Module 2: Scheduling System
* **Availability Schema**: Recurring weekly schedule windows, buffer times (15 min default), duration options (30, 45, 60, 90 mins).
* **Timezone Converter**: Slot generator supporting IST, GST, BST, ET, PT, and SGT.
* **Double-Booking Prevention**: Overlap lock rejecting conflicting bookings with `409 Conflict`.
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
* **Centralized Entitlements**: Single source of truth via `entitlementService.canAccess(therapistId, featureKey)`.
* **Config-Driven Caps**: Dynamic active client limits (Free: 5, Starter: 25, Pro: Unlimited), note template access, and package sales.
* **Upgrade Interstitial**: Interactive modal displaying Indian pricing (₹0 / ₹1,499 / ₹3,499 per month) with real-time tier switching.
* **MongoDB Aggregation Dashboard**:
  * Revenue Trend pipeline (`$dateToString: "%Y-%m"` grouping)
  * Session status attendance breakdown (Completed, Scheduled, Cancelled, No-Show)
  * Real-time practice attendance & retention rate calculation

---

## 🛡️ Automated Safety Snapshot & Database Recovery
* **Bundled Snapshot**: Located at `unfazed-backend/src/data/data_snapshot.json` containing pre-populated clinical profiles, sessions, and payments.
* **Instant Snapshot**: Created automatically on every startup and stored safely at `unfazed-backend/uploads/backups/data_snapshot.json`.
* **Manual Snapshot**: Triggered via `POST /api/backup/trigger` or viewed at `GET /api/backup/status`.
