class AlertPanel {

    constructor(htmlElementId = 'top-center') {
        this.pageComponent = document.getElementById(htmlElementId);
        this.getOriginalContent()
        this.alertTimeOut = null;
    }

    getOriginalContent() {
        this.originalContent = this.pageComponent.innerText;
        this.originalStyle = this.pageComponent.style.cssText;
    }

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