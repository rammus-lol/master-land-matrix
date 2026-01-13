import Overlay from 'ol/Overlay';

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
  map.on('click', function (evt) {
    const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
      return feature;
    });

    if (feature) {
      const properties = feature.getProperties();
      
      // Only show popup for result features (those with deal data)
      if (properties.deal_id || properties.id) {
        const coordinate = evt.coordinate;
        
        // Build popup content
        const dealId = properties.deal_id || properties.id || 'N/A';
        const accuracy = properties.level_of_accuracy || 'N/A';
        
        // Handle intention - can be an array or stringified array
        let intention = 'N/A';
        if (properties.intention) {
          let intentionData = properties.intention;
          
          // If it's a string that looks like an array, parse it
          if (typeof intentionData === 'string' && intentionData.startsWith('[')) {
            try {
              intentionData = JSON.parse(intentionData.replace(/'/g, '"'));
            } catch (e) {
              console.log('Could not parse intention:', intentionData);
            }
          }
          
          // Format the intention
          if (Array.isArray(intentionData)) {
            intention = intentionData
              .map(item => item.replace(/_/g, ' ').toLowerCase())
              .map(item => item.charAt(0).toUpperCase() + item.slice(1))
              .join(', ');
          } else {
            intention = intentionData.replace(/_/g, ' ');
          }
        }
        
        const dealSize = properties.deal_size || 'N/A';
        const facilityName = properties.facility_name || properties.name || null;
        
        // Format accuracy level to be more readable
        let accuracyDisplay = accuracy;
        if (accuracy === 'APPROXIMATE_LOCATION') {
          accuracyDisplay = 'Approximate location';
        } else if (accuracy === 'EXACT_LOCATION') {
          accuracyDisplay = 'Exact location';
        } else if (accuracy === 'COORDINATES') {
          accuracyDisplay = 'Coordinates';
        } else if (accuracy === 'COUNTRY') {
          accuracyDisplay = 'Country';
        }
        // ADMINISTRATIVE_REGION
        else if (accuracy === 'ADMINISTRATIVE_REGION') {
          accuracyDisplay = 'Administrative region';
        }
        
        // Format deal size
        let dealSizeDisplay = dealSize;
        if (typeof dealSize === 'number' && dealSize > 0) {
          dealSizeDisplay = `${dealSize.toLocaleString()} ha`;
        } else if (dealSize === 0 || dealSize === '0.0') {
          dealSizeDisplay = 'Not specified';
        } else if (dealSize !== 'N/A') {
          dealSizeDisplay = `${dealSize} ha`;
        }
        
        content.innerHTML = `
          <div class="popup-deal-title">Deal #${dealId}</div>
          
          <div class="popup-field">
            <div class="popup-field-label">Spatial accuracy level</div>
            <div class="popup-field-value">${accuracyDisplay}</div>
          </div>
          
          <div class="popup-field">
            <div class="popup-field-label">Current intention of investment</div>
            <div class="popup-field-value">
              ${intention}
            </div>
          </div>
          
          <div class="popup-field">
            <div class="popup-field-label">Deal size</div>
            <div class="popup-field-value">${dealSizeDisplay}</div>
          </div>
          
          ${facilityName ? `
          <div class="popup-field">
            <div class="popup-field-label">Facility / Area name</div>
            <div class="popup-field-value" style="color: #fc941d;">${facilityName}</div>
          </div>
          ` : ''}
          
          <button class="popup-more-btn" onclick="window.open('https://landmatrix.org/deal/${dealId}/locations/', '_blank')">More details</button>
        `;
        
        overlay.setPosition(coordinate);
      }
    } else {
      // Close popup if clicking on empty area
      overlay.setPosition(undefined);
    }
  });

  return overlay;
}
