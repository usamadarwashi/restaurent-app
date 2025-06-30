const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;
const CSV_FILE = path.join(__dirname, 'products.csv');
const ORDERS_FILE = path.join(__dirname, 'orders.csv');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // serve frontend


app.post('/api/orders/append', (req, res) => {
    const { order } = req.body;
    if (!order) return res.status(400).json({ error: 'Missing order' });

    const itemsStr = order.items.map(i => `${i.name} x${i.quantity} (${i.price})`).join('|');

    const line = `${order.orderNumber},${order.date},${order.time},${order.total},${order.notes || ''},"${itemsStr}"\n`;

    fs.appendFile(ORDERS_FILE, line, 'utf8', (err) => {
        if (err) return res.status(500).json({ error: 'Failed to append order' });
        res.json({ success: true });
    });
});

app.post('/api/orders', (req, res) => {
    const { csv } = req.body;
    if (!csv) return res.status(400).json({ error: 'Missing CSV data' });

    fs.writeFile(ORDERS_FILE, csv, 'utf8', (err) => {
        if (err) return res.status(500).json({ error: 'Failed to write orders file' });
        res.json({ success: true });
    });
});


app.get('/api/orders', (req, res) => {
    fs.readFile(ORDERS_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Unable to read orders' });

        const lines = data.trim().split('\n');
        const [header, ...rows] = lines;

        const orders = rows.map(line => {
    const [orderNumber, date, time, total, notes, itemsStr] = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

    const items = itemsStr
        .replace(/^"|"$/g, '')
        .split('|')
        .map(entry => {
            const match = entry.match(/^(.*?) x(\d+) \(([\d.]+)\)$/);
            return match ? {
                name: match[1].trim(),
                quantity: parseInt(match[2]),
                price: parseFloat(match[3])
            } : null;
        })
        .filter(Boolean);

    const totalNumber = parseFloat(total);
    const totalFinal = !isNaN(totalNumber) ? totalNumber : items.reduce((sum, i) => sum + (i.quantity * i.price), 0);

    return {
        orderNumber: parseInt(orderNumber),
        date,
        time,
        total: totalFinal,
        notes: notes || '',
        items,
        dateTime: `${date} ${time}`
    };
});

        res.json({ orders }); // ✅ JSON that frontend can use
    });
});




// Read products from CSV
app.get('/api/products', (req, res) => {
    fs.readFile(CSV_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to read CSV file' });
        }
        res.send(data);
    });
});

// Write products to CSV
app.post('/api/products', (req, res) => {
    const csv = req.body.csv;
    fs.writeFile(CSV_FILE, csv, 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to write to CSV file' });
        }
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
