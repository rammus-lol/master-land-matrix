# Frontend - Vite.js et Vue.js

## Architecture du Frontend

Le frontend est une application moderne construite avec **Vite** comme bundler et basée sur l'écosystème Vue.js pour la réactivité. L'application interagit avec le backend Django via des appels API REST.

## Structure des répertoires

```
website/
├── public/                 # Assets publics statiques
│   ├── documentation.html  # Page de documentation
│   ├── maps.html          # Page des cartes interactives
│   └── documentation/     # Fichiers markdown de doc
├── src/
│   ├── scripts/           # Fichiers JavaScript/TypeScript
│   │   ├── document.js    # Chargeur de documentation
│   │   └── ...            # Autres scripts
│   ├── styles/            # Fichiers CSS
│   └── templates/         # Templates HTML/Vue
├── package.json           # Dépendances npm
├── vite.config.js        # Configuration Vite
└── index.css             # Styles globaux
```

## Fichiers principaux

### `document.js`
Script responsable du chargement et de l'affichage de la documentation markdown. Utilise la bibliothèque **marked** pour convertir Markdown en HTML.

**Fonctionnalités**:
- Charge des fichiers markdown depuis `/documentation/`
- Utilise les APIs Fetch pour charger les fichiers
- Affiche les erreurs de chargement gracieusement

### `vite.config.js`
Configuration Vite pour l'optimisation des assets, le serveur de développement et le build production.

## Dépendances principales

- **marked**: Conversion Markdown vers HTML
- **Vue.js** (si utilisé): Framework réactif
- **Vite**: Bundler et serveur de développement

## Build et Déploiement

### Développement
```bash
npm run dev    # Lance le serveur Vite en hot-reload
```

### Production
```bash
npm run build  # Crée la build optimisée
```

## Style et Templating

Les fichiers CSS sont modulaires et situés dans `/src/styles/`. Chaque page peut avoir ses propres styles:
- `document.css` - Styles pour la page de documentation
- `index.css` - Styles globaux de l'application

