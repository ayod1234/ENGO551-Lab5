let client; // Global MQTT client

function toggleInputs(isConnected) {
    // When connected: Lock inputs and Start button, Unlock End button
    document.getElementById('host').disabled = isConnected;
    document.getElementById('port').disabled = isConnected;
    document.getElementById('startBtn').disabled = isConnected;
    
    // The End button should be the opposite of the inputs
    document.getElementById('endBtn').disabled = !isConnected;
}

function connect() {
    const host = document.getElementById('host').value;
    const port = document.getElementById('port').value;
    const status = document.getElementById('status');

    if (!host || !port) {
        alert("Please enter both Host and Port.");
        return;
    }

    status.innerText = "Connecting...";
    
    // Initialize connection
    client = mqtt.connect(`wss://${host}:${port}/mqtt`);

    client.on('connect', () => {
        status.className = "alert alert-success mt-3";
        status.innerText = "Connected to " + host;
        
        // LOCK the UI
        toggleInputs(true);
    });

    client.on('error', (err) => {
        status.className = "alert alert-danger mt-3";
        status.innerText = "Connection Error";
        console.error(err);
        // If it fails, keep inputs unlocked
        toggleInputs(false);
    });
}

function disconnect() {
    if (client) {
        client.end(() => {
            const status = document.getElementById('status');
            status.className = "alert alert-secondary mt-3";
            status.innerText = "Status: Disconnected";
            
            // UNLOCK the UI
            toggleInputs(false);
            console.log("Connection closed.");
        });
    }
}