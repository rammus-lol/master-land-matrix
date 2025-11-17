// Version minimale : fait un fetch et affiche la réponse dans la console
(function(){
	const url = 'https://landmatrix.org/api';
	console.log('Envoi de la requête vers', url);

	fetch(url, { headers: { 'Accept': 'application/json' } })
		.then(response => {
			console.log('Réponse HTTP:', response.status, response.statusText);
			return response.json().catch(err => {
				console.error('Impossible de parser le JSON:', err);
				throw err;
			});
		})
		.then(data => {
			console.log('Données reçues (preview):', Array.isArray(data) ? data.slice(0,5) : data);
		})
		.catch(err => {
			console.error('Erreur fetch:', err);
			// Indication possible de CORS — utile pour le dev local
			if(err instanceof TypeError) console.warn('Si la requête est bloquée, vérifiez un problème de CORS ou faites la requête côté serveur.');
		});
})();

