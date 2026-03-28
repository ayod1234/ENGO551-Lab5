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