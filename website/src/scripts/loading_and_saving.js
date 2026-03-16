/*
 * Copyright (c) 2026, Land Matrix Geodata Visualiser
 * All rights reserved.
 * 
 * This software is governed by the CeCILL license under French law and
 * abiding by the rules of distribution of free software.  You can  use, 
 * modify and/ or redistribute the software under the terms of the CeCILL
 * license as circulated by CEA, CNRS and INRIA at the following URL
 * "http://www.cecill.info".
 */

import { initSqlJsWasm, loadGpkg , sql_js_version} from 'ol-load-geopackage';
import shp from 'shpjs';
import GeoJSON from 'ol/format/GeoJSON';
import KML from 'ol/format/KML';
import VectorSource from 'ol/source/Vector';
import Circle from 'ol/geom/Circle';
import {fromCircle} from 'ol/geom/Polygon';

const sqlJsWasmDir = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/' + sql_js_version;

//SQLite instance initializer
export async function sqlStarter() {
    return initSqlJsWasm(sqlJsWasmDir);
}

//  loading file function
/**
 * The function driving the file loading process
 * @param {FileList} files list of files for example like in e.dataTransfer.files
 * @param {import('ol/source/Vector').default} vectorsource an OpenLayers vector source
 * @param {import('ol/Map').default} map
 * @param {boolean} returnClause a boolean expressing if you want to automatically put features inside vectorsource or return them
 * @returns {void | import('ol/source/Vector').default} by default returns nothing,
 * every features goes in the given source, but if returnClause is set to true it returns a vectorSource.
 * In case you wanna apply spatial treatment before displaying it.
 * */
export async function loadFile(files, vectorsource, map,returnClause=false) {
    const allowed_ext = new Set(["geojson", "shp", "json", "kml", "zip", "gpkg"]);
    //managing unzipped shp is really gluteal pain it's in the list but if just for alerting
    //I let shpjs managing .zip without shapefiles in it
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
                    features.push(...new GeoJSON().readFeatures(text, {
                        featureProjection: "EPSG:3857"
                    }));
                } else if (fileName.endsWith(".kml")) {
                    const text = await file.text();
                    features.push(...new KML().readFeatures(text, {
                        featureProjection: "EPSG:3857"
                    }));
                } else if (fileName.endsWith(".zip")) {
                    const buffer = await file.arrayBuffer();
                    const geojson = await shp(buffer);
                    if (Array.isArray(geojson)) {
                        for (const geo of geojson) {
                            features.push(...new GeoJSON().readFeatures(geo, {
                                featureProjection: "EPSG:3857"
                            }));
                        }
                    }
                    else {
                        features.push(...new GeoJSON().readFeatures(geojson, {
                            featureProjection: "EPSG:3857"
                        }));
                    }
                }
                else if (fileName.endsWith(".shp")) {
                    alert(".shp isn't a loneliness enjoyer you need to zip all your files having the same name but different extension and give it back to me.");
                    return;
                }
                else if (fileName.endsWith(".gpkg")) {
                    const displayProjection = "EPSG:3857";
                    try {
                        const dataFromGpkg = (await loadGpkg(file, displayProjection))[0];
                        for (const table of Object.values(dataFromGpkg)) {
                            const tableFeatures = table.getFeatures();
                            features.push(...tableFeatures);
                        }
                    } catch (error) {
                        alert("ol-load-geopackage error: " + error);
                    }
                }
            } catch (err) {
                console.error("Load error:", err);
                alert("Error while reading file.");
            }
    }
    if (features.length === 0) {
        alert("No features found in the given files");
        return;
    }
    else if (features.length > 0 && returnClause===false) {
        vectorsource.addFeatures(features);
        map.getView().fit(vectorsource.getExtent(), {padding: [20, 20, 20, 20]});
    }
    else {
        const tempSource = new VectorSource();
        tempSource.addFeatures(features);
        return tempSource;
    }
}
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

