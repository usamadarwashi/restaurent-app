const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;
const PRODUCTS_FILE = path.join(__dirname, 'products.csv');
const ORDERS_FILE = path.join(__dirname, 'orders.csv');
const REPORTS_FILE = path.join(__dirname, 'reports.csv');

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
    fs.readFile(PRODUCTS_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to read products file' });
        }
        res.send(data);
    });
});

// Write products to CSV
app.post('/api/products', (req, res) => {
    const csv = req.body.csv;
    fs.writeFile(PRODUCTS_FILE, csv, 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to write to CSV file' });
        }
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

app.get('/api/reports', (req, res) => {
    fs.readFile(REPORTS_FILE, 'utf8', (err, data) => {
        if (err && err.code === 'ENOENT') {
            // If file doesn't exist, return empty array
            return res.json({ reports: [] });
        }
        if (err) {
            return res.status(500).json({ error: 'Unable to read reports file' });
        }
        
        const lines = data.trim().split('\n');
        const reports = [];
        
        // Skip header
        for (let i = 1; i < lines.length; i++) {
            const [date, totalSales, ordersCount] = lines[i].split(',');
            reports.push({
                date,
                totalSales: parseFloat(totalSales),
                ordersCount: parseInt(ordersCount)
            });
        }
        
        res.json({ reports });
    });
});

app.post('/api/reports/update', (req, res) => {
    const { date, totalSales, ordersCount } = req.body;
    
    fs.readFile(REPORTS_FILE, 'utf8', (err, data) => {
        let lines = [];
        let headerExists = false;
        
        if (!err && data) {
            lines = data.trim().split('\n');
            headerExists = lines.length > 0;
        }
        
        // Create header if needed
        if (!headerExists) {
            lines.push('date,totalSales,ordersCount');
        }
        
        let found = false;
        const newLines = lines.map(line => {
            const [existingDate] = line.split(',');
            if (existingDate === date) {
                found = true;
                return `${date},${totalSales},${ordersCount}`;
            }
            return line;
        });
        
        if (!found) {
            newLines.push(`${date},${totalSales},${ordersCount}`);
        }
        
        fs.writeFile(REPORTS_FILE, newLines.join('\n'), 'utf8', (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to update reports' });
            }
            res.json({ success: true });
        });
    });
});