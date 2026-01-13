import Overlay from 'ol/Overlay';

// Cache for popup template
let popupTemplate = null;

// Mapping for accuracy display
const ACCURACY_LABELS = {
  'APPROXIMATE_LOCATION': 'Approximate location',
  'EXACT_LOCATION': 'Exact location',
  'COORDINATES': 'Coordinates',
  'COUNTRY': 'Country',
  'ADMINISTRATIVE_REGION': 'Administrative region'
};

/**
 * Format intention data (array or string)
 */
function formatIntention(intention) {
  if (!intention) return 'N/A';
  
  // Parse if it's a stringified array
  let data = intention;
  if (typeof intention === 'string' && intention.startsWith('[')) {
    try {
      data = JSON.parse(intention.replace(/'/g, '"'));
    } catch (e) {
      return intention.replace(/_/g, ' ');
    }
  }
  
  // Format array items
  if (Array.isArray(data)) {
    return data
      .map(item => item.replace(/_/g, ' ').toLowerCase())
      .map(item => item.charAt(0).toUpperCase() + item.slice(1))
      .join(', ');
  }
  
  return data.replace(/_/g, ' ');
}

/**
 * Format deal size with proper units
 */
function formatDealSize(dealSize) {
  if (!dealSize || dealSize === 'N/A') return 'N/A';
  if (dealSize === 0 || dealSize === '0.0') return 'Not specified';
  
  const size = typeof dealSize === 'number' ? dealSize : parseFloat(dealSize);
  return !isNaN(size) && size > 0 ? `${size.toLocaleString()} ha` : 'N/A';
}

/**
 * Load popup template from HTML file
 */
async function loadPopupTemplate() {
  if (!popupTemplate) {
    try {
      const response = await fetch('/src/popup-content.html');
      popupTemplate = await response.text();
    } catch (error) {
      console.error('Error loading popup template:', error);
      popupTemplate = '<div class="popup-deal-title">Deal #{{dealId}}</div><p>Error loading template</p>';
    }
  }
  return popupTemplate;
}

/**
 * Initialize and configure the popup overlay for displaying deal information
 * @param {Map} map - The OpenLayers map instance
 * @returns {Overlay} The configured overlay instance
 */
export function initializePopup(map) {
  // Setup popup overlay
  const container = document.getElementById('popup');
  const content = document.getElementById('popup-content');
  const closer = document.getElementById('popup-closer');

  const overlay = new Overlay({
    element: container,
    autoPan: {
      animation: {
        duration: 250,
      },
    },
  });

  map.addOverlay(overlay);

  // Close popup when clicking the X
  closer.onclick = function () {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
  };

  // Add click handler to display popup on feature click
  map.on('click', async function (evt) {
    const feature = map.forEachFeatureAtPixel(evt.pixel, f => f);

    if (!feature) {
      overlay.setPosition(undefined);
      return;
    }

    const properties = feature.getProperties();
    const dealId = properties.deal_id || properties.id;
    
    // Only show popup for result features (those with deal data)
    if (!dealId) return;

    // Extract and format properties
    const accuracy = properties.level_of_accuracy || 'N/A';
    const accuracyDisplay = ACCURACY_LABELS[accuracy] || accuracy;
    const intention = formatIntention(properties.intention);
    const dealSizeDisplay = formatDealSize(properties.deal_size);
    const facilityName = properties.facility_name || properties.name;
    
    // Build facility name section if it exists
    const facilityNameSection = facilityName ? `
      <div class="popup-field">
        <div class="popup-field-label">Facility / Area name</div>
        <div class="popup-field-value" style="color: #fc941d;">${facilityName}</div>
      </div>
    ` : '';
    
    // Load template and populate content
    const template = await loadPopupTemplate();
    content.innerHTML = template
      .replace(/{{dealId}}/g, dealId)
      .replace(/{{accuracyDisplay}}/g, accuracyDisplay)
      .replace(/{{intention}}/g, intention)
      .replace(/{{dealSizeDisplay}}/g, dealSizeDisplay)
      .replace(/{{facilityNameSection}}/g, facilityNameSection);
    
    overlay.setPosition(evt.coordinate);
  });

  return overlay;
}
