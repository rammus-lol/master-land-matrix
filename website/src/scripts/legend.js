/**
 * Initialize and configure the map legend
 * @param {Map} map - The OpenLayers map instance
 */
export async function initializeLegend(map) {
  // Create legend container
  const legend = document.createElement('div');
  legend.id = 'map-legend';
  legend.className = 'map-legend';
  
  // Initially hide the legend
  legend.style.display = 'none';
  
  // Load legend content from HTML file
  try {
    const response = await fetch('/templates/legend-content.html');
    const html = await response.text();
    legend.innerHTML = html;
  } catch (error) {
    console.error('Error loading legend content:', error);
    legend.innerHTML = '<div class="legend-header"><h4>Legend</h4></div><div class="legend-content">Error loading legend</div>';
  }
  
  // Add legend to map
  const mapElement = document.getElementById('map');
  mapElement.appendChild(legend);
  
  // Create legend button to show/hide
  const legendButton = document.createElement('button');
  legendButton.id = 'legend-btn';
  legendButton.className = 'legend-btn';
  legendButton.innerHTML = `
    <img src="/legend.svg" alt="Legend" width="60%" height="60%">
  `;
  legendButton.title = 'Show legend';
  
  mapElement.appendChild(legendButton);
  
  // Toggle legend visibility
  const toggleLegendVisibility = (show) => {
    legend.style.display = show ? 'block' : 'none';
    legendButton.classList.toggle('active', show);
  };

  const LEGEND_LAYER_KEYS = new Set([
    'high_accuracy_location',
    'low_accuracy_location',
    'areas',
    'administrative_region'
  ]);

  const hasVisibleDataForLayer = (layerKey) => {
    const layer = map.getLayers().getArray().find((candidate) => candidate.get('layerName') === layerKey);
    if (!layer || !layer.getVisible()) {
      return false;
    }

    const source = layer.getSource?.();
    const features = source?.getFeatures?.();
    return Array.isArray(features) && features.length > 0;
  };

  const updateLegendItems = () => {
    const legendItems = legend.querySelectorAll('.legend-item[data-layer]');
    let visibleItems = 0;

    legendItems.forEach((item) => {
      const layerKey = item.getAttribute('data-layer');
      const isVisible = hasVisibleDataForLayer(layerKey);
      item.style.display = isVisible ? 'flex' : 'none';
      if (isVisible) {
        visibleItems += 1;
      }
    });

    const hasAnyLegendData = visibleItems > 0;
    const emptyState = legend.querySelector('.legend-empty-state');
    if (emptyState) {
      emptyState.style.display = hasAnyLegendData ? 'none' : 'block';
    }

    if (hasAnyLegendData && legend.style.display === 'none') {
      toggleLegendVisibility(true);
    }
  };

  const bindLegendRefreshToLayer = (layer) => {
    const layerName = layer.get?.('layerName');
    if (!LEGEND_LAYER_KEYS.has(layerName)) {
      return;
    }

    layer.on('change:visible', updateLegendItems);
    const source = layer.getSource?.();
    source?.on('addfeature', updateLegendItems);
    source?.on('removefeature', updateLegendItems);
    source?.on('clear', updateLegendItems);
    source?.on('change', updateLegendItems);
  };
  
  legendButton.addEventListener('click', () => {
    toggleLegendVisibility(legend.style.display === 'none');
  });
  
  // Close button inside legend
  const closeButton = legend.querySelector('.legend-toggle');
  closeButton?.addEventListener('click', () => {
    toggleLegendVisibility(false);
  });

  map.getLayers().getArray().forEach(bindLegendRefreshToLayer);
  map.getLayers().on('add', (event) => {
    bindLegendRefreshToLayer(event.element);
    updateLegendItems();
  });

  updateLegendItems();
}

/**
 * Show or hide the legend programmatically
 * @param {boolean} show - True to show, false to hide
 */
function setLegendVisibility(show) {
  const legend = document.getElementById('map-legend');
  const legendBtn = document.getElementById('legend-btn');
  
  if (legend) {
    legend.style.display = show ? 'block' : 'none';
    legendBtn?.classList.toggle('active', show);
  }
}

/**
 * Show the legend programmatically
 */
export function showLegend() {
  setLegendVisibility(true);
}

/**
 * Hide the legend programmatically
 */
export function hideLegend() {
  setLegendVisibility(false);
}
