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
addInteraction();
document.getElementById('clear').addEventListener('click', clearMap);
function clearMap() {
    source.clear(); 
}
const dropArea = document.getElementById("drop-area");
const openFileBtn = document.getElementById("openFileBtn");
const fileInput = document.getElementById("fileInput");

//  loading file function
async function loadFile(file) {
    if (!file) return;

    const fileName = file.name.toLowerCase();
    let features = [];
    try {
        if (fileName.endsWith(".geojson") || fileName.endsWith(".json")) {
            const text = await file.text();
            features = new ol.format.GeoJSON().readFeatures(text, {
                featureProjection: "EPSG:3857"
            });
        }
        else if (fileName.endsWith(".kml")) {
            const text = await file.text();
            features = new ol.format.KML().readFeatures(text, {
                featureProjection: "EPSG:3857"
            });
        }
        else if (fileName.endsWith(".zip")) {
            const buffer = await file.arrayBuffer();
            const geojson = await shp(buffer);
            features = new ol.format.GeoJSON().readFeatures(geojson, {
                featureProjection: "EPSG:3857"
            });
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
// Stoping default behavior
["dragenter","dragover","dragleave","drop"].forEach(evt =>
    dropArea.addEventListener(evt, e => {
        e.preventDefault();
        e.stopPropagation();
    })
);

// Highlight zone
["dragenter","dragover"].forEach(evt =>
    dropArea.addEventListener(evt, () => dropArea.classList.add("highlight"))
);

["dragleave","drop"].forEach(evt =>
    dropArea.addEventListener(evt, () => dropArea.classList.remove("highlight"))
);

// Drop
dropArea.addEventListener("drop", e => loadFile(e.dataTransfer.files[0]));
//  Open explorer
openFileBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", e => loadFile(e.target.files[0]));

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
        alert("Please provide the three fields.");
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

});
map.getView().fit(ol.proj.get('EPSG:3857').getExtent(), { size: map.getSize() });
let resultLayer = null;

document.getElementById('export').addEventListener('click', async () => {
    const format = new ol.format.GeoJSON();
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

        if (geom instanceof ol.geom.Circle) {
            // Extract center+radius for added circle
            const center = geom.getCenter();
            const radius = geom.getRadius();
                        // Transformer le cercle → point GeoJSON
            const pointGeom = new ol.geom.Point(center);

            // Create new feature for backend sending
            const newF = new ol.Feature({
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

    try {
        const response = await fetch("https://landmatrix.artxypro.org/api/geom/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(geojsonObject)
        });

        if (!response.ok) {
            throw new Error("Erreur serveur : " + response.status);
        }

        const data = await response.json();
        console.log("backend response:", data);

        if (!data.data) {
            console.error("No Geojson in backend response !");
            return;
        }

        const resultGeoJSON = data.data;

        // deleting last querying (is thi good ?)
        if (resultLayer !== null) {
            map.removeLayer(resultLayer);
        }

        // Building the display with backend response
    const resultSource = new ol.source.Vector({ 
        features: new ol.format.GeoJSON().readFeatures(resultGeoJSON, { featureProjection: "EPSG:3857" }) });
    const resultStyle = (feature) => {
        const props = feature.getProperties();
        const precision = props.level_of_accuracy || "";


        const orangeList = ["APPROXIMATE_LOCATION", "EXACT_LOCATION", "COORDINATES"];

        const isOrange = orangeList.includes(precision);

        const strokeColor = isOrange ? "#fc941d" : "#43b6b5";
        const fillColor = isOrange ? "rgba(252, 148, 29, 0.3)" : "rgba(67, 182, 181, 0.3)";
        const pointColor = strokeColor;

        return new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: strokeColor,
                width: 2
            }),
            fill: new ol.style.Fill({
                color: fillColor
            }),
            image: new ol.style.Circle({
                radius: 6,
                fill: new ol.style.Fill({ color: pointColor }),
                stroke: new ol.style.Stroke({ color: "white", width: 1 })
            })
        });
    };

        // New layer
        resultLayer = new ol.layer.Vector({
            source: resultSource,
            style: resultStyle
        });

        map.addLayer(resultLayer);

        // Autoomatic zoom on results (don't think it's good)
        map.getView().fit(resultSource.getExtent(), { padding: [20,20,20,20], duration: 800 });

    } catch (err) {
        console.error(err);
        alert("Error during sending to backend");
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
    const format = new ol.format.GeoJSON();

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
