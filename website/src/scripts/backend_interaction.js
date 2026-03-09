import GeoJSON from 'ol/format/GeoJSON';
import {showLegend} from './legend.js';
import {Circle, Point} from "ol/geom.d.ts";
import Feature from 'ol/Feature.js';
import {layerUpdator} from "./vectorlayertools.js";
import {map,draw,select,modify,drawingSource,topCenterPanel,toolButtons,penBtn,API_BASE_URL} from "./main.js";
const yellowTemplate = {
    "background-color": "#FFD700",
    "color": "#000000"
};
const redTemplate = {
    "background-color" : "#b61010",
    "height": "70px",
    "fontsize": "20px"
};
/**
 * Performs a spatial query by sending map geometries to the backend.
 * * @description
 * This function extracts features from the drawing source and pre-processes
 * OpenLayers geometries (converting Circles to Points with a radius attribute
 * for GeoJSON compatibility). It posts the data to the spatial API, updates
 * map layers via {@link layerUpdator}, and fits the map view to the results.
 *
 * @async
 * @function performSpatialQuery
 * * @returns {Promise<[number[], string] | void>} A promise that resolves to a Tuple:
 * - [0]: {number[]} dealIdArray - List of Deal IDs found.
 * - [1]: {string} resultStatus - Success message or status string from the backend.
 * Returns undefined if no geometries are found or if a server error occurs.
 * * @throws {Error} Logs a technical error if the fetch request fails or the server is unreachable.
 * * @see {@link layerUpdator} For the rendering logic of the resulting GeoJSON.
 * @see {@link API_BASE_URL} For the backend endpoint configuration.
 */
export async function performSpatialQuery() {
    map.removeInteraction(draw);
    const format = new GeoJSON();
    const features = drawingSource.getFeatures();

    if (features.length === 0) {
        alert("No geometries on the map !");
        return;
    }
    // Unfortunately, geojson don't support circle geometry type, we have to transform it into point object
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

    const body={"geojson":geojsonObject,"is_precise" : document.querySelector("#precise_loc-btn input").checked};
    try {
        topCenterPanel.alerting(
            yellowTemplate,
            "Performing spatial query to find deals...",
            10
        );
        const query = await fetch(`${API_BASE_URL}/api/geom/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        console.log(body);
        if (!query.ok) {
            const error = `Server error: ${query.status}.\nPlease contact us below`;
            topCenterPanel.alerting(yellowTemplate, error, 30);
            return;
        }

        const response = await query.json();
        const resultStatus = response.status;
        const resultGeoJSON = response.data;

        if (resultGeoJSON === 0) {
            const emptyMessage = response.status;
            topCenterPanel.alerting(yellowTemplate, emptyMessage, 30);
            return;
        }

        topCenterPanel.alerting({"background-color" : "#fc941d"}, resultStatus);

        //toolButtons.forEach(b => b.classList.remove('active'));
        const dealIdArray = layerUpdator(resultGeoJSON);
        toolButtons.forEach(b => b.classList.remove('active'));
        // deactivate penBtn
        penBtn.classList.remove('active');
        select.setActive(false);
        modify.setActive(false);
        select.getFeatures().clear();
        map.getView().fit(map.getLayers().item(2).getSource().getExtent(),
            {padding: [20, 20, 20, 20],
                duration: 1000});
        // Show legend when results are displayed
        showLegend();
        return [dealIdArray,resultStatus];
    } catch (err) {
        console.error("Technical error:", err);
        topCenterPanel.alerting(redTemplate, "The server is disconnected.", 30);
        return;
    }
}

/**
 * Manages non-cartographic data exports in various formats.
 * * @description
 * Coordinates the generation and downloading of export files. Supports the GOAT CSV (semicolon delimited),
 * the slop Excel (XLSX), and PDF reports. It extracts the IDs from the utility array
 * and triggers a browser download via {@link exportSpreadSheetandPDF}.
 *
 * @param {[integer[], string]} utilityArray - A tuple containing:
 * - [0]: {integer[]} idList - Array of unique deal identifiers.
 * - [1]: {string} statusMessage - Status or summary message for the alerting panel.
 * @param {'xlsx' | 'csv' | 'pdf'} format - The target file extension/format.
 * * @returns {Promise<void>} Resolves when the download process is initiated.
 * @throws {Error} If the export process fails or the network is unreachable.
 * * @see {@link exportSpreadSheetandPDF} For the underlying fetch and blob creation logic.
 */
export const exportSpreadSheetandPDF = async (utilityArray, format) => {
    if (!Array.isArray(utilityArray[0]) || utilityArray[0].length === 0) {
        throw new Error(`No IDs available for ${format.toUpperCase()} export`);
    }

    const naming = {
        "xlsx": "export.xlsx",
        "csv": "export.csv",
        "pdf": "export_report.pdf",
    };

    let objectUrl = null;
    topCenterPanel.alerting(yellowTemplate,`Downloading ${format.toUpperCase()} file`)
    try {
        const response = await fetch(`${API_BASE_URL}/api/sheet/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/octet-stream, application/pdf, application/json'
            },
            body: JSON.stringify({
                id_list: utilityArray[0],
                format: format
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Backend error detail:", errorText);
            throw new Error(`Server error (${response.status}): ${errorText}`);
        }
        else{
            topCenterPanel.alerting({"background-color" : "#fc941d"}, utilityArray[1]);
        }

        const blob = await response.blob();

        objectUrl = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.style.display = 'none'; // Discret
        a.href = objectUrl;
        a.download = naming[format];
        document.body.appendChild(a);
        a.click();
        a.remove();

    } catch (error) {
        console.error(`Error exporting ${format.toUpperCase()}:`, error);
        throw error;
    } finally {
        if (objectUrl) {
            window.URL.revokeObjectURL(objectUrl);
        }
    }
};

