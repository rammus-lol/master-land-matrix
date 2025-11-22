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


typeSelect.onchange = addInteraction;


document.getElementById('undo').addEventListener('click', function () {
    const type = draw.type_; 
    // If the selected tool is known point or circle erase the last drawed feature
    if (['Circle', 'Point'].includes(type)) {
      const features = source.getFeatures();
      if (features.length>0) {
        const last=features[features.length-1];
        source.removeFeature(last);}        
      }
    else {
        // Else remove the last point of the polygone
        draw.removeLastPoint();
    }
});
  document.getElementById('export').addEventListener('click', function () {
    const format = new ol.format.GeoJSON();
    const features = source.getFeatures();
    const geojson = format.writeFeatures(features);
    console.log("donnée exportée")});
addInteraction();
document.getElementById('clear').addEventListener('click', clearMap);
function clearMap() {
    source.clear(); 
}
const dropArea = document.getElementById("drop-area");


['dragenter','dragover','dragleave','drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => e.preventDefault());
    dropArea.addEventListener(eventName, (e) => e.stopPropagation());
});

// highlight zone
['dragenter','dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'));
});
['dragleave','drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'));
});

// DROPZONE
dropArea.addEventListener('drop', async (e) => {
    e.preventDefault();

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    let features = [];

    try {
        if (fileName.endsWith(".geojson") || fileName.endsWith(".json")) {
            const text = await file.text();
            const format = new ol.format.GeoJSON();
            features = format.readFeatures(text, { featureProjection: "EPSG:3857" });
        }
        else if (fileName.endsWith(".kml")) {
            const text = await file.text();
            const format = new ol.format.KML();
            features = format.readFeatures(text, { featureProjection: "EPSG:3857" });
        } 
        else if (fileName.endsWith(".zip")) {
            const arrayBuffer = await file.arrayBuffer();
            const geojson = await shp(arrayBuffer);
            const format = new ol.format.GeoJSON();
            features = format.readFeatures(geojson, { featureProjection: "EPSG:3857" });
        }
        else {
            alert("Format non supporté !");
            return;
        }
        if (features.length > 0) {
            source.addFeatures(features);

            const extent = source.getExtent();
            map.getView().fit(extent, { padding: [20, 20, 20, 20] });
        }

    } catch (err) {
        console.error("Erreur lors du chargement du fichier :", err);
        alert("Erreur lors du chargement du fichier : " + err.message);
    }
});
dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('highlight');
});

dropArea.addEventListener('dragleave', (e) => {
    dropArea.classList.remove('highlight');
});

const openFileBtn = document.getElementById("openFileBtn");
const fileInput = document.getElementById("fileInput");

openFileBtn.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    let features = [];

    console.log("Fichier sélectionné :", fileName);

    try {

        if (fileName.endsWith(".geojson") || fileName.endsWith(".json")) {
            const text = await file.text();
            const format = new ol.format.GeoJSON();
            features = format.readFeatures(text, { featureProjection: "EPSG:3857" });
        }

        else if (fileName.endsWith(".kml")) {
            const text = await file.text();
            const format = new ol.format.KML();
            features = format.readFeatures(text, { featureProjection: "EPSG:3857" });
        }

        else if (fileName.endsWith(".zip")) {
            const arrayBuffer = await file.arrayBuffer();
            const geojson = await shp(arrayBuffer);
            const format = new ol.format.GeoJSON();
            features = format.readFeatures(geojson, { featureProjection: "EPSG:3857" });
        }

        else {
            alert("Format non supporté !");
            return;
        }

        if (features.length > 0) {
            source.addFeatures(features);

            const extent = source.getExtent();
            map.getView().fit(extent, { padding: [20, 20, 20, 20] });

            console.log("Nombre de features chargées :", features.length);
        }

    } catch (err) {
        console.error("Erreur lors du chargement :", err);
        alert("Erreur lors de la lecture du fichier.");
    }
});
const kpPanel = document.getElementById("known-point-panel");
const kpDrawBtn = document.getElementById("kp_draw");

typeSelect.addEventListener("change", () => {
    const value = typeSelect.value;

    if (value === "Point") {
        kpPanel.style.display = "block";  
    } else {
        kpPanel.style.display = "none";   // showing only if the user select known point
    }
});

kpDrawBtn.addEventListener("click", () => {

    const lon = parseFloat(document.getElementById("kp_lon").value);
    const lat = parseFloat(document.getElementById("kp_lat").value);
    const radius = parseFloat(document.getElementById("kp_radius").value);

    if (isNaN(lon) || isNaN(lat) || isNaN(radius)) {
        alert("Veuillez entrer longitude, latitude et rayon.");
        return;
    }

    // this function was conceptualised for field observation where points are created with a gps
    const center3857 = ol.proj.transform([lon, lat], "EPSG:4326", "EPSG:3857");

    const circle = new ol.geom.Circle(center3857, radius);

    const feature = new ol.Feature(circle);

 
    source.addFeature(feature);

    // Zoom on circle
    const extent = circle.getExtent();
    map.getView().fit(extent, { padding: [20, 20, 20, 20] });

    console.log("Known point circle added");
});
map.getView().fit(ol.proj.get('EPSG:3857').getExtent(), { size: map.getSize() });
