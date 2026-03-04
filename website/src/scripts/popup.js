import Overlay from 'ol/Overlay';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import { resultStyle } from './vectorlayertools.js';

// templates cache
let popupTemplate = null;
let popupRegionTemplate = null;

// accuracy mapping
const ACCURACY_LABELS = {
  'APPROXIMATE_LOCATION': 'Approximate location',
  'EXACT_LOCATION': 'Exact location',
  'COORDINATES': 'Coordinates',
  'COUNTRY': 'Country',
  'ADMINISTRATIVE_REGION': 'Administrative region'
};

function getSelectionStyle(layerType, geometryType) {
  const baseStyle = resultStyle(layerType);

  if (geometryType === 'Point' || geometryType === 'MultiPoint') {
    const pointColor = layerType === 'high_accuracy_location' ? '#fc941d' : '#43b6b5';
    return [
      baseStyle,
      new Style({
        image: new CircleStyle({
          radius: 11,
          fill: new Fill({ color: 'rgba(255,255,255,0.12)' }),
          stroke: new Stroke({ color: pointColor, width: 4 })
        })
      })
    ];
  }

  return [
    baseStyle,
    new Style({
      stroke: new Stroke({ color: '#ffffff', width: 4 }),
      fill: new Fill({ color: 'rgba(255,255,255,0.10)' })
    })
  ];
}

/**
 * Take current_intention_of_investment value  normally it's an Array (but Django magic can happen)
 * and format it to a readable string.
 * @param {string|Array} intention the data fetched from backend for the field current_intention_of_investment
 * @returns {string}
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
 * Format deals size with appropriate unites
 * @param {number} dealSize the deal_size value of the feature
 */
function formatDealSize(dealSize) {
  if (!dealSize || dealSize === 'N/A') return 'Not specified';
  if (dealSize === 0 || dealSize === '0.0') return 'Not specified';

  const size = typeof dealSize === 'number' ? dealSize : parseFloat(dealSize);
  return !isNaN(size) && size > 0 ? `${size.toLocaleString()} ha` : 'N/A';
}

/**
 * Load deal template for deals
 */
async function loadPopupTemplate() {
  if (!popupTemplate) {
    try {
      const response = await fetch('/templates/popup-content.html');
      popupTemplate = await response.text();
    } catch (error) {
      console.error('Error loading popup template:', error);
      popupTemplate = '<div class="popup-deal-title">Deal #{{dealId}}</div><p>Error loading template</p>';
    }
  }
  return popupTemplate;
}

/**
 * Load HTML template for administrative regions
 */
async function loadPopupRegionTemplate() {
  if (!popupRegionTemplate) {
    try {
      const response = await fetch('/templates/popup-content-region.html');
      popupRegionTemplate = await response.text();
    } catch (error) {
      console.error('Error loading region popup template:', error);
      popupRegionTemplate = '<div class="popup-deal-title">Region</div><p>Error loading template</p>';
    }
  }
  return popupRegionTemplate;
}

/**
 * Overlay  and click event listener initialization
 */
export function initializePopup(map) {
  const container = document.getElementById('popup');
  const content = document.getElementById('popup-content');
  const closer = document.getElementById('popup-closer');
  let selectedFeature = null;

  function clearSelectedFeature() {
    if (selectedFeature) {
      selectedFeature.setStyle(undefined);
      selectedFeature = null;
    }
  }

  const overlay = new Overlay({
    element: container,
    autoPan: {
      animation: { duration: 250 },
    },
  });

  map.addOverlay(overlay);

  closer.onclick = function () {
    overlay.setPosition(undefined);
    clearSelectedFeature();
    closer.blur();
    return false;
  };

  map.on('click', async function (evt) {

    const dealpopup = ["low_accuracy_location",
        "high_accuracy_location",
        "areas"];
    const regionpopup = ['administrative_region'];

    // 1. search for deals or areas
    let feature = map.forEachFeatureAtPixel(evt.pixel, (feat, layer) => {
      const layerName = layer ? layer.get('layerName') : null;
      if (layer && dealpopup.includes(layerName)) {
        return { feature: feat, layerType: layerName };
      }
    });

    // 2. search for administrative region
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
      clearSelectedFeature();
      return;
    }

    const { feature: clickedFeature, layerType } = feature;
    clearSelectedFeature();
    const geometryType = clickedFeature.getGeometry()?.getType();
    clickedFeature.setStyle(getSelectionStyle(layerType, geometryType));
    selectedFeature = clickedFeature;
    const properties = clickedFeature.getProperties();

    // Popup for administrative regions
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

    // Manage popup for deals
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