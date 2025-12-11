// Layer Switcher Logic
const layerSwitcherBtn = document.getElementById('layer-switcher-btn');
const layerModal = document.getElementById('layer-modal');
const closeModalSpan = document.querySelector('.close-modal');
const layerOptions = document.querySelectorAll('.layer-option');

// Open modal
layerSwitcherBtn.addEventListener('click', () => {
    layerModal.style.display = 'block';
});

// Close modal
closeModalSpan.addEventListener('click', () => {
    layerModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    if (event.target == layerModal) {
        layerModal.style.display = 'none';
    }
});

// Layer Sources
const layers = {
    osm: new ol.source.OSM(),
    satellite: new ol.source.XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attributions: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }),
    terrain: new ol.source.XYZ({
        url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attributions: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)'
    })
};

// Switch Layer
layerOptions.forEach(option => {
    option.addEventListener('click', () => {
        const layerType = option.getAttribute('data-layer');
        const newSource = layers[layerType];
        
        if (newSource) {
            // Assuming the base layer is the first layer (index 0)
            const baseLayer = map.getLayers().item(0);
            baseLayer.setSource(newSource);
            
            // Update active state in modal
            layerOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            // Close modal
            layerModal.style.display = 'none';
        }
    });
});
