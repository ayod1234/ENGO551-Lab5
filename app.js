let client;
let map;
let marker;

// Initialize Map
function initMap() {
    map = L.map('map').setView([51.0447, -114.0719], 13); // Default to Calgary
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
}

// Call this once when the page loads
window.onload = initMap;

function getMarkerColor(temp) {
    if (temp >= -40 && temp < 10) return "blue";
    if (temp >= 10 && temp < 30) return "green";
    if (temp >= 30 && temp <= 60) return "red";
    return "black"; // Default
}

function connect() {
    const host = document.getElementById('host').value;
    const port = document.getElementById('port').value;
    const status = document.getElementById('status');

    client = mqtt.connect(`wss://${host}:${port}/mqtt`, { reconnectPeriod: 5000 });

    client.on('connect', () => {
        status.className = "alert alert-success mt-3";
        status.innerText = "Connected to " + host;
        toggleInputs(true);
        
        // SUBSCRIBE to your temperature topic to hear your own updates
        client.subscribe("engo551/ayooluwa_durojaiye/my_temperature");
    });

    // Handle Incoming Messages
    client.on('message', (topic, message) => {
        if (topic === "engo551/ayooluwa_durojaiye/my_temperature") {
            const data = JSON.parse(message.toString());
            const [lon, lat] = data.geometry.coordinates;
            const temp = data.properties.temperature;

            updateMapMarker(lat, lon, temp);
        }
    });

    // ... (rest of your existing event listeners: offline, reconnect, error)
}

function updateMapMarker(lat, lon, temp) {
    const color = getMarkerColor(temp);
    
    // Create a custom colored icon using inline SVG
    const coloredIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style='background-color:${color}; width:20px; height:20px; border-radius:50%; border:2px solid white;'></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    if (marker) {
        marker.setLatLng([lat, lon]).setIcon(coloredIcon);
    } else {
        marker = L.marker([lat, lon], { icon: coloredIcon }).addTo(map);
    }

    // Update Popup content
    marker.bindPopup(`<b>Ayooluwa Durojaiye</b><br>Temperature: ${temp}°C`).openPopup();
    map.setView([lat, lon], 15);
}

// ... (keep your existing disconnect, publishMessage, and shareStatus functions)

function disconnect() {
    if (client) {
        client.end(false, () => {
            const status = document.getElementById('status');
            status.className = "alert alert-secondary mt-3";
            status.innerText = "Status: Disconnected by user";
            toggleInputs(false);
        });
    }
}

function publishMessage() {
    if (!client || !client.connected) {
        alert("Connect to broker first!");
        return;
    }

    const topic = document.getElementById('pubTopic').value;
    const message = document.getElementById('pubMessage').value;

    if (!topic || !message) {
        alert("Fill in both topic and message.");
        return;
    }

    client.publish(topic, message);
}

function shareStatus() {
    if (!client || !client.connected) {
        alert("Connect to broker first!");
        return;
    }

    const geoStatus = document.getElementById('geoStatus');
    geoStatus.innerText = "Locating...";

    navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const temp = (Math.random() * (30 - (-10)) + (-10)).toFixed(2);

        const geojsonMsg = {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [lon, lat] 
            },
            properties: {
                name: "Ayooluwa Durojaiye",
                temperature: parseFloat(temp),
                unit: "Celsius",
                timestamp: new Date().toISOString()
            }
        };

        const topic = "engo551/ayooluwa_durojaiye/my_temperature";
        client.publish(topic, JSON.stringify(geojsonMsg));
        
        geoStatus.innerText = `Sent: ${lat.toFixed(4)}, ${lon.toFixed(4)} @ ${temp}°C`;
    }, (error) => {
        alert("Geolocation failed: " + error.message);
    });
}