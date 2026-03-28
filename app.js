let client;

// Helper to lock/unlock UI based on connection state
function toggleInputs(isConnected) {
    document.getElementById('host').disabled = isConnected;
    document.getElementById('port').disabled = isConnected;
    document.getElementById('startBtn').disabled = isConnected;
    document.getElementById('endBtn').disabled = !isConnected;
}

function connect() {
    const host = document.getElementById('host').value;
    const port = document.getElementById('port').value;
    const status = document.getElementById('status');

    if (!host || !port) {
        alert("Please enter both host and port.");
        return;
    }

    const options = {
        reconnectPeriod: 5000,
        connectTimeout: 30 * 1000,
    };

    status.className = "alert alert-warning mt-3";
    status.innerText = "Attempting to connect...";
    
    // Using wss for GitHub Pages compatibility
    client = mqtt.connect(`wss://${host}:${port}/mqtt`, options);

    client.on('connect', () => {
        status.className = "alert alert-success mt-3";
        status.innerText = "Connected to " + host;
        toggleInputs(true);
    });

    client.on('offline', () => {
        status.className = "alert alert-danger mt-3";
        status.innerText = "Connection lost. Device offline.";
    });

    client.on('reconnect', () => {
        status.className = "alert alert-info mt-3";
        status.innerText = "Disconnected. Retrying...";
    });

    client.on('error', (err) => {
        status.className = "alert alert-danger mt-3";
        status.innerText = "Error: " + err.message;
        toggleInputs(false);
    });
}

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