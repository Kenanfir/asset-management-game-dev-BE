const net = require('net');
const fs = require('fs');
const path = require('path');

try {
    const envPath = path.resolve(__dirname, '../.env');
    if (!fs.existsSync(envPath)) {
        console.error('.env file not found at', envPath);
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const dbUrlLine = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='));

    if (!dbUrlLine) {
        console.error('DATABASE_URL not found in .env');
        process.exit(1);
    }

    let dbUrl = dbUrlLine.substring('DATABASE_URL='.length).trim();
    // Remove quotes if present
    if ((dbUrl.startsWith('"') && dbUrl.endsWith('"')) || (dbUrl.startsWith("'") && dbUrl.endsWith("'"))) {
        dbUrl = dbUrl.slice(1, -1);
    }

    console.log('Found DATABASE_URL (masked):', dbUrl.replace(/:([^:@]+)@/, ':****@'));

    // Basic parsing for postgres://user:pass@host:port/db
    // Handle potential query params
    const urlParts = new URL(dbUrl);

    const host = urlParts.hostname;
    const port = urlParts.port || 5432;

    console.log(`Attempting TCP connection to ${host}:${port}...`);

    const socket = net.createConnection(parseInt(port), host, () => {
        console.log('✅ TCP connection established successfully!');
        socket.end();
    });

    socket.on('error', (err) => {
        console.error('❌ TCP connection failed:', err);
    });

    socket.setTimeout(5000);
    socket.on('timeout', () => {
        console.error('❌ Connection timed out');
        socket.destroy();
    });

} catch (error) {
    console.error('Script error:', error);
}
