# Wi-Fi Captive Portal - Frontend Application

A modern, responsive Single Page Application (SPA) for both public guest authentication and administrative network management.

## Tech Stack
- **React 18**
- **TypeScript**
- **Vite 5**
- **Tailwind CSS**
- **Lucide Icons**
- **React Router 6**

## Features
- **Guest Captive Portal** (`/portal`): Mobile-first, consent checkbox, minimal information collection, simulated/live status display.
- **Session Status Countdown** (`/portal/status/:sessionToken`): Live countdown timer, device parameters, voluntary disconnect.
- **Admin Dashboard** (`/admin`): Overview metrics, session management and revocation, location CRUD, device inventory and blocking, analytics, audit trail, and gateway diagnostics.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
The app will run at `http://localhost:5173`.

### 3. Production Build
```bash
npm run build
```
