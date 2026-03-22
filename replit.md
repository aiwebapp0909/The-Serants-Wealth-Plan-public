# The Serants Wealth Plan

## Overview
A luxury dark-themed financial planning web app built with React, Vite, Tailwind CSS, Firebase, Framer Motion, and Recharts. Imported from GitHub: `aiwebapp0909/The-Serants-Wealth-Plan-public`.

## Tech Stack
- **Framework:** React 18
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3 (luxury dark theme with gold accent)
- **Routing:** React Router DOM 6
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Backend/Auth:** Firebase
- **Package Manager:** npm
- **Port:** 5000

## Project Structure
```
├── index.html           # Entry HTML
├── vite.config.js       # Vite config (host: 0.0.0.0, port: 5000, allowedHosts: true)
├── tailwind.config.js   # Custom dark luxury theme
├── postcss.config.js    # PostCSS config
├── package.json         # Dependencies
├── src/
│   ├── main.jsx         # React entry point
│   ├── index.css        # Global styles + Tailwind directives
│   ├── App.jsx          # Router setup
│   └── pages/
│       └── Dashboard.jsx  # Main dashboard with stats, chart, milestones
└── dist/                # Build output (gitignored)
```

## Running the App
```bash
npm run dev
```
Runs on `http://0.0.0.0:5000`

## Building for Production
```bash
npm run build
```

## Notes
- The original GitHub repo only contained config files and dist — the `src/` directory was scaffolded based on the app's dependencies and theme
- Firebase is a dependency but not yet configured — add your Firebase config in `src/firebase.js`
- Dark mode is enabled via Tailwind's `class` strategy (set on `<html class="dark">`)
