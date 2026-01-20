import './maps.css';
import shp from 'shpjs';
import Map from 'ol/Map';
import View from 'ol/View.js';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import Draw from 'ol/interaction/Draw.js';
import { fromLonLat,transform,get } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import KML from 'ol/format/KML';
import OSM from 'ol/source/OSM.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import TileLayer from 'ol/layer/Tile';
import {Circle,Point} from 'ol/geom';
import Feature from 'ol/Feature';
import LayerSwitcherModal from './modal.js';
import AlertPanel from "./alert_panel.js";
import loadGpkg from 'ol-load-geopackage';
import * as url from "node:url";
import { initializePopup } from './popup.js';
import { initializeLegend, showLegend } from './legend.js';

// API Base URL - change for production/development
const API_BASE_URL = 'https://landmatrix.artxypro.org';
// const API_BASE_URL = 'http://localhost:8000';


const topCenterPanel = new AlertPanel()

const source = new VectorSource();

const vectorLayer = new VectorLayer({
  source: source,
  style: new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.2)',
    }),
    stroke: new Stroke({
      color: '#fc941d',
      width: 2,
    }),
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({
        color: '#fc941d',
      }),
    }),
  }),
});
const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    vectorLayer,
  ],
  view: new View({
    center: fromLonLat([2.35, 48.85]),
    zoom: 10,
  }),
});

// Initialize popup overlay
initializePopup(map);

// Initialize legend
initializeLegend(map);

let draw;
let currentDrawType = null;

function addInteraction(type) {
  if (draw) {
    map.removeInteraction(draw);
  }

  if (type && type !== 'None') {
    currentDrawType = type;
    draw = new Draw({
      source: source,
      type: type,
    });
    map.addInteraction(draw);
  } else {
    currentDrawType = null;
  }
}

// Handle drawing tool buttons
const toolButtons = document.querySelectorAll('.btn-tool');
toolButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.getAttribute('data-type');
    const kpPanel = document.getElementById('known-point-panel');
    
    // Toggle active state
    toolButtons.forEach(b => b.classList.remove('active'));
    
    if (currentDrawType === type) {
      // Deactivate if clicking the same tool
      addInteraction(null);
      kpPanel.style.display = 'none';
    } else {
      // Activate new tool
      btn.classList.add('active');
      addInteraction(type);
      
      // Show/hide known point panel
      if (type === 'Point') {
        kpPanel.style.display = 'block';
      } else {
        kpPanel.style.display = 'none';
      }
    }
  });
});


document.getElementById('undo').addEventListener('click', function () {
    if (!draw) return;
    
    const type = draw.type_ || currentDrawType; 
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
addInteraction();
document.getElementById('clear').addEventListener('click', clearMap);
function clearMap() {
    source.clear(); 
}
const dropArea = document.getElementById("drop-area");
const fileInput = document.getElementById("fileInput");

//  loading file function
async function loadFile(file) {
    if (!file) return;

    const fileName = file.name.toLowerCase();
    let features = [];
    try {
        if (fileName.endsWith(".geojson") || fileName.endsWith(".json")) {
            const text = await file.text();
            features = new GeoJSON().readFeatures(text, {
                featureProjection: "EPSG:3857"
            });
        }
        else if (fileName.endsWith(".kml")) {
            const text = await file.text();
            features = new KML().readFeatures(text, {
                featureProjection: "EPSG:3857"
            });
        }
        else if (fileName.endsWith(".zip")) {
            const buffer = await file.arrayBuffer();
            const geojson = await shp(buffer);
            features = new GeoJSON().readFeatures(geojson, {
                featureProjection: "EPSG:3857"
            });
        }
        else if (fileName.endsWith(".shp")) {
            alert(".shp isn't a loneliness enjoyer you need to zip all your files having the same name but different extension and give it back to me.");
            return; 
        }
        else if (fileName.endsWith(".gpkg")) {
            const displayProjection = "EPSG:3857";
            const url_gpkg = URL.createObjectURL(file);

            try {
                const [dataFromGpkg] = await loadGpkg(url_gpkg, displayProjection);

                let hasPolygonLayer = false;

                for (const table in dataFromGpkg) {
                    const source = dataFromGpkg[table];
                    const tableFeatures = source.getFeatures();

                    if (!tableFeatures || tableFeatures.length === 0) {
                        continue;
                    }

                    // Standard supposé : une table = un type de géométrie
                    const geomType = tableFeatures[0].getGeometry()?.getType();

                    if (geomType === "Polygon" || geomType === "MultiPolygon") {
                        hasPolygonLayer = true;
                        features.push(...tableFeatures);
                    }
                }

                if (!hasPolygonLayer) {
                    alert("The provided geopackage contains no polygonal layer (Polygon or MultiPolygon).");
                }
                URL.revokeObjectURL(url_gpkg)
            } catch (error) {
                alert("ol-load-geopackage error: " + error);
            }
        }
        else {
            alert("Unsupported format!");
            return;
        }

        if (features.length > 0) {
            source.addFeatures(features);
            map.getView().fit(source.getExtent(), { padding: [20,20,20,20] });
        }

    } catch (err) {
        console.error("Load error:", err);
        alert("Error while reading file.");
    }
}

const dropZone = map.getTargetElement();
const yellowTemplate = {
    "background-color": "#FFD700",
    "color": "#000000"
};
const dragmessage = "Supported format : GeoJSONs, KMLs, zipped SHPs and GPKGs";

let dragCounter = 0;
let highlightTimeout = null;

dropZone.addEventListener('dragenter', e => {
    e.preventDefault();
    e.stopPropagation();
    console.log("avant le test dragenter ", dragCounter);
    // On ne déclenche l'effet que si on n'était pas déjà dans la zone
    if (dragCounter === 0) {
        console.log("après le test dragenter ", dragCounter);
        console.log("Entrée réelle dans la zone");
        topCenterPanel.alerting(yellowTemplate, dragmessage, 10);
        if (highlightTimeout) {
            clearTimeout(highlightTimeout);
        }
        highlightTimeout = setTimeout(() => {
            dropZone.classList.remove("highlight");
        }, 10000);
        dropZone.classList.add("highlight");
    }
    dragCounter++;
    if (dragCounter >1) {dragCounter=1} //some bootstrapping for managing propagation.

});

dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    e.stopPropagation();

});

dropZone.addEventListener('dragleave', e => {
    e.preventDefault();
    e.stopPropagation();

    dragCounter--;
    console.log("avant le test dragleave", dragCounter);
    // On ne retire l'effet que si le compteur retombe à 0
    if (dragCounter === 0) {
        console.log("après le test dragleave",dragCounter);
        console.log("Sortie réelle de la zone");
        topCenterPanel.dropModification()
        dropZone.classList.remove("highlight");
        if (highlightTimeout) {
            clearTimeout(highlightTimeout);
            highlightTimeout = null;
        }
    }
});

dropZone.addEventListener('drop', async e => {
    e.preventDefault();
    e.stopPropagation();

    console.log("drop - counter avant reset:", dragCounter);
    dragCounter = 0; // Reset complet

    topCenterPanel.dropModification();
    dropZone.classList.remove("highlight");

    if (highlightTimeout) {
        clearTimeout(highlightTimeout);
        highlightTimeout = null;
    }

    if (e.dataTransfer.files.length > 0) {
        await loadFile(e.dataTransfer.files[0]);
    }

    console.log("drop - counter après reset:", dragCounter);
});

["dragenter"].forEach(evt =>
    dropArea.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        topCenterPanel.alerting(yellowTemplate, dragmessage,10);
        dropArea.classList.add("highlight");
    })
);
dropArea.addEventListener("dragenter", (e)=>{
    e.preventDefault();
    e.stopPropagation();
    topCenterPanel.alerting(yellowTemplate, dragmessage,10);
    dropArea.classList.add("highlight");
});

dropArea.addEventListener("dragover", (e)=>{
    e.preventDefault();
    e.stopPropagation();
});

dropArea.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    topCenterPanel.dropModification();
    dropArea.classList.remove("highlight");
});

dropArea.addEventListener("drop", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.remove("highlight");
    topCenterPanel.dropModification();
    if (e.dataTransfer.files.length > 0) {
        await loadFile(e.dataTransfer.files[0]);
    }
});

dropArea.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    topCenterPanel.alerting(yellowTemplate, dragmessage);
    fileInput.click()
});

fileInput.addEventListener("change", async (e) => {
    if (e.target.files.length > 0) {
        await loadFile(e.target.files[0]);
        topCenterPanel.dropModification();
    }
});// Knowing point
const kpDrawBtn = document.getElementById("kp_draw");

kpDrawBtn.addEventListener("click", () => {

    const lon = parseFloat(document.getElementById("kp_lon").value);
    const lat = parseFloat(document.getElementById("kp_lat").value);
    const radius = parseFloat(document.getElementById("kp_radius").value);

    if (isNaN(lon) || isNaN(lat) || isNaN(radius)) {
        alert("Please provide the three fields.");
        return;
    }

    // this function was conceptualised for field observation where points are created with a gps
    const center3857 = transform([lon, lat], "EPSG:4326", "EPSG:3857");

    const circle = new Circle(center3857, radius);

    const feature = new Feature(circle);

 
    source.addFeature(feature);

    // Zoom on circle
    const extent = circle.getExtent();
    map.getView().fit(extent, { padding: [20, 20, 20, 20] });

});
map.getView().fit(get('EPSG:3857').getExtent(), { size: map.getSize() });
let resultLayer = null;

document.getElementById('export').addEventListener('click', async () => {
    const format = new GeoJSON();
    const features = source.getFeatures();

    if (features.length === 0) {
        alert("No geometries on the map !");
        return;
    }
    // Unfortunatly, geojson don't support circle object, i have to transform it into point object 
    // and add a radius property, backend retransform it into a polygone with shapely.buffer 
    const processedFeatures = [];
    features.forEach(f => {
        const geom = f.getGeometry();

        if (geom instanceof Circle) {
            // Extract center+radius for added circle
            const center = geom.getCenter();
            const radius = geom.getRadius();
                        // Transformer le cercle → point GeoJSON
            const pointGeom = new Point(center);

            // Create new feature for backend sending
            const newF = new Feature({
                geometry: pointGeom,
                    radius: radius,           // ← radius
                    original_type: "Circle"   // ← easier to read for debugging
            });
                        processedFeatures.push(newF);

        } else {
            // polygon feature extraction
            processedFeatures.push(f);
        }
    });
    // Convert to GeoJSON
    const geojsonObject = format.writeFeaturesObject(processedFeatures, {
        featureProjection: "EPSG:3857",
        dataProjection: "EPSG:3857"
    });

    console.log("geojson envoyé :", geojsonObject);
    const redTemplate = {
        "background-color" : "#b61010",
        "height": "70px",
        "fontsize": "20px"
    };
    try {
        const query = await fetch(`${API_BASE_URL}/api/geom/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(geojsonObject)
        });

        if (!query.ok) {
            const error = `Server error: ${query.status}.\nPlease contact us below`;
            topCenterPanel.alerting(yellowTemplate, error,30);
        }

        const response = await query.json();
        console.log("backend response:", response);
        const resultStatus = response.status
        const resultGeoJSON = response.data;
        console.log(resultGeoJSON);
        if (resultGeoJSON === 0) {
            const emptyMessage = response.status;
            topCenterPanel.alerting(yellowTemplate, emptyMessage,30);
            return;
        }

        topCenterPanel.alerting({"background-color" : "#43b6b5"}, resultStatus);

        // deleting last querying (is this good ?)
        if (resultLayer !== null) {
            map.removeLayer(resultLayer);
        }

        // Building the display with backend response

    const resultSource = new VectorSource({ 
        features: new GeoJSON().readFeatures(resultGeoJSON, { featureProjection: "EPSG:3857" }) });
    const resultStyle = (feature) => {
        const props = feature.getProperties();
        const precision = props.level_of_accuracy || "";


        const orangeList = ["APPROXIMATE_LOCATION", "EXACT_LOCATION", "COORDINATES"];

        const isOrange = orangeList.includes(precision);

        const strokeColor = isOrange ? "#fc941d" : "#43b6b5";
        const fillColor = isOrange ? "rgba(252, 148, 29, 0.3)" : "rgba(67, 182, 181, 0.3)";
        const pointColor = strokeColor;

        return new Style({
            stroke: new Stroke({
                color: strokeColor,
                width: 2
            }),
            fill: new Fill({
                color: fillColor
            }),
            image: new CircleStyle({
                radius: 6,
                fill: new Fill({ color: pointColor }),
                stroke: new Stroke({ color: "white", width: 1 })
            })
        });
    };

        // New layer
        resultLayer = new VectorLayer({
            source: resultSource,
            style: resultStyle,
            name: 'results'  // Mark layer for legend detection
        });

        map.addLayer(resultLayer);
        
        // Show legend when results are displayed
        showLegend();

        // Automatic zoom on results (don't think it's good)
        map.getView().fit(resultSource.getExtent(), { padding: [20,20,20,20], duration: 800 });

    } catch (err) {
        console.error("Technical error:", err);
        topCenterPanel.alerting(redTemplate,"The server is disconnected.",30);
    }
});
const saveBtn = document.getElementById("saveBtn");
const filenameBox = document.getElementById("saveFilenameBox");
const filenameInput = document.getElementById("saveFilenameInput");
const saveOkBtn = document.getElementById("saveOkBtn");

// Managing display button
saveBtn.addEventListener("click", () => {
    saveBtn.style.display = "none";
    filenameBox.style.display = "inline-flex";
    filenameInput.value = "";
    filenameInput.focus();
});

// validating with ok buton
saveOkBtn.addEventListener("click", () => {
    triggerSave();
});

// validating with enter
filenameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        triggerSave();
    }
});

// Triggering function
function triggerSave() {
    const filename = filenameInput.value.trim();
    if (!filename) {
        alert("Please enter a filename.");
        return;
    }

    saveGeoJSON(source.getFeatures(), filename);

    // back to welcoming ui
    filenameBox.style.display = "none";
    saveBtn.style.display = "inline-block";
}

// Saveing function
function saveGeoJSON(features, filename) {
    const format = new GeoJSON();

    // Creating a geojson object
    const geojsonObject = format.writeFeaturesObject(features, {
        featureProjection: "EPSG:3857",
        dataProjection: "EPSG:3857"
    });

    // because we works in 3857 we must write it in the file
    geojsonObject.crs = {
        type: "name",
        properties: {
            name: "EPSG:3857"
        }
    };

    // 3️⃣conversion to string
    const geojsonString = JSON.stringify(geojsonObject, null, 2);

    // verify if filename ends with .geojson and if not adding it
    if (!filename.toLowerCase().endsWith(".geojson")) {
        filename += ".geojson";
    }

    // Downloading
    const blob = new Blob([geojsonString], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
}
const layerSwitcher = new LayerSwitcherModal(map);

// Panel toggle functionality
const panelToggleBtn = document.getElementById('panelToggle');
const sidePanel = document.querySelector('.side-panel');

panelToggleBtn.addEventListener('click', () => {
    sidePanel.classList.toggle('collapsed');
    panelToggleBtn.innerHTML = sidePanel.classList.contains('collapsed') ? '›' : '‹';
    
    // Force the update for the OpenLayers maps if not the panel space stay empty
    setTimeout(() => {
        map.updateSize();
    }, 300);
});

