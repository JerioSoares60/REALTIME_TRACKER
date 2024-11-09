let socket = io();

// Add a fallback position (e.g., city center)
// Initialize the map
// Initialize the map
const map = L.map("map").setView([51.505, -0.09], 13);

// Add the tile layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Object to store markers for each user
const markers = {};

// Debug: Log when socket connects
socket.on('connect', () => {
    console.log('My socket ID is:', socket.id);
});

// Listen for location updates from any user (including self)
socket.on('receive-location', (data) => {
    const { id, latitude, longitude } = data;
    
    // Debug logging
    console.log('Received location update for ID:', id);
    console.log('Current markers:', Object.keys(markers));
    console.log('Is this my ID?', id === socket.id);
    
    try {
        // Remove existing marker if it exists
        if (markers[id]) {
            map.removeLayer(markers[id]);
        }
        
        // Create new marker with a distinct color based on ID
        const markerColor = id === socket.id ? 'blue' : 'red';
        const markerIcon = L.divIcon({
            html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
            className: 'custom-marker'
        });
        
        // Create marker with custom icon and popup
        markers[id] = L.marker([latitude, longitude], {icon: markerIcon})
            .bindPopup(`User ID: ${id.slice(0,4)}...`)
            .addTo(map);
            
        // Open popup immediately
        markers[id].openPopup();
        
        // Debug logging
        console.log('Markers after update:', Object.keys(markers));
        
        // Fit bounds to show all markers
        const markerArray = Object.values(markers);
        if (markerArray.length > 0) {
            const bounds = L.latLngBounds(markerArray.map(m => m.getLatLng()));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
        
    } catch (error) {
        console.error('Error handling marker:', error);
    }
});

// Remove marker when user disconnects
socket.on('user-disconnected', (userId) => {
    console.log('User disconnected:', userId);
    if (markers[userId]) {
        map.removeLayer(markers[userId]);
        delete markers[userId];
        console.log('Marker removed. Remaining markers:', Object.keys(markers));
    }
});

// Get and send current user's location
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            console.log('Sending location for ID:', socket.id);
            socket.emit('send-location', { latitude, longitude });
        },
        (error) => {
            console.error('Geolocation error:', error);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
} else {
    console.error('Geolocation is not supported by this browser');
}