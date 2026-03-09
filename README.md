# sag-calc

`sag-calc` is a small web application for calculating sag, line-of-sight (LOS), and clearance values for overhead electrical and communication lines.

The project is implemented as a client-side single-page application using Vite and React, with Tailwind CSS for styling. It is intended as a practical calculation tool rather than a simulation or engineering-grade analysis system.

---

## Overview

The application allows users to enter measured line and clearance values, automatically computes derived sag and LOS metrics, and stores results locally during the session. Calculations update reactively as inputs change, and saved results can be exported for further use.

This repository contains only frontend code; no backend or persistent storage is used.

---

## Tech Stack

- Vite
- React
- Tailwind CSS
- JavaScript (ES6+)

---

## Live Demo

https://strelec00.github.io/sag-calc/

---

## Requirements

- Node.js `>= 22`
- npm

---

## Installation

```bash
git clone https://github.com/strelec00/sag-calc.git
cd sag-calc
npm install
npm run dev
```

---

## Build

```bash
npm run build
```

---

## Netlify Deployment

This repo is now preconfigured for Netlify via `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirect: `/* -> /index.html` (HTTP 200)
- Node version: `22.12.0`

### Option 1: Git-based deploy

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Netlify, choose **Add new site** -> **Import an existing project**.
3. Select the repository and deploy. Netlify will read `netlify.toml` automatically.

### Option 2: Manual deploy

1. Run `npm run build`.
2. Upload the `dist/` folder in Netlify (**Deploy manually**).
