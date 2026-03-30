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

    client.on('message', (topic, message) => {
        if (topic === "engo551/ayooluwa_durojaiye/my_temperature") {
            try {
                const data = JSON.parse(message.toString());
                const [lon, lat] = data.geometry.coordinates;
                const temp = data.properties.temperature;

                // Update the UI
                updateMapMarker(lat, lon, temp);
                
                console.log("Remote update received from MQTTX!");
            } catch (e) {
                console.error("Received message was not valid JSON", e);
            }
        }
    });
    client.on('reconnect', () => {
    status.className = "alert alert-warning mt-3";
    status.innerText = "Attempting to reconnect...";
    });

    client.on('offline', () => {
        status.className = "alert alert-danger mt-3";
        status.innerText = "Status: Offline / Connection Lost";
    });

    client.on('error', (err) => {
        console.error("Connection error: ", err);
        status.className = "alert alert-danger mt-3";
        status.innerText = "Error: " + err.message;
    });
}



function updateMapMarker(lat, lon, temp) {
    const color = getMarkerColor(temp);
    
    // Custom Icon Logic
    const coloredIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style='background-color:${color}; width:18px; height:18px; border-radius:50%; border:2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);'></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
    });

    if (!marker) {
        marker = L.marker([lat, lon], { icon: coloredIcon }).addTo(map);
    } else {
        marker.setLatLng([lat, lon]).setIcon(coloredIcon);
    }

    // Set Popup and Pan Map
    marker.bindPopup(`<b>engo551/ayooluwa_durojaiye/my_temperature</b><br>Live Temp: ${temp}°C`).openPopup();
    map.flyTo([lat, lon], 12); // 'flyTo' creates a smooth animation for the demo
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


function toggleInputs(isConnected) {
    document.getElementById('host').disabled = isConnected;
    document.getElementById('port').disabled = isConnected;
    document.getElementById('startBtn').disabled = isConnected;
    document.getElementById('endBtn').disabled = !isConnected;
}