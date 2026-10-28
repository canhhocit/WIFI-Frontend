# 📱 Wi-Fi Captive Portal — Frontend Application

[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Lucide Icons](https://img.shields.io/badge/Icons-Lucide%20React-orange.svg)](https://lucide.dev/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)](https://vitejs.dev/)

Modern, accessible, and responsive Single Page Application (SPA) providing an authentic **Mobile-First Guest Captive Portal** and an **Administrative Operations Center** for enterprise Wi-Fi management.

---

## 📑 Table of Contents

- [Features & User Experience](#-features--user-experience)
  - [1. Mobile-First Guest Portal](#1-mobile-first-guest-portal)
  - [2. Administrative Operations Center](#2-administrative-operations-center)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Directory Structure](#-directory-structure)
- [Design Philosophy](#-design-philosophy)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Installation & Development Server](#installation--development-server)
  - [Production Build](#production-build)
- [Connecting to Backend](#-connecting-to-backend)
- [License](#-license)

---

## 🌟 Features & User Experience

The application is structured into two distinct user journeys:

### 1. Mobile-First Guest Portal
Designed to provide a trustworthy, friction-free login experience on smartphones and laptops:

- **Location-Aware Splash Screen (`/portal?location={slug}`)**:
  - Dynamically renders branch branding (e.g., *Circle K Central Station*, *Airport Gateway Terminal*, *Riverside Promenade*).
  - Displays location-specific welcome banners and customer promotional survey prompts.
- **Client Network Hints**: Automatically displays the client's assigned IP address and detected hardware MAC address hint.
- **Regulatory Consent & Policy Compliance**:
  - Collapsible full-text Terms & Conditions viewer.
  - Mandatory explicit consent checkbox preventing connection without agreement.
- **Gateway Transparency Notice**:
  - Displays a clean amber notification banner clarifying that the network is currently operating in **Simulated Gateway Mode**, ensuring no false claims of physical firewall bypass during evaluation.
- **Live Session Status Page (`/portal/status/:sessionToken`)**:
  - **Live Countdown Timer** (`HH:mm:ss`) displaying remaining time allocated to the session.
  - Status pill (`Authorized`, `Pending`, `Expired`, `Revoked`).
  - Speed tier display (e.g., *Up to 25 Mbps*).
  - Voluntary **"Disconnect"** button allowing guests to terminate their session anytime.

---

### 2. Administrative Operations Center
Desktop and tablet-optimized dashboard for network operations and store managers:

- **Executive Overview (`/admin`)**:
  - Summary KPI cards: *Active Sessions*, *Today's Logins*, *Total Historical Sessions*, and *Gateway Mode*.
  - Visual session status breakdown (Authorized, Revoked, Expired, Failed).
  - Traffic distribution by location.
- **Guest Sessions Management (`/admin/sessions`)**:
  - Paginated table with instant search (MAC, IP, Guest Name, Contact).
  - Filtering by location and status.
  - **Session Inspection Modal**: Inspects full authorization timestamps, hardware metadata, and gateway references.
  - **Instant Revocation Modal**: Allows administrators to immediately drop a client session with an audited revocation reason.
- **Wi-Fi Locations Management (`/admin/locations`)**:
  - Create, view, update, and delete deployment branches.
  - Customize session duration limits (in minutes), bandwidth allowances (in Mbps), promotional surveys, and legal terms.
  - One-click toggle between active and disabled states.
- **Device Inventory (`/admin/devices`)**:
  - Real-time catalog of all connecting hardware devices.
  - User-Agent operating system detection (iOS, Android, macOS, Windows, Linux).
  - **Hardware MAC Blocklist**: Instantly restrict abusive devices from accessing the network.
- **Analytics & Trends (`/admin/analytics`)**:
  - Visual traffic market-share bars by deployment site.
  - Rolling 24-hour traffic activity histograms.
- **Security Audit Trail (`/admin/audit`)**:
  - Immutable audit trail logging admin logins, session revocations, location edits, and gateway configuration updates.
  - Filterable by specific audit action type.
- **Gateway Diagnostics & Simulation (`/admin/gateway`)**:
  - Displays live telemetry from the backend `GatewayAdapter`.
  - **Fault Injection Control**: Toggle simulated HTTP 502 gateway failures to test client resiliency.
  - **Latency Simulation Slider**: Adjust simulated network latency from 0 to 2000 ms.
  - Live log of raw gateway transaction payloads and execution times.

---

## 🛠 Architecture & Tech Stack

- **Framework**: [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 5](https://vitejs.dev/) with fast HMR
- **Routing**: [React Router 6](https://reactrouter.com/) (nested admin layouts and protected route guards)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/) (consistent, restrained icon set — no generic emoji icons)
- **API Client**: Strongly-typed native fetch client with automatic Bearer JWT injection and unified error handling

---

## 📁 Directory Structure

```
wifi-captive-frontend/
├── public/                     # Static assets (location banners, favicon)
│   └── banners/
├── src/
│   ├── api/                    # Modular API communication layer
│   │   ├── client.ts           # HTTP fetch client with JWT interceptor & error wrapper
│   │   ├── portalApi.ts        # Guest flow endpoints (init, login, status, disconnect)
│   │   ├── adminApi.ts         # Operations APIs (sessions, locations, devices, analytics, gateway)
│   │   └── authApi.ts          # Admin authentication & local token persistence
│   ├── components/             # Reusable UI primitives
│   │   ├── AlertBanner.tsx     # Clean status & warning alerts
│   │   ├── Badge.tsx           # Session status pills (Authorized, Pending, Expired, etc.)
│   │   └── Modal.tsx           # Accessible modal dialog
│   ├── pages/
│   │   ├── portal/             # Guest Captive Portal views
│   │   │   ├── PortalPage.tsx  # Splash, guest form & terms agreement
│   │   │   └── PortalStatusPage.tsx # Live countdown clock & session info
│   │   └── admin/              # Management Dashboard views
│   │       ├── AdminLayout.tsx # Responsive sidebar, gateway status header, navigation
│   │       ├── LoginPage.tsx   # Admin authentication with local credentials helper
│   │       ├── DashboardPage.tsx # Overview metrics & distribution charts
│   │       ├── SessionsPage.tsx  # Session list, filtering, and revocation modal
│   │       ├── LocationsPage.tsx # Wi-Fi branch CRUD and limit configuration
│   │       ├── DevicesPage.tsx   # Client hardware inventory & MAC blocklisting
│   │       ├── AnalyticsPage.tsx # Traffic breakdown & rolling histograms
│   │       ├── AuditPage.tsx     # Security audit events table
│   │       └── GatewayPage.tsx   # Gateway telemetry, failure injection & logs
│   ├── types/
│   │   └── models.ts           # TypeScript interfaces matching backend DTOs
│   ├── App.tsx                 # Route definitions
│   ├── index.css               # Tailwind directives & typography
│   └── main.tsx                # React application entry point
├── .env                        # Environment configuration (VITE_API_BASE_URL)
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts              # Vite proxy configuration to backend :8080
```

---

## 🎨 Design Philosophy

- **Trustworthy & Professional**: Clean corporate and retail visual identity inspired by real public networks (Circle K).
- **Restrained Visuals**: Avoids generic AI-generated neon gradients or unnecessary animations in favor of strong typography, clear spacing, and high readability.
- **State Transparency**: Clear visual states for loading, empty lists, active connection countdowns, and gateway failure notices.
- **Lucide Icons**: Consistent, vector-based line icons used throughout the entire portal and administration dashboard.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or later (`node -v`)
- **npm**: v9.0.0 or later (`npm -v`)

### Environment Configuration
The `.env` file is committed with the default relative API proxy configuration:
```properties
VITE_API_BASE_URL=/api
```
*(In production, set `VITE_API_BASE_URL` to the absolute URL of the backend service if hosted on a separate domain).*

### Installation & Development Server

1. **Install dependencies**:
   ```powershell
   npm install
   ```

2. **Start the local Vite development server**:
   ```powershell
   npm run dev
   ```

The application will be available at:
- **Guest Portal**: [http://localhost:5173/portal](http://localhost:5173/portal)
- **Specific Branch Portal**: [http://localhost:5173/portal?location=circle-k-central](http://localhost:5173/portal?location=circle-k-central)
- **Admin Dashboard**: [http://localhost:5173/admin/login](http://localhost:5173/admin/login)

### Production Build

To compile TypeScript and produce an optimized production build:
```powershell
npm run build
```

Preview the production build locally:
```powershell
npm run preview
```

---

## 🔌 Connecting to Backend

During development, `vite.config.ts` automatically proxies all `/api` requests to the Spring Boot backend running on `http://localhost:8080`:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
});
```

Ensure the backend service is running before attempting to authenticate or inspect live sessions.
Default development credentials:
- **Username**: `admin`
- **Password**: `admin123`

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
