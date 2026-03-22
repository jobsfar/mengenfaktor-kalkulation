# MFcalc – Mengenfaktor Rechner

> **⚠ Disclaimer:** This is an independent example project for educational purposes only.
> It is **not affiliated with, endorsed by, or connected to Rauch Landmaschinenfabrik GmbH**
> or any other manufacturer. Use entirely at your own risk. Always consult the official
> documentation of your spreader for any operational decisions.

A small, mobile-friendly static web app that calculates the **Mengenfaktor** (quantity factor) for centrifugal spreaders, based on working width, application rate, driving speed, and desired quantity correction.

## Features

- Slider-based input for all parameters
- Instant Massenstrom (mass flow) calculation
- Mengenfaktor lookup with linear interpolation between table rows
- Out-of-range detection with clear warnings
- Favorites stored in `localStorage` (save, load, delete)
- Responsive — works on mobile

## Formula

```
Massenstrom (kg/min) = (Arbeitsbreite (m) × Ausbringmenge (kg/ha) × Fahrgeschwindigkeit (km/h)) / 600
```

The Mengenfaktor is then read from a lookup table (with linear interpolation).

## Development

No build step required. Open `index.html` in a browser, or serve locally:

```bash
npx serve .
```

### Run unit tests

```bash
node tests/calculator.test.js
```

The tests verify all 34 exact table values, 3 out-of-range cases, 2 interpolation cases, and 2 end-to-end integration cases.

## GitHub Pages Deployment

1. Push this repo to GitHub
2. Go to **Settings → Pages → Source: GitHub Actions**
3. The included workflow (`.github/workflows/deploy.yml`) will:
   - Run all unit tests on every push to `main`
   - Deploy to GitHub Pages only if tests pass

## Project structure

```
├── index.html              # UI
├── style.css               # Styles
├── app.js                  # UI controller (imports calculator)
├── src/
│   └── calculator.js       # Pure calculation logic (ES module)
├── tests/
│   └── calculator.test.js  # Unit tests (no test framework needed)
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD
└── package.json
```
