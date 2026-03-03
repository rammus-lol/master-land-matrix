# --- ÉTAPE 1 : BUILDER ---
FROM python:3.14-bookworm AS builder
LABEL authors="h'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn"
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgdal-dev \
    libsqlite3-mod-spatialite \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Installation de uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copie des fichiers de configuration AVANT le code pour le cache
COPY pyproject.toml uv.lock* ./

# Installation des dépendances (crée le dossier .venv)
RUN uv sync --frozen --no-dev

# --- ÉTAPE 2 : RUNTIME (Image finale légère) ---
FROM python:3.14-slim-bookworm

# On réinstalle juste les librairies RUNTIME (pas besoin de build-essential ici)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgdal32 \
    libsqlite3-mod-spatialite \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# On récupère l'environnement virtuel du builder
COPY --from=builder /app/.venv /app/.venv

# On copie tout ton code (app_1, app_2, etc.)
COPY . .

# On s'assure que Python utilise l'environnement virtuel
ENV PATH="/app/.venv/bin:$PATH"

# On lance Django (Adapte 'my_project' au nom de ton dossier contenant wsgi.py)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
