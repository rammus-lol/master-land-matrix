# --- STEP 1 : BUILDER ---
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

# --- STEP 2 : RUNTIME ---
FROM python:3.14-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgdal32 \
    libsqlite3-mod-spatialite \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/.venv /app/.venv
COPY . .

# On prépare l'entrypoint AVANT de définir le démarrage
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV PATH="/app/.venv/bin:$PATH"

# L'ENTRYPOINT lance le script qui gère tout
ENTRYPOINT ["/bin/bash", "/entrypoint.sh"]