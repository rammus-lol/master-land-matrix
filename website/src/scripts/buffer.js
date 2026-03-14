import GeoJSON from "ol/format/GeoJSON";
import {buffer} from "@turf/buffer";
/**
 * A function to create a buffered version of a vector source,
 * you can pass a number corresponding to radius
 * warning this function don't clear before adding, you must use a temporary vector source
 * @param {import("ol/source/Vector").default} source
 * @param {number} radius*/

export function bufferCreator(source, radius){
    const futureBuffer = new GeoJSON();
    const drawnFeatures = source.getFeatures()
    const futureFeatures = futureBuffer.writeFeaturesObject(drawnFeatures,
        {
            featureProjection: 'EPSG:3857',
            dataProjection: 'EPSG:4326'
        });
    const bufferFeatures = buffer(futureFeatures, radius, /*{units : "meters"}*/); //default unit : kilometers
    const finalFeatures = futureBuffer.readFeatures(bufferFeatures,{
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
    });
    return finalFeatures;
}

