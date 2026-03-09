import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import Point from 'ol/geom/Point';
import Feature from "ol/Feature";
import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { getCenter } from 'ol/extent';

/**
 * Creates an OpenLayers style based on the layer name.
 * @description
 * The layer name corresponds to the `feature_type` property
 * in the GeoJSON returned by the backend.
 *
 * @param {string} typeName - The name of the feature type (e.g., 'areas', 'high_accuracy_location').
 * @returns {import('ol/style/Style').default} The OpenLayers Style object tailored for the given type.
 */
export function resultStyle(typeName) {
    if (typeName === "high_accuracy_location") {
        return new Style({
            stroke: new Stroke({color: "#fc941d", width: 2}),
            fill: new Fill({color: "rgba(252, 148, 29, 0.3)"}),
            image: new CircleStyle({
                radius: 6,
                fill: new Fill({color: "#fc941d"}),
                stroke: new Stroke({color: "white", width: 1})
            })
        });
    }
    else if (typeName === "low_accuracy_location") {
        return new Style({
            stroke: new Stroke({color: "#43b6b5", width: 2}),
            fill: new Fill({color: "rgba(67, 182, 181, 0.3)"}),
            image: new CircleStyle({
                radius: 6,
                fill: new Fill({color: "#43b6b5"}),
                stroke: new Stroke({color: "white", width: 1})
            })
        });
    }
     else if (typeName === 'areas') {
        return new Style({
            stroke: new Stroke({color: "#000000", width: 1}),
            fill: new Fill({color: "rgba(252, 148, 29, 0.5)"})
        });
    } else if (typeName === 'administrative_region') {
        return new Style({
            stroke: new Stroke({color: '#000000', width: 0.5}),
            fill: new Fill({color: "rgba(0,0,0,0)"})
        });
    }
}
/**
 * the conversion table between checkbox ids and layer name
 * @type {Object}
 * */
export const vectorSources =
    {
        "admin-reg-btn" : "administrative_region",
        "low-acc-btn" : "low_accuracy_location",
        "high-acc-btn" : "high_accuracy_location",
        "area-btn" : "areas",
    };
const layerSources = {};

/**
 * Add empty layers based on vectorSources values
 * Take vectorLayerList et return it with all the added layers
 * Create style with {@link resultStyle} (ctrl/cmd+left click)
 * @param {import('ol/Map').default} map
 * @param {Array} vectorLayerList
 */
export function layerConstructor(map,vectorLayerList) {

    for (const [id, layerName] of Object.entries(vectorSources)) {

        // Creation of a source
        const source = new VectorSource();
        layerSources[layerName] = source;
        source.on('removefeature', updateGlobalExportStatus);
        source.on('addfeature', updateGlobalExportStatus);
        // Fetching checkbox based on id key value
        const checkbox = document.getElementById(id);

        // Layer creation
        const layer = new VectorLayer({
            source: source,
            style: resultStyle(layerName),
            // Initial layer visibility is based on checkbox status
            visible: checkbox.checked,
            properties: {
                layerName: layerName
            }
        })
        vectorLayerList.push(layer);

        map.addLayer(layer);

        // Update layer visibility on the right checkbox
        checkbox.addEventListener('change', (e) => {
            layer.setVisible(e.target.checked);
        })
    }
    return vectorLayerList;
}
/**
 * A function which add event listener to activate querying button
 * depending on the layers added by {@link layerConstructor} emptiness
 * take nothing return nothing
 * */
function updateGlobalExportStatus() {
    const downloadButtons = document.querySelectorAll('#downloadExcel, #downloadCSV, #downloadPDF');
    const hasAnyData = Object.values(layerSources).some(source => source.getFeatures().length > 0);
    downloadButtons.forEach(btn => {
        btn.classList.toggle('deactivate', !hasAnyData);
    });
}
/**
 * takes a geojson object and update the layers based on their feature_type property
 * return a list for {@link exportSpreadSheetandPDF} list parameter
 * @param {Object} geojsonObject
 * @returns {integer[] | void} an array corresponding to unique values of deals id
 * */
export function layerUpdator(geojsonObject) {
    if (!geojsonObject || !geojsonObject.features) return;
    const idset = new Set();
    const data = { ...geojsonObject };
    delete data.crs; //Due to django magic original crs tree is unnormed and  ol can't read it, so I use this.

    const allFeatures = new GeoJSON().readFeatures(data, {
        dataProjection: 'EPSG:3857',
        featureProjection: 'EPSG:3857'
    });

    for (let feature of allFeatures) {
        if (feature.get('id') !== null) {
            idset.add(feature.get('id'));
        }
        const type = feature.get('feature_type');
        const source = layerSources[type]
        if (!source) {
            console.warn(`Unknown layer type : "${type}". Check backend/frontend mapping.'${new GeoJSON(feature)}'`);
        }
        else {
            if (type.includes('accuracy')) {
                const geometry = feature.getGeometry();
                let center;
                const extent  = geometry.getExtent()
                center = getCenter(extent)
                const pointFeature = new Feature({
                    geometry: new Point(center),
                    feature_type: type
                });
                source.addFeature(pointFeature);
            }
            source.addFeature(feature)
        }
    }
    console.log(idset)
    return [...idset];
}
