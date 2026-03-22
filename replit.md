# Serants Wealth Plan (SWP) — A Couples Wealth Operating System

## Overview
A full-stack luxury dark-themed fintech web app for couples to manage every dollar, eliminate debt, build savings, and track their path to $20M net worth. Built with React + Vite + Tailwind + Firebase.

## Tech Stack
- **Framework:** React 18 + Vite 5
- **Styling:** Tailwind CSS 3 (custom dark luxury theme)
- **Routing:** React Router DOM 6
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Backend/Auth:** Firebase (Firestore + Auth — requires env vars)
- **State:** React Context + localStorage persistence
- **Port:** 5000

## Project Structure
```
src/
├── main.jsx              # React entry point
├── App.jsx               # Router + AppProvider wrapper
├── index.css             # Global styles + Tailwind
├── firebase.js           # Firebase config (reads from env vars)
├── context/
│   └── AppContext.jsx    # Global state (budget, goals, net worth)
├── hooks/
│   └── useLocalStorage.js
├── components/
│   └── Layout.jsx        # Bottom navigation (6 tabs)
└── pages/
    ├── Dashboard.jsx     # Goals, net worth, monthly overview
    ├── Budget.jsx        # Spreadsheet-style monthly budget
    ├── Analytics.jsx     # Net worth chart, spending breakdown
    ├── Goals.jsx         # Wealth goals by phase
    ├── Invest.jsx        # Investment projection calculator ($20M)
    └── Tools.jsx         # Tax estimator, mortgage calc, net worth tracker
```

## Pages
- **Dashboard** — Net Worth, Next Immediate Goal, Next Goal, $20M Ultimate Goal, Monthly Overview
- **Budget** — Inline editable spreadsheet: Income, Fixed Bills, Food, Fun Money, Savings, Investing
- **Analytics** — Net Worth growth chart, spending pie, planned vs actual bar chart
- **Goals** — Phase-based goals (Year 1, Year 7, Ultimate) with progress tracking
- **Invest** — Slider-based projection calculator to $20M
- **Tools** — Tax estimator (W2/1099), Mortgage calculator, Net Worth tracker with snapshots

## Design
- Background: `#0B0B0F`, Cards: `#15151C`
- Primary/Gold: `#D4AF37`, Success: `#00E676`, Error: `#FF5252`
- Fonts: Manrope (headlines), Inter (body)
- Bottom tab navigation, dark mode default

## Firebase Setup
Add these environment variables (Replit Secrets) for Firebase sync:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

App works fully in local-only mode (localStorage) without Firebase.

## Data Persistence
All data is saved to localStorage automatically. Firebase sync can be added by configuring env vars and wiring the context update functions to Firestore.
