FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json ./

# Installer les dépendances
RUN npm install

# Copier tout le code source
COPY . ./

# Construire l'application pour la production
RUN npm run build

# Exposer le port de Vite preview
EXPOSE 4173

# Lancer Vite en mode preview avec --host pour accepter les connexions externes
CMD ["npm", "run", "preview", "--", "--host", "--port", "4173"]
