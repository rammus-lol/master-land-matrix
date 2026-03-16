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

