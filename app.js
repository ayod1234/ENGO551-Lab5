function connect() {
    const host = document.getElementById('host').value;
    const port = document.getElementById('port').value;
    const status = document.getElementById('status');

    if (!host || !port) {
        status.innerText = "Status: Please enter host and port";
        return;
    }

    status.innerText = "Status: Connecting...";

    // GitHub Pages is HTTPS, so we use 'wss'
    const client = mqtt.connect(`wss://${host}:${port}/mqtt`);

    client.on('connect', () => {
        status.className = "alert alert-success";
        status.innerText = "Status: Connected to " + host;
        console.log("Connected successfully!");
    });

    client.on('error', (err) => {
        status.className = "alert alert-danger";
        status.innerText = "Status: Connection Failed";
        console.error(err);
    });
}


// Add this inside your script
function sendMessage() {
    // Check if client exists and is connected
    if (client && client.connected) {
        const topic = "ayooluwa/geoweb/test";
        const message = "Hello from the Browser!";
        
        client.publish(topic, message);
        console.log("Message sent to topic:", topic);
    } else {
        alert("Connect to the broker first!");
    }
}