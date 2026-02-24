import Overlay from 'ol/Overlay';

// Cache pour le template de la popup
let popupTemplate = null;

// Mapping pour l'affichage de la précision
const ACCURACY_LABELS = {
  'APPROXIMATE_LOCATION': 'Approximate location',
  'EXACT_LOCATION': 'Exact location',
  'COORDINATES': 'Coordinates',
  'COUNTRY': 'Country',
  'ADMINISTRATIVE_REGION': 'Administrative region'
};

/**
 * Formate les données d'intention (tableau ou chaîne)
 */
function formatIntention(intention) {
  if (!intention) return 'N/A';

  let data = intention;
  if (typeof intention === 'string' && intention.startsWith('[')) {
    try {
      data = JSON.parse(intention.replace(/'/g, '"'));
    } catch (e) {
      return intention.replace(/_/g, ' ');
    }
  }

  if (Array.isArray(data)) {
    return data
        .map(item => item.replace(/_/g, ' ').toLowerCase())
        .map(item => item.charAt(0).toUpperCase() + item.slice(1))
        .join(', ');
  }

  return data.replace(/_/g, ' ');
}

/**
 * Formate la taille de la transaction avec les unités appropriées
 */
function formatDealSize(dealSize) {
  if (!dealSize || dealSize === 'N/A') return 'N/A';
  if (dealSize === 0 || dealSize === '0.0') return 'Not specified';

  const size = typeof dealSize === 'number' ? dealSize : parseFloat(dealSize);
  return !isNaN(size) && size > 0 ? `${size.toLocaleString()} ha` : 'N/A';
}

/**
 * Charge le template HTML de la popup
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
 * Initialise l'overlay de la popup et gère les clics
 */
export function initializePopup(map) {
  const container = document.getElementById('popup');
  const content = document.getElementById('popup-content');
  const closer = document.getElementById('popup-closer');

  const overlay = new Overlay({
    element: container,
    autoPan: {
      animation: { duration: 250 },
    },
  });

  map.addOverlay(overlay);

  closer.onclick = function () {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
  };

  map.on('click', async function (evt) {

    const dealpopup = ['point', 'areas', 'buffer'];

    const feature = map.forEachFeatureAtPixel(evt.pixel, (feat, layer) => {
      if (layer && dealpopup.includes(layer.get('layerName'))) {
        return feat;
      }
    });

    if (!feature) {
      overlay.setPosition(undefined);
      return;
    }

    const properties = feature.getProperties();
    const dealId = properties.deal_id || properties.id;

    if (!dealId) return;

    const accuracy = properties.level_of_accuracy || 'N/A';
    const accuracyDisplay = ACCURACY_LABELS[accuracy] || accuracy;
    const intention = formatIntention(properties.intention);
    const dealSizeDisplay = formatDealSize(properties.deal_size);
    const facilityName = properties.facility_name || properties.name;

    const facilityNameSection = facilityName ? `
      <div class="popup-field">
        <div class="popup-field-label">Facility / Area name</div>
        <div class="popup-field-value" style="color: #fc941d;">${facilityName}</div>
      </div>
    ` : '';

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