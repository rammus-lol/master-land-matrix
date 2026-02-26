import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
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
export const vectorSources =
    {
        "admin-reg-btn" : "administrative_region",
        "low-acc-btn" : "low_accuracy_location",
        "high-acc-btn" : "high_accuracy_location",
        "area-btn" : "areas",
    };
const layerSources = {};

/**
 * @param {import('ol/Map').default} map
 * @param {Array} vectorLayerList
 */
export function layerConstructor(map,vectorLayerList) {
    for (const [id, layerName] of Object.entries(vectorSources)) {

        // Creation of a source
        const source = new VectorSource();
        layerSources[layerName] = source;

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
 * takes a geojson object and update the layers based on their feature type property
 * @param {Object} geojsonObject
 * */
export function layerUpdator(geojsonObject) {
    if (!geojsonObject || !geojsonObject.features) return;

    const data = { ...geojsonObject };
    delete data.crs;

    const allFeatures = new GeoJSON().readFeatures(data, {
        dataProjection: 'EPSG:3857',
        featureProjection: 'EPSG:3857'
    });

    for (let feature of allFeatures) {
        const type = feature.get('feature_type');
        if (!layerSources[type]) {
            console.warn(`Type de couche inconnu : "${type}". Vérifiez le mapping backend/frontend.'${new GeoJSON(feature)}'`);
        }
        else {
            layerSources[type].addFeature(feature)
            console.log(`feature ajouté dans ${type}`);
        }
    }
}

