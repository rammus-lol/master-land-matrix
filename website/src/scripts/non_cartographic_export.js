import {API_BASE_URL} from "./main.js";

/**
 * A function for managing non-cartographic export, it allows semicolon csv (GOAT), xlsx (slop) and PDF report
 * @param {integer[]} idList a list of integer corresponding to deal_id
 * I'm coding through webstorm which implement integer type for JSDoc
 * maybe your ide will panic, but it doesn't stop compiling the code
 * @param {string} format the file extension of the desired file
 * @returns {Promise<void>} returns nothing launch the downloading of the requested file
 */
const exportSpreadSheetandPDF = async (idList,format) => {
    if (!Array.isArray(idList) || idList.length === 0) {
        throw new Error(`No IDs available for ${format.toUpperCase()} export`);
    }
    const naming = {
        "xlsx" : "export.xlsx",
        "csv" : "export.csv",
        "pdf" : "export_report.pdf",
    }
    let url = null;
    try {
        const response = await fetch(`${API_BASE_URL}/api/sheet/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_list: idList,
                file_format: format
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = naming[format];
        document.body.appendChild(a);
        a.click();
        a.remove();
    } catch (error) {
        console.error(`Error exporting ${format.toUpperCase()} :`, error);
        throw error;
    } finally {
        if (url) {
            window.URL.revokeObjectURL(url);
        }
    }
};

export default exportSpreadSheetandPDF;