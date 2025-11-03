# Restaurant Ledger Management System

A comprehensive web application for managing restaurant customer ledgers with secure PIN-based access and master password protection.

## Features

### 1. **Home Page**
- Display all customers in a card layout
- View Ledger button for each customer
- Delete customer option (small icon)
- Settings icon in header
- Add new customer functionality

### 2. **PIN Protection**
- Each customer has a unique 4-digit PIN
- PIN required to view customer ledger
- Secure verification before accessing sensitive data

### 3. **Customer Ledger**
- **Balance Display**: Shows either Total Credit or Total Advance
- **Month Filter**: Filter transactions by specific months
- **Action Buttons**: 
  - Add Credit (green button)
  - Add Payment (blue button)
- **Transaction List**: 
  - All transactions displayed with date, amount, and description
  - Color-coded by type (Credit in green, Payment in blue)
  - Delete option for each transaction

### 4. **Transaction Management**
- Add credit entries for purchases
- Add payment entries for settlements
- Each transaction includes:
  - Type (Credit/Payment)
  - Amount
  - Description (optional)
  - Date and time
  - Delete option (requires master password)

### 5. **Security Features**
- **Master Password**: `KINGG123` (default)
- Master password required to:
  - Delete transactions
  - Change master password
  - Change customer PINs

### 6. **Settings**
- Change master password (requires current password)
- Change customer PIN (requires master password)
- Accessible via settings icon on home page

## Installation

1. **Extract the files** or clone the repository

2. **Install dependencies**:
```bash
npm install
```

3. **Start the server**:
```bash
npm start
```

4. **Access the application**:
Open your browser and navigate to:
```
http://localhost:3000
```

## Usage Guide

### Adding a Customer
1. Click "Add New Customer" button on home page
2. Enter customer name
3. Set a 4-digit PIN
4. Click "Add Customer"

### Viewing Customer Ledger
1. Click "View Ledger" on a customer card
2. Enter the customer's 4-digit PIN
3. View transactions and balance

### Adding Transactions
1. Open customer ledger
2. Click "Add Credit" for credit entries
3. Click "Add Payment" for payment entries
4. Enter amount and optional description
5. Click "Add"

### Filtering Transactions
1. Open customer ledger
2. Use the month dropdown to filter by specific month
3. Select "All Months" to view all transactions

### Deleting Transactions
1. Click the delete icon (🗑️) on any transaction
2. Enter master password: `KINGG123`
3. Confirm deletion

### Changing Master Password
1. Click settings icon (⚙️) on home page
2. Go to "Change Master Password" section
3. Enter current master password
4. Enter new master password
5. Click "Update Master Password"

### Changing Customer PIN
1. Click settings icon (⚙️) on home page
2. Go to "Change Customer PIN" section
3. Enter master password
4. Select customer from dropdown
5. Enter new 4-digit PIN
6. Click "Update Customer PIN"

### Deleting a Customer
1. Click the delete icon (🗑️) on customer card
2. Confirm deletion
3. All customer transactions will be permanently deleted

## Data Storage

All data is stored locally in JSON files:
- `data/customers.json` - Customer data and transactions
- `data/settings.json` - Master password

## Default Credentials

- **Master Password**: `KINGG123`

## Technology Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Data Storage**: JSON files (File-based database)

## Security Notes

1. The master password is stored in plain text for simplicity
2. For production use, implement proper encryption and hashing
3. Consider adding user authentication
4. Implement proper backup mechanisms

## Features Implemented

✅ Customer list with view ledger buttons
✅ PIN-based ledger access
✅ Total credit/advance display
✅ Month-based transaction filtering
✅ Add credit and payment functionality
✅ Transaction deletion with master password
✅ Master password protection (default: KINGG123)
✅ Settings page for password management
✅ Customer PIN change functionality
✅ Responsive design for mobile devices
✅ Beautiful gradient UI
✅ Real-time balance calculations
✅ Transaction history with timestamps

## Support

For issues or questions, please check the code comments or modify as needed.

## License

ISC License - Free to use and modify
