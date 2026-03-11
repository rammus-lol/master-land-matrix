# 05 - Deployment and Configuration

This section explains how to configure and run the project.  
It includes instructions for **Windows** and **Linux** users and two possible setups:

- Running with **Docker (recommended)**
- Running **without Docker (bare metal)**

---

# 1. Generate the Django Secret Key

You first need to generate a secure Django secret key.

### On Windows

```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
````

### On Linux / macOS

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

Copy the generated key.

---

# 2. Configure the Environment File

Go to the following folder:

```
django_proxy/proxy_project
```

Locate the file:

```
squelete_fichier_env_prod.env
```

Edit it and replace `yoursecretkey` with the generated key.

Example:

```
ENVIRONMENT=production
SECRET_KEY=your_generated_secret_key

DJANGO_ALLOWED_HOSTS=0.0.0.0,localhost

DJANGO_CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:4173,http://localhost:5500

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173,http://localhost:5500
```

Notes:

* `DJANGO_ALLOWED_HOSTS` must contain your backend host (for example `0.0.0.0` or `localhost`)
* Do **not** include protocol or ports there (`http://` or `:8000`)
* Frontend origins go in:

  * `DJANGO_CSRF_TRUSTED_ORIGINS`
  * `CORS_ALLOWED_ORIGINS`

After editing the file, rename it to:

```
.env
```

This file will be ignored by **Docker** and **Git**.

---

# 3. Modify docker-compose Configuration

Open the file:

```
docker-compose.yml
```

Locate this line:

```
- SKIP_CRAWL=false
```

Explanation:

```
SKIP_CRAWL=false
```

* `false`: runs the data crawling script
* `true`: skips crawling for faster restarts

Set it according to your needs.

---

# 4. Running the Project with Docker (Recommended)

If you had issues during previous builds, rebuild everything:

```bash
sudo docker compose build --no-cache
sudo docker compose up -d
```

Or simply run:

```bash
sudo docker compose up -d --build
```

---

# 5. Running the Project Without Docker (Bare Metal)

## 5.1 Backend (Django)

Create a virtual environment and install dependencies.

### Linux / macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Windows

```bash
python -m venv .venv
.venv\Scripts\activate
```

Install dependencies:

```bash
cd django_proxy
pip install -r requirements.txt
```

Run the Django server:

```bash
python manage.py runserver 0.0.0.0:8000
```

---

## 5.2 Frontend

Go to the frontend folder:

```bash
cd website
```

Install dependencies:

```bash
npm install
```

Build the project:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

# Summary

Steps required:

1. Generate a Django secret key
2. Configure `.env`
3. Adjust `docker-compose.yml`
4. Run the project with Docker **or** manually

Docker is recommended for easier setup and environment consistency.
