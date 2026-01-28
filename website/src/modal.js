import{OSM, XYZ} from 'ol/source';
import Map from 'ol/Map'
class LayerSwitcherModal {
    /**
     * @param {import('ol/Map').default} map
     * @param {Object} layersConfig
     * @param {string} modalId - default: 'layer-modal')
     * @param {string} buttonId - default: 'layer-switcher-btn')
     */
    constructor(map, layersConfig = null, modalId = 'layer-modal', buttonId = 'layer-switcher-btn') {
        this.map = map;
        this.modalId = modalId;
        this.buttonId = buttonId;
        
        // Passing a layer configuration or the default which is the used based maps
        this.layers = layersConfig || this.getDefaultLayers();
        

        this.initializeElements();
        

        this.setupEventListeners();
    }
    
    /**

     * @returns {Object}
     */
    getDefaultLayers() {
        return {
            osm: new OSM(),
            satellite: new XYZ({
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                attributions: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            }),
            terrain: new XYZ({
                url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
                attributions: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)'
            })
        };
    }
    
    /**
     * Initialise DOM elements
     */
    initializeElements() {
        this.layerSwitcherBtn = document.getElementById(this.buttonId);
        this.layerModal = document.getElementById(this.modalId);
        this.closeModalSpan = this.layerModal?.querySelector('.close-modal');
        this.layerOptions = this.layerModal?.querySelectorAll('.layer-option');
        
        if (!this.layerSwitcherBtn || !this.layerModal) {
            console.error('Éléments DOM manquants pour le LayerSwitcherModal');
        }
    }

    setupEventListeners() {

        this.layerSwitcherBtn?.addEventListener('click', () => this.openModal());

        this.closeModalSpan?.addEventListener('click', () => this.closeModal());
        
        // Closing modal by clicking outside of it
        window.addEventListener('click', (event) => {
            if (event.target === this.layerModal) {
                this.closeModal();
            }
        });

        this.setupLayerSwitching();
    }

    setupLayerSwitching() {
        if (!this.layerOptions) return;
        
        this.layerOptions.forEach(option => {
            option.addEventListener('click', () => {
                const layerType = option.getAttribute('data-layer');
                this.switchLayer(layerType);

                this.updateActiveOption(option);

                this.closeModal();
            });
        });
    }
    
    /**
     * @param {string} layerType
     */
    switchLayer(layerType) {
        const newSource = this.layers[layerType];
        
        
        if (newSource) {
            const baseLayer = this.map.getLayers().item(0);
            baseLayer.setSource(newSource);
        } else {
            console.warn(`Couche "${layerType}" non trouvée dans la configuration`);
        }
    }
    
    /**
     * @param {HTMLElement} activeOption
     */
    updateActiveOption(activeOption) {
        this.layerOptions.forEach(opt => opt.classList.remove('active'));
        activeOption.classList.add('active');
    }

    openModal() {
        if (this.layerModal) {
            this.layerModal.style.display = 'block';
        }
    }

    closeModal() {
        if (this.layerModal) {
            this.layerModal.style.display = 'none';
        }
    }
    
    /**
     *
     * @param {string} key
     * @param {import('ol/source/Source').default} source - Source OpenLayers
     */
    addLayer(key, source) {
        this.layers[key] = source;
    }
    
    /**
     *
     * @param {string} key
     */
    removeLayer(key) {
        delete this.layers[key];
    }

    destroy() {
        console.log('LayerSwitcherModal destroyed');
    }
}

// Export de la classe
export default LayerSwitcherModal;
