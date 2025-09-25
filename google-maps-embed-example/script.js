// Interactive Google Maps Embed API Implementation
// Real-world map data with iframe embedding

// ⚠️ IMPORTANT: Replace 'YOUR_API_KEY_HERE' with your actual Google Maps API key
const GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY_HERE';

// Default location (New York City)
let currentLocation = 'New+York,NY';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Google Maps Embed API...');
    
    // Check if API key is set
    if (GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE') {
        showError('Please replace YOUR_API_KEY_HERE with your actual Google Maps API key in script.js');
        return;
    }
    
    // Initialize the map
    initializeMap();
    setupEventListeners();
    
    console.log('✅ Google Maps Embed API initialized successfully!');
});

/**
 * Initialize the Google Maps iframe
 */
function initializeMap() {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) {
        console.error('Map container not found!');
        return;
    }
    
    // Clear any existing content
    mapContainer.innerHTML = '';
    
    // Create the iframe with Google Maps Embed API
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${currentLocation}`;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.style.border = '0';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.title = `Google Maps - ${currentLocation.replace(/\+/g, ' ')}`;
    
    // Add error handling for iframe
    iframe.onerror = function() {
        showError('Failed to load Google Maps. Please check your API key and internet connection.');
    };
    
    iframe.onload = function() {
        console.log('Google Maps iframe loaded successfully');
        hideLoading();
    };
    
    // Add loading state
    showLoading();
    
    // Append iframe to container
    mapContainer.appendChild(iframe);
}

/**
 * Setup event listeners for interactive features
 */
function setupEventListeners() {
    // Location change button
    const changeLocationBtn = document.getElementById('change-location');
    if (changeLocationBtn) {
        changeLocationBtn.addEventListener('click', function() {
            const locations = [
                'New+York,NY',
                'London,UK', 
                'Tokyo,Japan',
                'Paris,France',
                'Sydney,Australia',
                'San+Francisco,CA'
            ];
            
            const randomLocation = locations[Math.floor(Math.random() * locations.length)];
            changeMapLocation(randomLocation);
        });
    }
    
    // Location select dropdown
    const locationSelect = document.getElementById('location-select');
    if (locationSelect) {
        locationSelect.addEventListener('change', function() {
            const selectedLocation = this.value;
            changeMapLocation(selectedLocation);
        });
    }
    
    // Current location button
    const currentLocationBtn = document.getElementById('current-location');
    if (currentLocationBtn) {
        currentLocationBtn.addEventListener('click', function() {
            getCurrentLocation();
        });
    }
    
    // Handle window resize for responsiveness
    window.addEventListener('resize', function() {
        // Iframe automatically adjusts, but we can add custom logic here if needed
        console.log('Window resized - map should adjust automatically');
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        switch(e.key) {
            case '1':
                changeMapLocation('New+York,NY');
                break;
            case '2':
                changeMapLocation('London,UK');
                break;
            case '3':
                changeMapLocation('Tokyo,Japan');
                break;
            case '4':
                changeMapLocation('Paris,France');
                break;
            case '5':
                changeMapLocation('Sydney,Australia');
                break;
            case '6':
                changeMapLocation('San+Francisco,CA');
                break;
        }
    });
}

/**
 * Change the map location
 * @param {string} location - Location query string (e.g., 'New+York,NY')
 */
function changeMapLocation(location) {
    console.log(`Changing map location to: ${location}`);
    currentLocation = location;
    
    // Update the select dropdown
    const locationSelect = document.getElementById('location-select');
    if (locationSelect) {
        locationSelect.value = location;
    }
    
    // Reinitialize the map with new location
    initializeMap();
}

/**
 * Get user's current location using Geolocation API
 */
function getCurrentLocation() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by this browser.');
        return;
    }
    
    console.log('Getting current location...');
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            console.log(`Current location: ${lat}, ${lng}`);
            
            // Use coordinates for the map
            const mapContainer = document.getElementById('map-container');
            if (mapContainer) {
                mapContainer.innerHTML = '';
                
                const iframe = document.createElement('iframe');
                iframe.src = `https://www.google.com/maps/embed/v1/view?key=${GOOGLE_MAPS_API_KEY}&center=${lat},${lng}&zoom=15`;
                iframe.width = '100%';
                iframe.height = '100%';
                iframe.style.border = '0';
                iframe.allowFullscreen = true;
                iframe.loading = 'lazy';
                iframe.referrerPolicy = 'no-referrer-when-downgrade';
                iframe.title = `Google Maps - Your Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
                
                mapContainer.appendChild(iframe);
            }
        },
        function(error) {
            console.error('Geolocation error:', error);
            let errorMessage = 'Unable to get your location. ';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'Please allow location access.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'Location information is unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'Location request timed out.';
                    break;
                default:
                    errorMessage += 'An unknown error occurred.';
                    break;
            }
            
            showError(errorMessage);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}

/**
 * Show loading state
 */
function showLoading() {
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.textContent = 'Loading map...';
        mapContainer.appendChild(loading);
    }
}

/**
 * Hide loading state
 */
function hideLoading() {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.remove();
    }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    console.error('Map Error:', message);
    
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
        mapContainer.innerHTML = `
            <div class="error">
                <h3>⚠️ Map Error</h3>
                <p>${message}</p>
                <p><strong>Common solutions:</strong></p>
                <ul style="text-align: left; margin: 1rem 0;">
                    <li>Check your Google Maps API key</li>
                    <li>Ensure Maps Embed API is enabled</li>
                    <li>Verify your internet connection</li>
                    <li>Check browser console for detailed errors</li>
                </ul>
            </div>
        `;
    }
}

/**
 * Utility function to add custom markers (requires different API approach)
 * Note: Embed API doesn't support custom markers directly
 * For custom markers, you'd need to use the JavaScript API instead
 */
function addCustomMarker(lat, lng, title) {
    console.log(`Custom marker requested at ${lat}, ${lng}: ${title}`);
    console.log('Note: Embed API doesn\'t support custom markers. Use JavaScript API for advanced features.');
}

// Export functions for potential external use
window.MapUtils = {
    changeLocation: changeMapLocation,
    getCurrentLocation: getCurrentLocation,
    addMarker: addCustomMarker
};

// Add some helpful console messages
console.log('🗺️  Google Maps Embed API loaded!');
console.log('📋 Available keyboard shortcuts:');
console.log('   1-6: Quick location changes');
console.log('🔧 Available functions:');
console.log('   MapUtils.changeLocation(location)');
console.log('   MapUtils.getCurrentLocation()');
console.log('   MapUtils.addMarker(lat, lng, title)');
