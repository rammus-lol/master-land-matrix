// Initialisation de la carte OpenLayers
const map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    // Centrer sur le monde entier : centre [0,0] et zoom très éloigné (0)
    view: new ol.View({
        center: ol.proj.fromLonLat([0, 0]), // Longitude, Latitude du centre (0,0)
        zoom: 0
    })
});

// Optionnel : forcer l'ajustement à l'étendue globale en projection Web Mercator
// (utile si on veut garantir que l'étendue maximale est couverte)
map.getView().fit(ol.proj.get('EPSG:3857').getExtent(), { size: map.getSize() });
