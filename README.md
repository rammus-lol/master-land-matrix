Changement par rapport à la branche d'Arthur
tous les .js sont des modules dans le html j'ai donc retiré toutes les balises scripts qui vont chercher directement chez openlayers
ce qui signifie que tout fonctionne à base d'import dans les js
j'ai réécris modal.js pour que ça soit une classe réutilisable pour les couches de contexte (context layers)

