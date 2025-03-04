mapboxgl.accessToken = 'pk.eyJ1IjoiZW1pbHlhbW9mZmF0IiwiYSI6ImNtNmI0d3puaTA0dG0yam84dzNiZTQ5NjIifQ.A1PSOyaJV6TF-lKcIFMHQA';

const map = new mapboxgl.Map({
    container: 'my-map', // ID of the HTML element for the map
    style: 'mapbox://styles/emilyamoffat/cm6zhee9000s201sbc2m0g0xc', // Custom map style
    center: [-79.398242, 43.662508], // Initial map center (UofT)
    zoom: 8.5 // Initial zoom level
});

// Note: I've integrated mapbox directions api and added in a pop-up event listener as my interactive pieces for this lab
// I'm trying to figure out the mapbox apis since we want to use them for our group project

// Define starting point (UofT)
const start = [-79.398242, 43.662508];

// Create a popup instance (but don't add it yet)
const popup = new mapboxgl.Popup({
    closeOnClick: false,
    className: 'custom-popup' // Custom class for styling
});

map.on('load', function () {
    map.addControl(new mapboxgl.NavigationControl()); // Add zoom controls

    // Add Bruce Trail data layer housed in mapbox
    map.addSource('trail-data', {
        'type': 'vector',
        'url': 'mapbox://emilyamoffat.1q52b0v5'
    });

    map.addLayer({
        'id': 'trails-line',
        'type': 'line',
        'source': 'trail-data',
        'paint': {
            'line-color': '#556b2f',
            'line-width': 2
        },
        'source-layer': 'Ontario_Trail__justbruce-22cquv'
    });

    // Initialize empty route source
    map.addSource('route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
    });

    map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#3887be',
            'line-width': 5,
            'line-opacity': 0.75
        }
    });

    // Initialize empty endpoint source
    map.addSource('end', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
    });

    map.addLayer({
        id: 'end',
        type: 'circle',
        source: 'end',
        paint: {
            'circle-radius': 10,
            'circle-color': '#f30'
        }
    });

    // Click event to select a destination
    map.on('click', (event) => {
        const coords = Object.values(event.lngLat);

        // Update the endpoint feature position
        if (map.getSource('end')) {
            map.getSource('end').setData({
                type: 'FeatureCollection',
                features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: coords } }]
            });
        }

        // Get a route from UofT to the clicked location
        getRoute(coords);
    });
});

// Function to fetch and display a driving route
async function getRoute(end) {
    try {
        const query = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
            { method: 'GET' }
        );

        const json = await query.json();

        if (!json.routes || json.routes.length === 0) return;

        const data = json.routes[0];
        const route = data.geometry.coordinates;

        const geojson = {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: route }
        };

        if (map.getSource('route')) {
            map.getSource('route').setData(geojson);
        }

        // Show trip duration for getting to chosen destination
        const tripTime = Math.floor(data.duration / 60); 
        popup
            .setLngLat(end)
            .setHTML(`<strong>Trip Duration: ${tripTime} min 🚗</strong>`)
            .addTo(map);

    } catch (error) {
        console.error("Error fetching route:", error);
    }
}
