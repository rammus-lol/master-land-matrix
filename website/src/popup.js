import Overlay from 'ol/Overlay';

// Cache pour les templates de la popup
let popupTemplate = null;
let popupRegionTemplate = null;

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
  if (!dealSize || dealSize === 'N/A') return 'Not specified';
  if (dealSize === 0 || dealSize === '0.0') return 'Not specified';

  const size = typeof dealSize === 'number' ? dealSize : parseFloat(dealSize);
  return !isNaN(size) && size > 0 ? `${size.toLocaleString()} ha` : 'N/A';
}

/**
 * Charge le template HTML de la popup pour les deals
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
 * Charge le template HTML de la popup pour les régions
 */
async function loadPopupRegionTemplate() {
  if (!popupRegionTemplate) {
    try {
      const response = await fetch('/src/popup-content-region.html');
      popupRegionTemplate = await response.text();
    } catch (error) {
      console.error('Error loading region popup template:', error);
      popupRegionTemplate = '<div class="popup-deal-title">Region</div><p>Error loading template</p>';
    }
  }
  return popupRegionTemplate;
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
    const regionpopup = ['administrative_region'];

    // Priorité 1 : Rechercher d'abord les deals (points, polygones)
    let feature = map.forEachFeatureAtPixel(evt.pixel, (feat, layer) => {
      const layerName = layer ? layer.get('layerName') : null;
      if (layer && dealpopup.includes(layerName)) {
        return { feature: feat, layerType: layerName };
      }
    });

    // Priorité 2 : Si aucun deal trouvé, chercher les régions
    if (!feature) {
      feature = map.forEachFeatureAtPixel(evt.pixel, (feat, layer) => {
        const layerName = layer ? layer.get('layerName') : null;
        if (layer && regionpopup.includes(layerName)) {
          return { feature: feat, layerType: layerName };
        }
      });
    }

    if (!feature) {
      overlay.setPosition(undefined);
      return;
    }

    const { feature: selectedFeature, layerType } = feature;
    const properties = selectedFeature.getProperties();

    // Gérer les popups pour les régions administratives
    if (regionpopup.includes(layerType)) {
      const regionName = properties.admin || 'Not specified';
      const isoCode = properties.iso_3166_2 || 'Not specified';
      const name = properties.name || 'Not specified';
      const nameEn = properties.name_en || 'Not specified';
      const type = properties.type || 'Not specified';
      const typeEn = properties.type_en || 'Not specified';

      const template = await loadPopupRegionTemplate();
      content.innerHTML = template
          .replace(/{{regionName}}/g, regionName)
          .replace(/{{isoCode}}/g, isoCode)
          .replace(/{{name}}/g, name)
          .replace(/{{nameEn}}/g, nameEn)
          .replace(/{{type}}/g, type)
          .replace(/{{typeEn}}/g, typeEn);

      overlay.setPosition(evt.coordinate);
      return;
    }

    // Gérer les popups pour les deals (comportement existant)
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