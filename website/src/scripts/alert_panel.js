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

/**
 * JS class to create a dynamic element
 * @param {string} string corresponding to an HTML element id
 */

class AlertPanel {

    constructor(htmlElementId = 'top-center') {
        this.pageComponent = document.getElementById(htmlElementId);
        this.getOriginalContent()
        this.alertTimeOut = null;
    }
    /**
     * Save the original content of the element
     * */
    getOriginalContent() {
        this.originalContent = this.pageComponent.innerText;
        this.originalStyle = this.pageComponent.style.cssText;
    }
    /**
     * Reset to original content of the element
     * @param {number}  [fadingTime=0] the exact amount of second before applying the restoration
     * */
    dropModification(fadingTime = 0) {
        if (this.alertTimeOut) {
            clearTimeout(this.alertTimeOut);
        }
        const restore = () => {
            this.pageComponent.innerText = this.originalContent;
            this.pageComponent.style.cssText = this.originalStyle;
        };
        if (fadingTime > 0) {
           this.alertTimeOut = setTimeout(restore, fadingTime * 1000);
        } else {
            restore();
        }
    }
    /**
     * This is the method to apply a modification
     * *
     * @param {Object} [modification={}] - CSS modification to apply at the element.
     * @param {string|null} [message=null] - If you want to change the text of the element.
     * @param {number} [duration=0] - change duration in seconds.
     * @returns {void}
     */

    alerting(modification = {}, message = null, duration = 0) {
        this.dropModification()
        if (Object.keys(modification).length > 0) {
            for (const [key, value] of Object.entries(modification)) {
                this.pageComponent.style.setProperty(key, value);
            }
        }

        if (message) {
            this.pageComponent.innerText = message;
        }

        if (duration > 0) {
            this.dropModification(duration);
        }
    }
}

export default AlertPanel;