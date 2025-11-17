import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def generic_proxy(request, endpoint):
    """
    Proxy générique pour n'importe quel endpoint de l'API landmatrix.org
    Permet d'accéder à /api/<endpoint> qui sera redirigé vers https://landmatrix.org/api/<endpoint>
    """
    try:
        # Construire l'URL complète
        url = f'https://landmatrix.org/api/{endpoint}'
        
        # Transmettre les paramètres de requête s'ils existent
        params = request.GET.dict()
        
        # Faire la requête vers l'API externe
        response = requests.get(url, params=params, timeout=10)
        
        # Retourner la réponse avec le même statut
        return JsonResponse(
            response.json(),
            status=response.status_code,
            safe=False
        )
    except requests.exceptions.RequestException as e:
        # En cas d'erreur, retourner une erreur 500
        return JsonResponse(
            {'error': str(e)},
            status=500
        )
