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
    const response = await fetch('/src/legend-content.html');
    const html = await response.text();
    legend.innerHTML = html;
  } catch (error) {
    console.error('Error loading legend content:', error);
    legend.innerHTML = '<div class="legend-header"><h4>Legend</h4></div><div class="legend-content">Error loading legend</div>';
  }
  
  // Add legend to map
  document.getElementById('map').appendChild(legend);
  
  // Create legend button to show/hide
  const legendButton = document.createElement('button');
  legendButton.id = 'legend-btn';
  legendButton.className = 'legend-btn';
  legendButton.innerHTML = `
    <svg width="40" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  `;
  legendButton.title = 'Show legend';
  
  document.getElementById('map').appendChild(legendButton);
  
  // Toggle legend visibility
  const toggleLegendVisibility = (show) => {
    legend.style.display = show ? 'block' : 'none';
    legendButton.classList.toggle('active', show);
  };
  
  legendButton.addEventListener('click', () => {
    toggleLegendVisibility(legend.style.display === 'none');
  });
  
  // Close button inside legend
  legend.querySelector('.legend-toggle').addEventListener('click', () => {
    toggleLegendVisibility(false);
  });
  
  // Show legend automatically when results are loaded
  map.on('change', () => {
    const resultsLayer = map.getLayers().getArray().find(layer => layer.get('name') === 'results');
    const hasResults = resultsLayer?.getSource()?.getFeatures()?.length > 0;
    
    if (hasResults && legend.style.display === 'none') {
      toggleLegendVisibility(true);
    }
  });
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
