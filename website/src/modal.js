import{OSM, XYZ} from 'ol/source';
import Map from 'ol/Map'
class LayerSwitcherModal {
    /**
     * @param {import('ol/Map').default} map - Instance de la carte OpenLayers
     * @param {Object} layersConfig - Configuration des couches disponibles
     * @param {string} modalId - ID de l'élément modal (par défaut: 'layer-modal')
     * @param {string} buttonId - ID du bouton d'ouverture (par défaut: 'layer-switcher-btn')
     */
    constructor(map, layersConfig = null, modalId = 'layer-modal', buttonId = 'layer-switcher-btn') {
        this.map = map;
        this.modalId = modalId;
        this.buttonId = buttonId;
        
        // Configuration des couches par défaut ou personnalisée
        this.layers = layersConfig || this.getDefaultLayers();
        
        // Initialisation des éléments DOM
        this.initializeElements();
        
        // Mise en place des écouteurs d'événements
        this.setupEventListeners();
    }
    
    /**
     * Retourne la configuration par défaut des couches
     * @returns {Object} Configuration des couches
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
     * Initialise les éléments DOM nécessaires
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
    
    /**
     * Configure tous les écouteurs d'événements
     */
    setupEventListeners() {
        // Ouvrir le modal
        this.layerSwitcherBtn?.addEventListener('click', () => this.openModal());

        
        // Fermer le modal avec le bouton de fermeture
        this.closeModalSpan?.addEventListener('click', () => this.closeModal());
        
        // Fermer le modal en cliquant à l'extérieur
        window.addEventListener('click', (event) => {
            if (event.target === this.layerModal) {
                this.closeModal();
            }
        });
        
        // Gestion du changement de couches
        this.setupLayerSwitching();
    }
    
    /**
     * Configure les écouteurs pour le changement de couches
     */
    setupLayerSwitching() {
        if (!this.layerOptions) return;
        
        this.layerOptions.forEach(option => {
            option.addEventListener('click', () => {
                const layerType = option.getAttribute('data-layer');
                this.switchLayer(layerType);
                
                // Mise à jour de l'état actif dans le modal
                this.updateActiveOption(option);
                
                // Fermer le modal
                this.closeModal();
            });
        });
    }
    
    /**
     * Change la source de la couche de base
     * @param {string} layerType - Type de couche à activer
     */
    switchLayer(layerType) {
        const newSource = this.layers[layerType];
        
        
        if (newSource) {
            // La couche de base est supposée être la première couche (index 0)
            const baseLayer = this.map.getLayers().item(0);
            baseLayer.setSource(newSource);
        } else {
            console.warn(`Couche "${layerType}" non trouvée dans la configuration`);
        }
    }
    
    /**
     * Met à jour l'option active dans le modal
     * @param {HTMLElement} activeOption - Option à activer
     */
    updateActiveOption(activeOption) {
        this.layerOptions.forEach(opt => opt.classList.remove('active'));
        activeOption.classList.add('active');
    }
    
    /**
     * Ouvre le modal
     */
    openModal() {
        if (this.layerModal) {
            this.layerModal.style.display = 'block';
        }
    }
    
    /**
     * Ferme le modal
     */
    closeModal() {
        if (this.layerModal) {
            this.layerModal.style.display = 'none';
        }
    }
    
    /**
     * Ajoute une nouvelle couche à la configuration
     * @param {string} key - Clé d'identification de la couche
     * @param {import('ol/source/Source').default} source - Source OpenLayers
     */
    addLayer(key, source) {
        this.layers[key] = source;
    }
    
    /**
     * Supprime une couche de la configuration
     * @param {string} key - Clé de la couche à supprimer
     */
    removeLayer(key) {
        delete this.layers[key];
    }
    
    /**
     * Nettoie les écouteurs d'événements (utile pour la destruction)
     */
    destroy() {
        // Cette méthode peut être étendue pour nettoyer tous les listeners
        console.log('LayerSwitcherModal détruit');
    }
}

// Export de la classe
export default LayerSwitcherModal;
