class alertPanel {
    static instances = [];
    constructor(modification, message, htmlElement = 'top-center', duration = 0) {
        this.modification = modification;
        this.message = message;
        this.pageComponent = document.getElementById(htmlElement);
        this.originalContent = this.pageComponent.innerText;
        this.duration = duration;
        this.isActive = false;

        alertPanel.instances.push(this);
    }

    Alerting() {
        this.pageComponent.innerText = this.message;
        for (const [key, value] of Object.entries(this.modification)) {
            this.pageComponent.style.setProperty(key, value);

        }
        if (this.duration > 0) {this.dropModification(this.duration)}
    }

    dropModification(duration) {
        if (duration > 0) {
            setTimeout(() => {
                this.pageComponent.innerText = this.originalContent;
                for (const key of Object.keys(this.modification)) {
                    this.pageComponent.style.removeProperty(key);
                }
            }, this.duration * 1000);
        } else {
            this.pageComponent.innerText = this.originalContent;
            for (const key of Object.keys(this.modification)) {
                this.pageComponent.style.removeProperty(key);
            }
        }
        this.isActive = false;
    }
    static resetAll() {
        alertPanel.instances.forEach(instance => {
            if (instance.isActive) {
                instance.dropModification(0);
            }
        });
    }
    }

export default alertPanel;