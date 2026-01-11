class alertPanel {

    constructor(htmlElementId = 'top-center') {
        this.pageComponent = document.getElementById(htmlElementId);
        this.getOriginalContent();
    }

    getOriginalContent() {
        this.originalContent = this.pageComponent.innerText;
        this.originalStyle = this.pageComponent.style.cssText;
        }

    dropModification(fadingTime=0) {
        const restore = () => {
            this.pageComponent.innerText = this.originalContent;
            this.pageComponent.style.cssText = this.originalStyle.cssText;
        };
        if (fadingTime > 0) {
            setTimeout(restore, fadingTime * 1000);
        }
        else {restore();}
    }

    alerting(modification = {}, message = null, duration = 0) {

        if (modification !== {}) {
            for (const [key, value] of Object.entries(modification)) {
                this.pageComponent.style.setProperty(key, value);
            }}

        if (message) {
            this.pageComponent.innerText = message;
        }

        if (duration > 0) {this.dropModification(duration)}
    }
}

export default alertPanel;