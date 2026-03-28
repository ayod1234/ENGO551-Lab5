let client;

function connect() {
    const host = document.getElementById('host').value;
    const port = document.getElementById('port').value;
    const status = document.getElementById('status');

    // Configuration for automatic reconnection
    const options = {
        reconnectPeriod: 5000, // Wait 5 seconds between pulse attempts
        connectTimeout: 30 * 1000, // 30 seconds timeout
    };

    status.className = "alert alert-warning mt-3";
    status.innerText = "Attempting to connect...";
    
    // Initialize connection with options
    client = mqtt.connect(`wss://${host}:${port}/mqtt`, options);

    // EVENT: Successful initial connection or successful reconnection
    client.on('connect', () => {
        status.className = "alert alert-success mt-3";
        status.innerText = "Connected to " + host;
        toggleInputs(true);
    });

    // EVENT: When the connection is lost
    client.on('offline', () => {
        status.className = "alert alert-danger mt-3";
        status.innerText = "Connection lost. Your device is offline.";
    });

    // EVENT: Fired when the library starts trying to reconnect
    client.on('reconnect', () => {
        status.className = "alert alert-info mt-3";
        status.innerText = "Disconnected. Retrying to connect...";
    });

    client.on('error', (err) => {
        status.className = "alert alert-danger mt-3";
        status.innerText = "Connection Error: " + err.message;
        console.error(err);
    });
}

function publishMessage() {
    // 1. Check if we are actually connected
    if (!client || !client.connected) {
        alert("You must connect to the broker first!");
        return;
    }

    // 2. Get values from the UI
    const topic = document.getElementById('pubTopic').value;
    const message = document.getElementById('pubMessage').value;

    if (!topic || !message) {
        alert("Please provide both a Topic and a Message.");
        return;
    }

    // 3. Publish to the broker
    client.publish(topic, message, { qos: 0, retain: false }, (error) => {
        if (error) {
            console.error("Publish error:", error);
            alert("Failed to publish message.");
        } else {
            console.log(`Message published to ${topic}`);
            // Optional: Clear the message box after sending
            document.getElementById('pubMessage').value = "";
        }
    });
}

function disconnect() {
    if (client) {
        // client.end() stops the auto-reconnect timer entirely
        client.end(false, () => {
            const status = document.getElementById('status');
            status.className = "alert alert-secondary mt-3";
            status.innerText = "Status: Disconnected by user";
            toggleInputs(false);
        });
    }
}


function shareStatus() {
    if (!client || !client.connected) {
        alert("Please connect to the broker first!");
        return;
    }

    const geoStatus = document.getElementById('geoStatus');
    geoStatus.innerText = "Locating...";

    // 1. Get GPS Position
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        // 2. Generate Random Temperature (e.g., between -10 and 30)
        const temp = (Math.random() * (30 - (-10)) + (-10)).toFixed(2);

        // 3. Create GeoJSON Message
        const geojsonMsg = {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [lon, lat] // Note: GeoJSON is [Longitude, Latitude]
            },
            properties: {
                name: "Ayooluwa Durojaiye",
                temperature: parseFloat(temp),
                unit: "Celsius",
                timestamp: new Date().toISOString()
            }
        };

        // 4. Define Topic (Pattern: course/name/my_temperature)
        // Ensure no spaces are used
        const topic = "engo551/ayooluwa_durojaiye/my_temperature";

        // 5. Publish
        client.publish(topic, JSON.stringify(geojsonMsg));
        
        geoStatus.innerText = `Sent: ${lat.toFixed(4)}, ${lon.toFixed(4)} @ ${temp}°C`;
        console.log("Published GeoJSON:", geojsonMsg);

    }, (error) => {
        geoStatus.innerText = "Error: " + error.message;
        alert("Unable to retrieve location. Ensure you allowed permissions.");
    });
}