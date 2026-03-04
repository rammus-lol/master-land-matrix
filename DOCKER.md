1. Build the Docker image:

docker build -t land-matrix-frontend .

2. Run the container:

docker run -p 4173:4173 land-matrix-frontend

This will:

Build an image named land-matrix-frontend from your Dockerfile
Run a container with port 4173 exposed (the Vite preview server port)
Access the app at http://localhost:4173
Optional flags:

-d to run in detached mode (background)
--name container-name to give the container a specific name
-e ENV_VAR=value to pass environment variables