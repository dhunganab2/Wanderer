// Interactive World Map with Leaflet.js
// Real OpenStreetMap tiles - No API key required

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing interactive world map...');
    
    // Check if map container exists
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Map container not found! Make sure you have a div with id="map"');
        return;
    }

    // Initialize the map centered on New York City
    const map = L.map('map').setView([40.7128, -74.0060], 13);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 1
    }).addTo(map);

    // Add a marker at the center with popup
    const centerMarker = L.marker([40.7128, -74.0060])
        .addTo(map)
        .bindPopup('<h3>Welcome to the Map!</h3><p>This is New York City. You can zoom, pan, and explore the world!</p>')
        .openPopup();

    // Add some additional markers for demonstration
    const additionalMarkers = [
        {
            coords: [51.5074, -0.1278],
            title: 'London, UK',
            description: 'Capital of England and the United Kingdom'
        },
        {
            coords: [35.6762, 139.6503],
            title: 'Tokyo, Japan',
            description: 'Capital of Japan and one of the world\'s largest cities'
        },
        {
            coords: [-33.8688, 151.2093],
            title: 'Sydney, Australia',
            description: 'Largest city in Australia'
        },
        {
            coords: [48.8566, 2.3522],
            title: 'Paris, France',
            description: 'Capital of France, known as the City of Light'
        }
    ];

    // Add additional markers
    additionalMarkers.forEach(function(markerData) {
        L.marker(markerData.coords)
            .addTo(map)
            .bindPopup(`<h3>${markerData.title}</h3><p>${markerData.description}</p>`);
    });

    // Handle window resize for responsiveness
    window.addEventListener('resize', function() {
        // Small delay to ensure the resize is complete
        setTimeout(function() {
            map.invalidateSize();
        }, 100);
    });

    // Add click event to map
    map.on('click', function(e) {
        const lat = e.latlng.lat.toFixed(4);
        const lng = e.latlng.lng.toFixed(4);
        
        // Create a temporary marker at click location
        const clickMarker = L.marker([lat, lng])
            .addTo(map)
            .bindPopup(`<h3>Clicked Location</h3><p>Latitude: ${lat}<br>Longitude: ${lng}</p>`)
            .openPopup();
        
        // Remove the temporary marker after 3 seconds
        setTimeout(function() {
            map.removeLayer(clickMarker);
        }, 3000);
        
        console.log(`Map clicked at: ${lat}, ${lng}`);
    });

    // Add keyboard shortcuts for better UX
    document.addEventListener('keydown', function(e) {
        switch(e.key) {
            case '+':
            case '=':
                map.zoomIn();
                break;
            case '-':
                map.zoomOut();
                break;
            case '0':
                map.setView([40.7128, -74.0060], 13);
                break;
        }
    });

    // Add loading complete message
    map.whenReady(function() {
        console.log('Map is ready!');
        
        // Add a success message to the console
        console.log('✅ Interactive world map loaded successfully!');
        console.log('🗺️  Features:');
        console.log('   - Real OpenStreetMap tiles');
        console.log('   - Zoom and pan functionality');
        console.log('   - Click to add temporary markers');
        console.log('   - Keyboard shortcuts: +, -, 0');
        console.log('   - Mobile-friendly responsive design');
    });

    // Error handling for map loading
    map.on('error', function(e) {
        console.error('Map error:', e);
    });

    // Add some custom styling to markers
    const customIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="background-color: #ff6b6b; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    // Add a custom styled marker
    L.marker([40.7589, -73.9851], { icon: customIcon })
        .addTo(map)
        .bindPopup('<h3>Times Square</h3><p>Custom styled marker in New York!</p>');

    console.log('Map initialization complete!');
});

// Add some utility functions
function addMarkerToMap(lat, lng, title, description) {
    if (typeof map !== 'undefined') {
        L.marker([lat, lng])
            .addTo(map)
            .bindPopup(`<h3>${title}</h3><p>${description}</p>`);
    }
}

function centerMapOnLocation(lat, lng, zoom = 13) {
    if (typeof map !== 'undefined') {
        map.setView([lat, lng], zoom);
    }
}

// Export functions for potential external use
window.MapUtils = {
    addMarker: addMarkerToMap,
    centerOn: centerMapOnLocation
};
