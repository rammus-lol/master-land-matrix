# 01 - Frontend (Vite.js)

## 1) What the frontend is for

The frontend is the visible part of the project: it is what users see and interact with in their browser.

In this project, the frontend is mainly used to:
- display pages (`index`, `maps`, `documentation`),
- load content (for example, Markdown documentation),
- provide map and interface interactions,
- send and receive data through API calls to the Django backend.

---

## 2) Technologies used

- **Vite**: development and build tool (fast and modern).
- **JavaScript (ES modules)**: interface logic.
- **CSS**: visual styling.
- **Marked**: converts Markdown to HTML for documentation display.
- **OpenLayers (`ol`)**: map rendering and map interactions.
- **ol-load-geopackage**: load GeoPackage files in the browser.
- **shpjs**: load Shapefiles in the browser.

---

## 3) Frontend folder structure

```text
website/
├── public/
│   ├── documentation/        # Markdown documentation files
│   ├── images/               # Static images
│   └── templates/            # HTML templates for map features
├── src/
│   ├── scripts/              # JavaScript logic
│   │   ├── document.js       # Documentation loader
│   │   ├── main.js           # Map initialization
│   │   ├── vectorlayertools.js
│   │   ├── loading_and_saving.js
│   │   ├── non_cartographic_export.js
│   │   └── ...               # Other modules
│   └── styles/               # CSS stylesheets
├── index.html                # Home page (root level)
├── maps.html                 # Map page (root level)
├── documentation.html        # Documentation page (root level)
├── package.json              # Dependencies + npm scripts
└── vite.config.js            # Vite configuration
```

---

## 4) Key files to know

### `src/scripts/document.js`
This script:
1. loads multiple Markdown files from `public/documentation/` (INDEX.md, 00-introduction.md, etc.),
2. converts each Markdown file to HTML using `marked`,
3. concatenates and injects the results into the documentation page,
4. shows error messages if files cannot be loaded.

It is the core of the frontend documentation display system.

### `vite.config.js`
This file configures:
- the development server (accessible from outside),
- build entry pages (`index.html`, `maps.html`, `documentation.html`),
- optimization for selected modules,
- **MPA** mode (multi-page app).

---

## 5) Running the frontend

## Requirements
- Node.js installed
- npm installed

### Development (with hot reload)
```bash
npm run dev
```

### Production build
```bash
npm run build
```

### Preview the production build
```bash
npm run preview
```

---

## 6) Relationship with the Django backend

The frontend does not run heavy business logic:
- it renders the interface,
- it sends HTTP requests,
- it displays server responses.

The Django backend handles processing and data.

In short:
- **Frontend = display + interactions**
- **Backend = data + server logic**

---

## 7) Simple maintenance guidelines

- Keep scripts organized by role (docs, map, modals, export, etc.).
- Avoid moving backend business logic into the frontend.
- Use clear and user-friendly error messages in the interface.
- After each change, check:
  - `npm run dev` (quick verification),
  - then `npm run build` (production validation).

---

## 8) Summary

The frontend in this project is a multi-page web application built with Vite. It focuses on rendering, user interactions, and communication with Django APIs. Documentation is loaded dynamically from a Markdown file, which makes updates easier without changing HTML code.
