Our containerization package management lie on uv for backend (but you can easily switch to pip if you want) 
and npm for frontend

To build the Docker image:
from  root directory :<br>
`docker compose -d --build .`

Since backend container need C/C++ library it is quite big

