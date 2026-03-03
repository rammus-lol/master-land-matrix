import Map from 'ol/Map';
import View from 'ol/View.js';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import Draw from 'ol/interaction/Draw.js';
import Select from 'ol/interaction/Select.js';
import Modify from 'ol/interaction/Modify.js';
import { fromLonLat,transform,get } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import OSM from 'ol/source/OSM.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import TileLayer from 'ol/layer/Tile';
import {Circle,Point} from 'ol/geom';
import Feature from 'ol/Feature';
import {defaults as defaultControls,ScaleLine} from 'ol/control';
import {sql_js_version} from 'ol-load-geopackage';
import {defaults as defaultInteractions} from 'ol/interaction/defaults';

//custom scripts
import LayerSwitcherModal from './modal.js';
import AlertPanel from "./alert_panel.js";
import { initializePopup } from './popup.js';
import { initializeLegend, showLegend } from './legend.js';
import {sqlStarter,loadFile,saveGeoJSON} from "./loading_and_saving.js";
import {layerUpdator,layerConstructor} from "./vectorlayertools.js";
import exportCsv from './export_csv.js';
import exportXlsx from './export_xlsx.js';

// API Base URL - change for production/development
// const API_BASE_URL = 'https://landmatrix.artxypro.org';
const API_BASE_URL = 'http://localhost:8000';
const sqlJsWasmDir = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/' + sql_js_version;
let sqlInitializer=null;
const topCenterPanel = new AlertPanel()

const drawingSource = new VectorSource();
//for the moment I keep the initialization at the beginning, if it's appear it's slows down the app for
const scaleControl = new ScaleLine({
    className: 'ol-scale-line',
    target: document.getElementById('scale-line-container'),
});

const controls = defaultControls().extend([scaleControl]);
const checkbox = document.getElementById("drawing-btn");
const drawingLayer = new VectorLayer({
  source: drawingSource,
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
    visible :checkbox.checked,
});


checkbox.addEventListener('change', (e) => {
    drawingLayer.setVisible(e.target.checked)
});

const map = new Map({
    interactions: defaultInteractions(),
    controls: controls,
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    }),
      drawingLayer
  ],
  view: new View({
    center: fromLonLat([2.35, 48.85]),
    zoom: 10,
  }),
});
let vectorLayerList = [drawingLayer]
vectorLayerList = layerConstructor(map, vectorLayerList);

// force the select only on the drawing layer to avoid confusion with the result layer
//select feature only if button pen is active

const select = new Select({ 
  layers: [drawingLayer],
  active: false, // Start with select interaction inactive
});

const modify = new Modify({
features: select.getFeatures(),
active: false, // Start with modify interaction inactive
});

//1. Add interactions to the map
map.addInteraction(select);
map.addInteraction(modify);

// 2. Logic to toggle based on the Pen button
const penBtn = document.querySelector('.btn-tool[data-type="pen"]');

penBtn.addEventListener('click', () => {
  // Toggle a class for visual feedback
  const isActive = penBtn.classList.toggle('active');

  // Sync the interactions with the button state
  select.setActive(isActive);
  modify.setActive(isActive);

  // Deactivate drawing tools when pen is active
  if (isActive) {
    addInteraction(null);
    toolButtons.forEach(b => {
      if (b !== penBtn) b.classList.remove('active');
    });
  }

  // Optional: Clear selection when deactivating tool
  if (!isActive) {
    select.getFeatures().clear();
  }
});


const baseLayerSwitcher = new LayerSwitcherModal(map, null,'base-layer-modal', 'base-layer-switcher-btn');
const displayManager = new LayerSwitcherModal(map,vectorLayerList,"vector-layer-modal","vector-layer-switcher-btn")

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
      source: drawingSource,
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

    // If this is the pen button, skip this handler (it has its own logic)
    if (type === 'pen') {
      return;
    }

    // Deactivate select/modify when using other drawing tools
    select.setActive(false);
    modify.setActive(false);
    select.getFeatures().clear();

    // Toggle active state
    toolButtons.forEach(b => b.classList.remove('active'));

    
    if (currentDrawType === type) {
      // Deactivate if clicking the same tool
      addInteraction(null);
      kpPanel.style.display = 'none';
    } else {
      // Activate a new tool
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
    // If the selected tool is known point or circle erase the last drawn feature
    if (['Circle', 'Point'].includes(type)) {
      const features = drawingSource.getFeatures();
      if (features.length>0) {
        const last=features[features.length-1];
        drawingSource.removeFeature(last);}
      }
    else {
        // Else remove the last point of the polygone
        draw.removeLastPoint();
    }
});
addInteraction();
document.getElementById('clear').addEventListener('click', clearMap);
function clearMap() {
    topCenterPanel.dropModification();
    const allLayers = map.getLayers().getArray()
    const vectorLayers = allLayers.filter(layer => layer instanceof VectorLayer);
    for (const layer of vectorLayers) {layer.getSource().clear();}
}

const dropArea = document.getElementById("drop-area");
const fileInput = document.getElementById("fileInput");

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
    if (!sqlInitializer) {
        sqlInitializer = sqlStarter();
    }
    if (dragCounter === 0) {
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
    if (dragCounter < 0) {dragCounter=0} // Same bootstrapping in the other way
    if (dragCounter === 0) {
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

    dragCounter = 0; // Complete Rest

    topCenterPanel.dropModification();
    dropZone.classList.remove("highlight");

    if (highlightTimeout) {
        clearTimeout(highlightTimeout);
        highlightTimeout = null;
    }

    if (e.dataTransfer.files.length > 0) {
        await loadFile(e.dataTransfer.files,drawingSource,map);

    }
});

dropArea.addEventListener("dragenter", (e)=>{
    e.preventDefault();
    e.stopPropagation();
    topCenterPanel.alerting(yellowTemplate, dragmessage,10);
    if (!sqlInitializer) {
        sqlInitializer = sqlStarter();
    }
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
        await loadFile(e.dataTransfer.files,drawingSource,map);
    }
});

dropArea.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    topCenterPanel.alerting(yellowTemplate, dragmessage);
    if (!sqlInitializer) {
        sqlInitializer = sqlStarter();
    }
    fileInput.click()
});

fileInput.addEventListener("change", async (e) => {
    if (e.target.files.length > 0) {
        await loadFile(e.target.files,drawingSource,map);
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

    // this function was conceptualized for field observation where points are created with a gps
    const center3857 = transform([lon, lat], "EPSG:4326", "EPSG:3857");

    const circle = new Circle(center3857, radius);

    const feature = new Feature(circle);

 
    drawingSource.addFeature(feature);

    // Zoom on circle
    const extent = circle.getExtent();
    map.getView().fit(extent, { padding: [20, 20, 20, 20] });
    

});
map.getView().fit(get('EPSG:3857').getExtent(), { size: map.getSize() });
let resultLayer = null;
let selectedDealIds = [];

function extractDealIds(geojson) {
  if (!geojson || !Array.isArray(geojson.features)) {
    return [];
  }

  const ids = geojson.features
    .filter((feature) => feature?.properties?.feature_type !== 'administrative_region')
    .map((feature) => feature?.properties?.id)
    .filter((id) => Number.isInteger(id));

  return [...new Set(ids)];
}

// Reusable function to perform spatial query on drawing layer features
async function performSpatialQuery() {
    map.removeInteraction(draw);
    const format = new GeoJSON();
    const features = drawingSource.getFeatures();

    if (features.length === 0) {
        alert("No geometries on the map !");
        return false;
    }
    // Unfortunately, geojson don't support circle object, we have to transform it into point object
    // and add a radius property, backend retransform it into a polygone with shapely.buffer 
    const processedFeatures = [];
    features.forEach(f => {
        const geom = f.getGeometry();

        if (geom instanceof Circle) {
            // Extract center+radius for added circle
            const center = geom.getCenter();
            const radius = geom.getRadius();
            const pointGeom = new Point(center);

            // Create new feature for backend sending
            const newF = new Feature({
                geometry: pointGeom,
                radius: radius,
                original_type: "Circle"
            });
            processedFeatures.push(newF);
        } else {
            processedFeatures.push(f);
        }
    });
    // Convert to GeoJSON
    const geojsonObject = format.writeFeaturesObject(processedFeatures, {
        featureProjection: "EPSG:3857",
        dataProjection: "EPSG:3857"
    });

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
            topCenterPanel.alerting(yellowTemplate, error, 30);
            return false;
        }

        const response = await query.json();
        const resultStatus = response.status;
        const resultGeoJSON = response.data;

        if (resultGeoJSON === 0) {
          selectedDealIds = [];
            const emptyMessage = response.status;
            topCenterPanel.alerting(yellowTemplate, emptyMessage, 30);
            return false;
        }

        selectedDealIds = extractDealIds(resultGeoJSON);

        topCenterPanel.alerting({"background-color" : "#43b6b5"}, resultStatus);

        if (resultLayer !== null) {
            map.removeLayer(resultLayer);
        }
        //toolButtons.forEach(b => b.classList.remove('active'));
        layerUpdator(resultGeoJSON);
        toolButtons.forEach(b => b.classList.remove('active'));
        // deactive penBtn
        penBtn.classList.remove('active');
        select.setActive(false);
        modify.setActive(false);
        select.getFeatures().clear();
        map.getView().fit(map.getLayers().item(2).getSource().getExtent(),
            {padding: [20, 20, 20, 20],
                duration: 1000});
        // Show legend when results are displayed
        showLegend();
        return true;
    } catch (err) {
      selectedDealIds = [];
        console.error("Technical error:", err);
        topCenterPanel.alerting(redTemplate, "The server is disconnected.", 30);
        return false;
    }
}

document.getElementById('downloadCSV').addEventListener('click', async () => {
  // If no deals are queried but there are geometries on the map, perform query first
  if (selectedDealIds.length === 0 && drawingSource.getFeatures().length > 0) {
    topCenterPanel.alerting(
      {"background-color": "#FFD700", "color": "#000000"},
      "Performing spatial query to find deals...",
      5
    );
    const querySuccess = await performSpatialQuery();
    if (!querySuccess) {
      alert('Could not query database to find deals.');
      return;
    }
  }

  if (selectedDealIds.length === 0) {
    alert('No deals available. Draw geometries and query the database first.');
    return;
  }

  try {
    await exportCsv(selectedDealIds, API_BASE_URL);
  } catch {
    alert('CSV export failed. Please try again.');
  }
});

document.getElementById('downloadExcel').addEventListener('click', async () => {
  // If no deals are queried but there are geometries on the map, perform query first
  if (selectedDealIds.length === 0 && drawingSource.getFeatures().length > 0) {
    topCenterPanel.alerting(
      {"background-color": "#FFD700", "color": "#000000"},
      "Performing spatial query to find deals...",
      5
    );
    const querySuccess = await performSpatialQuery();
    if (!querySuccess) {
      alert('Could not query database to find deals.');
      return;
    }
  }

  if (selectedDealIds.length === 0) {
    alert('No deals available. Draw geometries and query the database first.');
    return;
  }

  try {
    await exportXlsx(selectedDealIds, API_BASE_URL);
  } catch {
    alert('Excel export failed. Please try again.');
  }
});

document.getElementById('export').addEventListener('click', async () => {
    await performSpatialQuery();
});
const saveBtn = document.getElementById("saveBtn");
const filenameBox = document.getElementById("saveFilenameBox");
const filenameInput = document.getElementById("saveFilenameInput");
const saveOkBtn = document.getElementById("saveOkBtn");
const saveCancelBtn = document.getElementById("saveCancelBtn");

// Managing display button
saveBtn.addEventListener("click", () => {
    saveBtn.style.display = "none";
    filenameBox.style.display = "flex";
    filenameInput.value = "";
    filenameInput.focus();
});

// validating with ok buton
saveOkBtn.addEventListener("click", () => {
    triggerSave();
});

// cancel button
saveCancelBtn.addEventListener("click", () => {
    resetSaveUI();
});

// validating with enter
filenameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        triggerSave();
    } else if (e.key === "Escape") {
        resetSaveUI();
    }
});

// Function to reset UI to initial state
function resetSaveUI() {
    filenameBox.style.display = "none";
    saveBtn.style.display = "";
    filenameInput.value = "";
}

// Triggering function
function triggerSave() {
    const filename = filenameInput.value.trim();
    if (!filename) {
        alert("Please enter a filename.");
        return;
    }

    saveGeoJSON(drawingSource.getFeatures(), filename);

    // back to welcoming ui
    resetSaveUI();
}

// Panel toggle functionality
const panelToggleBtn = document.getElementById('panelToggle');
const sidePanel = document.querySelector('.side-panel');

panelToggleBtn.addEventListener('click', () => {
    sidePanel.classList.toggle('collapsed');
    panelToggleBtn.innerHTML = sidePanel.classList.contains('collapsed') ?  '‹':'›' ;

    // Force the update for the OpenLayers maps if not the panel space stay empty
    setTimeout(() => {
        map.updateSize();
    }, 300);
});


