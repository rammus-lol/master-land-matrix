const source = new ol.source.Vector();

const vectorLayer = new ol.layer.Vector({
  source: source,
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 0.2)',
    }),
    stroke: new ol.style.Stroke({
      color: '#fc941d',
      width: 2,
    }),
    image: new ol.style.Circle({
      radius: 7,
      fill: new ol.style.Fill({
        color: '#fc941d',
      }),
    }),
  }),
});

const map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(),
    }),
    vectorLayer,
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([2.35, 48.85]),
    zoom: 10,
  }),
});

const typeSelect = document.getElementById('type');
let draw;

function addInteraction() {
  const value = typeSelect.value;

  // 🟡 C’EST LA SEULE DIFFÉRENCE : on retire l’interaction précédente avant d’en ajouter une
  if (draw) {
    map.removeInteraction(draw);
  }

  if (value !== 'None') {
    draw = new ol.interaction.Draw({
      source: source,
      type: value,
    });
    map.addInteraction(draw);
  }
}

// Quand on change le type de géométrie
typeSelect.onchange = addInteraction;

// Bouton “Undo” pour retirer le dernier point ajouté
document.getElementById('undo').addEventListener('click', function () {
  if (draw) {
    draw.removeLastPoint();
  }
});

// Initialisation
addInteraction();

// Ajuster à l’étendue globale
map.getView().fit(ol.proj.get('EPSG:3857').getExtent(), { size: map.getSize() });
