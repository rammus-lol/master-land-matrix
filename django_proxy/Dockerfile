# --- STEP 1 : BUILDER ---
FROM python:3.14-bookworm AS builder
LABEL authors="h'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn"
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgdal-dev \
    libsqlite3-mod-spatialite \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

#uv init
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

#config file copy
COPY pyproject.toml uv.lock* ./

# dependancies instalation
RUN uv sync --frozen --no-dev

# --- STEP 2 : RUNTIME ---
FROM python:3.14-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgdal32 \
    libsqlite3-mod-spatialite \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .
COPY --from=builder /app/.venv /app/.venv

# setting up entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENV PATH="/app/.venv/bin:$PATH"

# sh script managing everything
ENTRYPOINT ["/bin/bash", "./entrypoint.sh"]