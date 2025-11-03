const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Data file paths
const DATA_DIR = './data';
const CUSTOMERS_FILE = path.join(DATA_DIR, 'customers.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Initialize data directory and files
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

if (!fs.existsSync(CUSTOMERS_FILE)) {
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify([]));
}

if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ masterPassword: 'KINGG123' }));
}

// Helper functions
function readCustomers() {
    return JSON.parse(fs.readFileSync(CUSTOMERS_FILE, 'utf8'));
}

function writeCustomers(customers) {
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 2));
}

function readSettings() {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
}

function writeSettings(settings) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// API Routes

// Get all customers
app.get('/api/customers', (req, res) => {
    const customers = readCustomers();
    res.json(customers);
});

// Add new customer
app.post('/api/customers', (req, res) => {
    const { name, pin } = req.body;
    const customers = readCustomers();
    
    const newCustomer = {
        id: Date.now().toString(),
        name,
        pin,
        transactions: []
    };
    
    customers.push(newCustomer);
    writeCustomers(customers);
    res.json(newCustomer);
});

// Delete customer
app.delete('/api/customers/:id', (req, res) => {
    const { id } = req.params;
    let customers = readCustomers();
    customers = customers.filter(c => c.id !== id);
    writeCustomers(customers);
    res.json({ success: true });
});

// Verify customer PIN
app.post('/api/customers/:id/verify-pin', (req, res) => {
    const { id } = req.params;
    const { pin } = req.body;
    const customers = readCustomers();
    const customer = customers.find(c => c.id === id);
    
    if (customer && customer.pin === pin) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Get customer ledger
app.get('/api/customers/:id/ledger', (req, res) => {
    const { id } = req.params;
    const customers = readCustomers();
    const customer = customers.find(c => c.id === id);
    
    if (customer) {
        res.json(customer);
    } else {
        res.status(404).json({ error: 'Customer not found' });
    }
});

// Add transaction
app.post('/api/customers/:id/transactions', (req, res) => {
    const { id } = req.params;
    const { type, amount, description } = req.body;
    const customers = readCustomers();
    const customerIndex = customers.findIndex(c => c.id === id);
    
    if (customerIndex !== -1) {
        const transaction = {
            id: Date.now().toString(),
            type, // 'credit' or 'payment'
            amount: parseFloat(amount),
            description,
            date: new Date().toISOString()
        };
        
        customers[customerIndex].transactions.push(transaction);
        writeCustomers(customers);
        res.json(transaction);
    } else {
        res.status(404).json({ error: 'Customer not found' });
    }
});

// Delete transaction
app.delete('/api/customers/:customerId/transactions/:transactionId', (req, res) => {
    const { customerId, transactionId } = req.params;
    const { masterPassword } = req.body;
    const settings = readSettings();
    
    if (masterPassword !== settings.masterPassword) {
        return res.status(403).json({ error: 'Invalid master password' });
    }
    
    const customers = readCustomers();
    const customerIndex = customers.findIndex(c => c.id === customerId);
    
    if (customerIndex !== -1) {
        customers[customerIndex].transactions = customers[customerIndex].transactions.filter(
            t => t.id !== transactionId
        );
        writeCustomers(customers);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Customer not found' });
    }
});

// Verify master password
app.post('/api/verify-master-password', (req, res) => {
    const { password } = req.body;
    const settings = readSettings();
    
    if (password === settings.masterPassword) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Change master password
app.post('/api/change-master-password', (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const settings = readSettings();
    
    if (oldPassword === settings.masterPassword) {
        settings.masterPassword = newPassword;
        writeSettings(settings);
        res.json({ success: true });
    } else {
        res.json({ success: false, error: 'Invalid old password' });
    }
});

// Change customer PIN
app.post('/api/customers/:id/change-pin', (req, res) => {
    const { id } = req.params;
    const { masterPassword, newPin } = req.body;
    const settings = readSettings();
    
    if (masterPassword !== settings.masterPassword) {
        return res.status(403).json({ error: 'Invalid master password' });
    }
    
    const customers = readCustomers();
    const customerIndex = customers.findIndex(c => c.id === id);
    
    if (customerIndex !== -1) {
        customers[customerIndex].pin = newPin;
        writeCustomers(customers);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Customer not found' });
    }
});

// Export customer ledger
app.get('/api/customers/:id/export', (req, res) => {
    const { id } = req.params;
    const { month } = req.query;
    const customers = readCustomers();
    const customer = customers.find(c => c.id === id);
    
    if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
    }
    
    let transactions = customer.transactions || [];
    
    // Filter by month if specified
    if (month && month !== 'all') {
        transactions = transactions.filter(transaction => {
            const date = new Date(transaction.date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return monthYear === month;
        });
    }
    
    // Calculate totals
    let totalCredit = 0;
    let totalPayment = 0;
    transactions.forEach(t => {
        if (t.type === 'credit') {
            totalCredit += t.amount;
        } else {
            totalPayment += t.amount;
        }
    });
    
    const balance = totalCredit - totalPayment;
    
    res.json({
        customerName: customer.name,
        month: month === 'all' ? 'All Time' : month,
        transactions,
        summary: {
            totalCredit,
            totalPayment,
            balance
        }
    });
});

// Get settings (for backup)
app.get('/api/settings', (req, res) => {
    const settings = readSettings();
    res.json(settings);
});

// Restore backup
// Restore from backup
app.post('/api/restore', (req, res) => {
    try {
        const { customers, settings } = req.body;
        
        if (!customers || !Array.isArray(customers)) {
            return res.status(400).json({ error: 'Invalid backup data - customers array required' });
        }
        
        // Write customers
        writeCustomers(customers);
        
        // Write settings if provided
        if (settings) {
            writeSettings(settings);
        }
        
        res.json({ success: true, customersRestored: customers.length });
    } catch (error) {
        console.error('Restore error:', error);
        res.status(500).json({ error: 'Error restoring backup' });
    }
});

// Alternative endpoint for compatibility
app.post('/api/restore-backup', (req, res) => {
    try {
        const { customers, settings } = req.body;
        
        if (!customers || !Array.isArray(customers)) {
            return res.status(400).json({ error: 'Invalid backup data' });
        }
        
        // Write customers
        writeCustomers(customers);
        
        // Write settings if provided
        if (settings) {
            writeSettings(settings);
        }
        
        res.json({ success: true, customersRestored: customers.length });
    } catch (error) {
        console.error('Restore error:', error);
        res.status(500).json({ error: 'Error restoring backup' });
    }
});

// Serve HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
