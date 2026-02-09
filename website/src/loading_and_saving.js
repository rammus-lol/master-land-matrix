import { initSqlJsWasm, loadGpkg , sql_js_version} from 'ol-load-geopackage';
import shp from 'shpjs';
import GeoJSON from 'ol/format/GeoJSON';
import KML from 'ol/format/KML';
import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import Circle from 'ol/geom/Circle';
import {fromCircle} from 'ol/geom/Polygon';

const sqlJsWasmDir = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/' + sql_js_version;

//SQLite instance initializer
export async function sqlStarter() {
    return initSqlJsWasm(sqlJsWasmDir);
}

//  loading file function
export async function loadFile(files, vectorsource, map) {
    const allowed_ext = new Set(["geojson", "shp", "json", "kml", "zip", "gpkg"]);
    if (!files) return;
    let features = [];
    for (let file of files) {
        const extension = file.name.split('.').pop()
        if (!allowed_ext.has(extension)) {
            alert(`${file.name} is a ${extension} file, it can't be loaded in our app`);
        }
            const fileName = file.name.toLowerCase();
            try {
                if (fileName.endsWith(".geojson") || fileName.endsWith(".json")) {
                    const text = await file.text();
                    features = new GeoJSON().readFeatures(text, {
                        featureProjection: "EPSG:3857"
                    });
                } else if (fileName.endsWith(".kml")) {
                    const text = await file.text();
                    features = new KML().readFeatures(text, {
                        featureProjection: "EPSG:3857"
                    });
                } else if (fileName.endsWith(".zip")) {
                    const buffer = await file.arrayBuffer();
                    const geojson = await shp(buffer);
                    features = new GeoJSON().readFeatures(geojson, {
                        featureProjection: "EPSG:3857"
                    });
                } else if (fileName.endsWith(".shp")) {
                    alert(".shp isn't a loneliness enjoyer you need to zip all your files having the same name but different extension and give it back to me.");
                    return;
                } else if (fileName.endsWith(".gpkg")) {
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
            } catch (err) {
                console.error("Load error:", err);
                alert("Error while reading file.");
            }
    }
    if (features.length > 0) {
        vectorsource.addFeatures(features);
        map.getView().fit(vectorsource.getExtent(), {padding: [20, 20, 20, 20]});
    }
}

//Saving function

export function saveGeoJSON(features, filename) {
    let savingFeatures = []
    const format = new GeoJSON();
    for(const feature of features) {
        const geom = feature.getGeometry();
        if (geom instanceof Circle) {
            const temp = fromCircle(geom);
            const polygonizedFeature = feature.clone();
            polygonizedFeature.setGeometry(temp);
            savingFeatures.push(polygonizedFeature);
        }
        else {
            savingFeatures.push(feature);
        }
    }
    // Creating a geojson object
    const geojsonObject = format.writeFeaturesObject(savingFeatures);

    /*Because we works in 3857 we must write it in the file
    * and it doesn't work using the option property of GeoJson class*/

    geojsonObject.crs = {
        type: "name",
        properties: {
            name: "EPSG:3857"
        }
    };

    //conversion to string
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