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

> Note: in the current state of the `website` folder, **Vue.js is not installed** in `package.json`.

---

## 3) Frontend folder structure

```text
website/
├── public/
│   ├── documentation.md      # Markdown content shown in the documentation page
│   ├── images/               # Static images
│   └── templates/            # Static templates
├── src/
│   ├── scripts/              # JavaScript logic (maps, modals, docs, exports...)
│   │   ├── document.js
│   │   ├── main.js
│   │   └── ...
│   └── styles/               # CSS stylesheets
├── index.html                # Home page
├── maps.html                 # Map page
├── documentation.html        # Documentation page
├── package.json              # Dependencies + npm scripts
└── vite.config.js            # Vite configuration
```

---

## 4) Key files to know

### `src/scripts/document.js`
This script:
1. fetches `public/documentation.md`,
2. converts Markdown to HTML using `marked`,
3. injects the result into the documentation page,
4. shows an error message if the file cannot be loaded.

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
