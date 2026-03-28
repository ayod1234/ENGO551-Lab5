function connect() {
    const host = document.getElementById('host').value;
    const port = document.getElementById('port').value;
    const status = document.getElementById('status');

    // GitHub Pages is HTTPS, so you MUST use 'wss' (Secure WebSockets)
    const client = mqtt.connect(`wss://${host}:${port}/mqtt`);

    client.on('connect', () => {
        status.innerText = "Status: Connected to " + host;
        console.log("Success!");
    });

    client.on('error', (err) => {
        status.innerText = "Status: Connection Failed";
        console.error(err);
    });
}