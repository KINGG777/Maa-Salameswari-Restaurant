// Global variables
let currentCustomerId = null;
let currentTransactionType = null;
let deleteTransactionId = null;
let allTransactions = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadCustomers();
    
    // Initialize auto-backup status
    const autoBackupEnabled = localStorage.getItem('autoBackupEnabled') === 'true';
    const toggle = document.getElementById('autoBackupToggle');
    const status = document.getElementById('autoBackupStatus');
    
    if (toggle && status) {
        toggle.checked = autoBackupEnabled;
        status.textContent = autoBackupEnabled ? 'Enabled - Next at 2:00 AM' : 'Disabled';
        
        // Start auto-backup if enabled
        if (autoBackupEnabled) {
            scheduleAutoBackup();
        }
    }
});

// API calls
async function apiCall(url, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    return response.json();
}

// Load customers
async function loadCustomers() {
    const customers = await apiCall('/api/customers');
    const customerList = document.getElementById('customerList');
    
    if (customers.length === 0) {
        customerList.innerHTML = '<div class="no-transactions">No customers yet. Add your first customer!</div>';
        return;
    }
    
    customerList.innerHTML = customers.map(customer => `
        <div class="customer-card">
            <div class="delete-icon" onclick="deleteCustomer('${customer.id}')" title="Delete Customer">🗑️</div>
            <div class="customer-name">${customer.name}</div>
            <button class="view-ledger-btn" onclick="requestPin('${customer.id}', '${customer.name}')">View Ledger</button>
        </div>
    `).join('');
    
    // Also update settings customer select
    loadCustomersForSettings();
}

// Load customers for settings dropdown
async function loadCustomersForSettings() {
    const customers = await apiCall('/api/customers');
    const customerSelect = document.getElementById('customerSelect');
    
    customerSelect.innerHTML = customers.map(customer => `
        <option value="${customer.id}">${customer.name}</option>
    `).join('');
}

// Show add customer modal
function showAddCustomerModal() {
    document.getElementById('customerName').value = '';
    document.getElementById('customerPin').value = '';
    openModal('addCustomerModal');
}

// Add customer
async function addCustomer() {
    const name = document.getElementById('customerName').value.trim();
    const pin = document.getElementById('customerPin').value.trim();
    
    if (!name || !pin) {
        alert('Please enter both name and PIN');
        return;
    }
    
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
        alert('PIN must be exactly 4 digits');
        return;
    }
    
    await apiCall('/api/customers', 'POST', { name, pin });
    closeModal('addCustomerModal');
    loadCustomers();
}

// Delete customer
async function deleteCustomer(customerId) {
    // First get customer name for confirmation
    const customers = await apiCall('/api/customers');
    const customer = customers.find(c => c.id === customerId);
    
    if (!customer) {
        alert('Customer not found');
        return;
    }
    
    // Ask for master password
    const masterPassword = prompt(`⚠️ Delete Customer: ${customer.name}\n\nThis will delete the customer and ALL their transactions permanently!\n\nEnter Master Password to confirm:`);
    
    if (!masterPassword) {
        return; // User cancelled
    }
    
    // Verify master password
    const verification = await apiCall('/api/verify-master-password', 'POST', { password: masterPassword });
    
    if (!verification.success) {
        alert('❌ Invalid master password! Customer not deleted.');
        return;
    }
    
    // Final confirmation
    const confirmed = confirm(`Are you absolutely sure you want to delete:\n\n${customer.name}\n\nThis cannot be undone!`);
    
    if (!confirmed) {
        return;
    }
    
    await apiCall(`/api/customers/${customerId}`, 'DELETE');
    loadCustomers();
    alert('✅ Customer deleted successfully');
}

// Request PIN
function requestPin(customerId, customerName) {
    currentCustomerId = customerId;
    const pinInput = document.getElementById('pinInput');
    const pinError = document.getElementById('pinError');
    
    if (pinInput && pinError) {
        pinInput.value = '';
        pinError.style.display = 'none';
        pinError.textContent = '';
        openModal('pinModal');
    } else {
        console.error('PIN modal elements not found');
        alert('Error: PIN verification not available');
    }
}

// Verify PIN
async function verifyPin() {
    const pin = document.getElementById('pinInput').value.trim();
    
    if (!pin) {
        showError('pinError', 'Please enter PIN');
        return;
    }
    
    try {
        const result = await apiCall(`/api/customers/${currentCustomerId}/verify-pin`, 'POST', { pin });
        
        if (result.success) {
            closeModal('pinModal');
            showLedger(currentCustomerId);
        } else {
            showError('pinError', 'Invalid PIN. Please try again.');
            document.getElementById('pinInput').value = '';
            document.getElementById('pinInput').focus();
        }
    } catch (error) {
        console.error('PIN verification error:', error);
        showError('pinError', 'Error verifying PIN. Please try again.');
    }
}

// Show ledger
async function showLedger(customerId) {
    const customer = await apiCall(`/api/customers/${customerId}/ledger`);
    currentCustomerId = customerId;
    allTransactions = customer.transactions || [];
    
    document.getElementById('ledgerCustomerName').textContent = `${customer.name}'s Ledger`;
    
    // Calculate balance
    calculateBalance();
    
    // Generate month filter options
    generateMonthFilter();
    
    // Display transactions
    displayTransactions(allTransactions);
    
    // Show ledger page
    document.getElementById('homePage').style.display = 'none';
    document.getElementById('ledgerPage').style.display = 'block';
    
    // Hide floating add button on ledger page
    document.getElementById('floatingAddBtn').style.display = 'none';
}

// Calculate balance
function calculateBalance() {
    let balance = 0;
    allTransactions.forEach(transaction => {
        if (transaction.type === 'credit') {
            balance += transaction.amount;
        } else {
            balance -= transaction.amount;
        }
    });
    
    const balanceLabel = document.getElementById('balanceLabel');
    const balanceAmount = document.getElementById('balanceAmount');
    const balanceCard = document.querySelector('.balance-card');
    
    // Remove all balance type classes
    balanceCard.classList.remove('balance-credit', 'balance-advance', 'balance-zero');
    
    if (balance > 0) {
        balanceLabel.textContent = 'Total Credit';
        balanceAmount.textContent = `₹${balance.toFixed(2)}`;
        balanceAmount.style.color = 'white';
        balanceCard.classList.add('balance-credit'); // RED background
    } else if (balance < 0) {
        balanceLabel.textContent = 'Total Advance';
        balanceAmount.textContent = `₹${Math.abs(balance).toFixed(2)}`;
        balanceAmount.style.color = 'white';
        balanceCard.classList.add('balance-advance'); // GREEN background
    } else {
        balanceLabel.textContent = 'Balance';
        balanceAmount.textContent = '₹0.00';
        balanceAmount.style.color = 'white';
        balanceCard.classList.add('balance-zero'); // Default background
    }
}

// Generate month filter
function generateMonthFilter() {
    const months = new Set();
    allTransactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthYear);
    });
    
    const monthFilter = document.getElementById('monthFilter');
    monthFilter.innerHTML = '<option value="all">All Months</option>';
    
    Array.from(months).sort().reverse().forEach(monthYear => {
        const [year, month] = monthYear.split('-');
        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
        monthFilter.innerHTML += `<option value="${monthYear}">${monthName}</option>`;
    });
}

// Filter transactions
function filterTransactions() {
    const selectedMonth = document.getElementById('monthFilter').value;
    
    if (selectedMonth === 'all') {
        displayTransactions(allTransactions);
    } else {
        const filtered = allTransactions.filter(transaction => {
            const date = new Date(transaction.date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return monthYear === selectedMonth;
        });
        displayTransactions(filtered);
    }
}

// Display transactions
function displayTransactions(transactions) {
    const transactionsList = document.getElementById('transactionsList');
    
    if (transactions.length === 0) {
        transactionsList.innerHTML = '<div class="no-transactions">No transactions yet</div>';
        return;
    }
    
    // Sort by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    transactionsList.innerHTML = sortedTransactions.map(transaction => {
        const date = new Date(transaction.date);
        
        // Format date as: 03 Nov 2025, 02:30 PM
        const formattedDate = date.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric'
        });
        
        const formattedTime = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        
        const fullDateTime = `${formattedDate}, ${formattedTime}`;
        
        return `
            <div class="transaction-item ${transaction.type}">
                <div class="transaction-info">
                    <div class="transaction-type">${transaction.type === 'credit' ? '📝 Credit' : '💰 Payment'}</div>
                    ${transaction.description ? `<div class="transaction-desc">${transaction.description}</div>` : ''}
                    <div class="transaction-date">${fullDateTime}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'credit' ? '+' : '-'}₹${transaction.amount.toFixed(2)}
                </div>
                <div class="transaction-delete" onclick="requestDeleteTransaction('${transaction.id}')" title="Delete Transaction">🗑️</div>
            </div>
        `;
    }).join('');
}

// Show transaction modal
function showTransactionModal(type) {
    currentTransactionType = type;
    document.getElementById('transactionModalTitle').textContent = type === 'credit' ? 'Add Credit' : 'Add Payment';
    
    // Set current date and time
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);
    
    document.getElementById('transactionDate').value = dateStr;
    document.getElementById('transactionTime').value = timeStr;
    document.getElementById('transactionAmount').value = '';
    document.getElementById('transactionDescription').value = '';
    
    openModal('transactionModal');
}

// Add transaction
async function addTransaction() {
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const description = document.getElementById('transactionDescription').value.trim();
    const dateInput = document.getElementById('transactionDate').value;
    const timeInput = document.getElementById('transactionTime').value;
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    if (!dateInput || !timeInput) {
        alert('Please enter date and time');
        return;
    }
    
    // Store as local datetime string (no timezone conversion)
    const dateTimeString = `${dateInput}T${timeInput}:00`;
    
    await apiCall(`/api/customers/${currentCustomerId}/transactions`, 'POST', {
        type: currentTransactionType,
        amount,
        description,
        date: dateTimeString
    });
    
    closeModal('transactionModal');
    showLedger(currentCustomerId);
}

// Request delete transaction
function requestDeleteTransaction(transactionId) {
    deleteTransactionId = transactionId;
    document.getElementById('deleteMasterPassword').value = '';
    document.getElementById('deleteError').style.display = 'none';
    openModal('deleteTransactionModal');
}

// Confirm delete transaction
async function confirmDeleteTransaction() {
    const masterPassword = document.getElementById('deleteMasterPassword').value.trim();
    
    if (!masterPassword) {
        showError('deleteError', 'Please enter master password');
        return;
    }
    
    try {
        const response = await fetch(`/api/customers/${currentCustomerId}/transactions/${deleteTransactionId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ masterPassword })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            closeModal('deleteTransactionModal');
            showLedger(currentCustomerId);
        } else {
            showError('deleteError', 'Invalid master password');
        }
    } catch (error) {
        showError('deleteError', 'Error deleting transaction');
    }
}

// Show settings
function showSettings() {
    document.getElementById('homePage').style.display = 'none';
    document.getElementById('settingsPage').style.display = 'block';
    
    // Clear all fields
    document.getElementById('oldMasterPassword').value = '';
    document.getElementById('newMasterPassword').value = '';
    document.getElementById('pinChangeMasterPassword').value = '';
    document.getElementById('newCustomerPin').value = '';
    
    // Hide messages
    hideMessage('masterPasswordError');
    hideMessage('masterPasswordSuccess');
    hideMessage('pinChangeError');
    hideMessage('pinChangeSuccess');
    
    // Hide floating add button on settings page
    document.getElementById('floatingAddBtn').style.display = 'none';
    
    loadCustomersForSettings();
}

// Change master password
async function changeMasterPassword() {
    const oldPassword = document.getElementById('oldMasterPassword').value.trim();
    const newPassword = document.getElementById('newMasterPassword').value.trim();
    
    hideMessage('masterPasswordError');
    hideMessage('masterPasswordSuccess');
    
    if (!oldPassword || !newPassword) {
        showError('masterPasswordError', 'Please enter both passwords');
        return;
    }
    
    if (newPassword.length < 6) {
        showError('masterPasswordError', 'New password must be at least 6 characters');
        return;
    }
    
    const result = await apiCall('/api/change-master-password', 'POST', {
        oldPassword,
        newPassword
    });
    
    if (result.success) {
        showSuccess('masterPasswordSuccess', 'Master password changed successfully!');
        document.getElementById('oldMasterPassword').value = '';
        document.getElementById('newMasterPassword').value = '';
    } else {
        showError('masterPasswordError', 'Invalid old password');
    }
}

// Change customer PIN
async function changeCustomerPin() {
    const masterPassword = document.getElementById('pinChangeMasterPassword').value.trim();
    const customerId = document.getElementById('customerSelect').value;
    const newPin = document.getElementById('newCustomerPin').value.trim();
    
    hideMessage('pinChangeError');
    hideMessage('pinChangeSuccess');
    
    if (!masterPassword || !newPin) {
        showError('pinChangeError', 'Please enter master password and new PIN');
        return;
    }
    
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
        showError('pinChangeError', 'PIN must be exactly 4 digits');
        return;
    }
    
    try {
        const response = await fetch(`/api/customers/${customerId}/change-pin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ masterPassword, newPin })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showSuccess('pinChangeSuccess', 'Customer PIN changed successfully!');
            document.getElementById('pinChangeMasterPassword').value = '';
            document.getElementById('newCustomerPin').value = '';
        } else {
            showError('pinChangeError', 'Invalid master password');
        }
    } catch (error) {
        showError('pinChangeError', 'Error changing PIN');
    }
}

// Export ledger
async function exportLedger() {
    const selectedMonth = document.getElementById('monthFilter').value;
    
    try {
        const response = await fetch(`/api/customers/${currentCustomerId}/export?month=${selectedMonth}`);
        const data = await response.json();
        
        if (response.ok) {
            // Generate CSV content
            const csv = generateCSV(data);
            
            // Create download link
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `${data.customerName}_Ledger_${data.month}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Show success message
            alert(`✅ Ledger exported successfully!\n\nCustomer: ${data.customerName}\nPeriod: ${data.month}\nTotal Credit: ₹${data.summary.totalCredit.toFixed(2)}\nTotal Payment: ₹${data.summary.totalPayment.toFixed(2)}\nBalance: ₹${Math.abs(data.summary.balance).toFixed(2)}`);
        } else {
            alert('❌ Error exporting ledger');
        }
    } catch (error) {
        console.error('Export error:', error);
        alert('❌ Error exporting ledger');
    }
}

// Send balance via SMS/WhatsApp
async function sendBalanceSMS() {
    try {
        const response = await fetch(`/api/customers/${currentCustomerId}/export?month=all`);
        const data = await response.json();
        
        if (!response.ok) {
            alert('❌ Error getting balance information');
            return;
        }
        
        const balance = data.summary.balance;
        const customerName = data.customerName;
        
        // Prepare message
        let message = `🍽️ Maa Samaleswari Restaurant\n\n`;
        message += `Dear ${customerName},\n\n`;
        message += `Your Account Balance:\n`;
        message += `━━━━━━━━━━━━━━━━━\n`;
        message += `Total Credit: ₹${data.summary.totalCredit.toFixed(2)}\n`;
        message += `Total Payment: ₹${data.summary.totalPayment.toFixed(2)}\n`;
        message += `━━━━━━━━━━━━━━━━━\n`;
        
        if (balance > 0) {
            message += `Outstanding Amount: ₹${balance.toFixed(2)}\n`;
            message += `(Amount you need to pay)\n\n`;
        } else if (balance < 0) {
            message += `Advance Amount: ₹${Math.abs(balance).toFixed(2)}\n`;
            message += `(Advance paid by you)\n\n`;
        } else {
            message += `Balance: ₹0.00\n`;
            message += `(Account settled)\n\n`;
        }
        
        message += `Thank you for your business!\n`;
        message += `Date: ${new Date().toLocaleDateString('en-IN')}`;
        
        // Show options modal
        showSMSOptionsModal(message);
        
    } catch (error) {
        console.error('SMS error:', error);
        alert('❌ Error preparing message');
    }
}

// Show SMS options modal
function showSMSOptionsModal(message) {
    const encodedMessage = encodeURIComponent(message);
    
    // Create modal HTML
    const modalHTML = `
        <div id="smsModal" class="modal active">
            <div class="modal-content">
                <div class="modal-header">Send Balance Information</div>
                
                <div class="sms-preview">
                    <label>Message Preview:</label>
                    <textarea readonly rows="12" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-family: monospace; font-size: 14px;">${message}</textarea>
                </div>
                
                <div class="sms-options">
                    <button class="btn btn-primary" onclick="sendViaWhatsApp('${encodedMessage}')">
                        <span style="font-size: 20px;">📱</span> Send via WhatsApp
                    </button>
                    <button class="btn btn-primary" onclick="sendViaSMS('${encodedMessage}')">
                        <span style="font-size: 20px;">💬</span> Send via SMS
                    </button>
                    <button class="btn btn-secondary" onclick="copyToClipboard(\`${message.replace(/`/g, '\\`')}\`)">
                        <span style="font-size: 20px;">📋</span> Copy Message
                    </button>
                </div>
                
                <div class="btn-group" style="margin-top: 20px;">
                    <button class="btn btn-secondary" onclick="closeModal('smsModal')">Close</button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if present
    const existingModal = document.getElementById('smsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Send via WhatsApp
function sendViaWhatsApp(encodedMessage) {
    // Open WhatsApp with pre-filled message
    const whatsappURL = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');
    closeModal('smsModal');
}

// Send via SMS
function sendViaSMS(encodedMessage) {
    // Open SMS app with pre-filled message
    const smsURL = `sms:?body=${encodedMessage}`;
    window.location.href = smsURL;
    closeModal('smsModal');
}

// Copy to clipboard
function copyToClipboard(text) {
    // Create temporary textarea
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        alert('✅ Message copied to clipboard!');
    } catch (err) {
        alert('❌ Failed to copy message');
    }
    
    document.body.removeChild(textarea);
}

// Generate CSV from ledger data
function generateCSV(data) {
    let csv = '';
    
    // Header
    csv += '=================================================\n';
    csv += `MAA SAMALESWARI RESTAURANT - CUSTOMER LEDGER\n`;
    csv += '=================================================\n\n';
    
    csv += `Customer Name: ${data.customerName}\n`;
    csv += `Export Period: ${data.month}\n`;
    csv += `Export Date: ${new Date().toLocaleString('en-IN')}\n\n`;
    
    csv += '=================================================\n';
    csv += 'SUMMARY\n';
    csv += '=================================================\n';
    csv += `Total Credit: ₹${data.summary.totalCredit.toFixed(2)}\n`;
    csv += `Total Payment: ₹${data.summary.totalPayment.toFixed(2)}\n`;
    csv += `Balance: ₹${Math.abs(data.summary.balance).toFixed(2)} ${data.summary.balance >= 0 ? '(Customer owes)' : '(Advance paid)'}\n\n`;
    
    if (data.transactions.length > 0) {
        csv += '=================================================\n';
        csv += 'TRANSACTION DETAILS\n';
        csv += '=================================================\n\n';
        
        // CSV Headers
        csv += 'Date,Time,Type,Amount,Description\n';
        
        // Sort transactions by date (newest first)
        const sortedTransactions = [...data.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Transaction rows
        sortedTransactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const dateStr = date.toLocaleDateString('en-IN');
            const timeStr = date.toLocaleTimeString('en-IN');
            const type = transaction.type === 'credit' ? 'Credit' : 'Payment';
            const amount = transaction.type === 'credit' ? `+₹${transaction.amount.toFixed(2)}` : `-₹${transaction.amount.toFixed(2)}`;
            const description = transaction.description ? transaction.description.replace(/,/g, ';') : 'N/A';
            
            csv += `${dateStr},${timeStr},${type},${amount},"${description}"\n`;
        });
    } else {
        csv += '=================================================\n';
        csv += 'No transactions found for the selected period.\n';
        csv += '=================================================\n';
    }
    
    csv += '\n=================================================\n';
    csv += 'END OF REPORT\n';
    csv += '=================================================\n';
    
    return csv;
}

// Create backup
async function createBackup() {
    try {
        hideMessage('backupError');
        hideMessage('backupSuccess');
        
        const customers = await apiCall('/api/customers');
        const settings = await apiCall('/api/settings');
        
        const backup = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: {
                customers,
                settings
            }
        };
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const filename = `Maa_Samaleswari_Backup_${new Date().toISOString().split('T')[0]}.json`;
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showSuccess('backupSuccess', `✅ Backup created successfully! File: ${filename}`);
    } catch (error) {
        console.error('Backup error:', error);
        showError('backupError', '❌ Error creating backup');
    }
}

// Handle backup file selection
// Handle backup file upload and restore
async function handleBackupFile() {
    const fileInput = document.getElementById('backupFile');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    hideMessage('backupError');
    hideMessage('backupSuccess');
    
    // Confirm restoration
    const confirmRestore = confirm(
        '⚠️ WARNING: Restoring a backup will REPLACE ALL current data!\n\n' +
        'This includes:\n' +
        '- All customers\n' +
        '- All transactions\n\n' +
        'Are you sure you want to continue?'
    );
    
    if (!confirmRestore) {
        fileInput.value = '';
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            const backupData = JSON.parse(e.target.result);
            
            // Validate backup file - check for customers array
            if (!backupData.customers || !Array.isArray(backupData.customers)) {
                showError('backupError', '❌ Invalid backup file format. Missing customers data.');
                fileInput.value = '';
                return;
            }
            
            // Send restore request to server
            const response = await fetch('/api/restore', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(backupData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showSuccess('backupSuccess', `✅ Backup restored successfully! ${backupData.customers.length} customers restored.`);
                
                // Reload page after 2 seconds
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                showError('backupError', '❌ Error restoring backup: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Restore error:', error);
            showError('backupError', '❌ Error reading backup file. Make sure it is a valid JSON backup file.');
        }
        
        fileInput.value = '';
    };
    
    reader.onerror = function() {
        showError('backupError', '❌ Error reading file. Please try again.');
        fileInput.value = '';
    };
    
    reader.readAsText(file);
}

// Go to home
function goToHome() {
    document.getElementById('homePage').style.display = 'block';
    document.getElementById('ledgerPage').style.display = 'none';
    document.getElementById('settingsPage').style.display = 'none';
    
    // Show floating add button on home page
    document.getElementById('floatingAddBtn').style.display = 'flex';
    
    loadCustomers();
}

// Modal helpers
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Error/Success message helpers
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
}

function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
}

function hideMessage(elementId) {
    document.getElementById(elementId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// Enter key handlers
document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            if (activeModal.id === 'pinModal') {
                verifyPin();
            } else if (activeModal.id === 'addCustomerModal') {
                addCustomer();
            } else if (activeModal.id === 'transactionModal') {
                addTransaction();
            } else if (activeModal.id === 'deleteTransactionModal') {
                confirmDeleteTransaction();
            }
        }
    }
});

// Backup and Restore Functions
async function createBackup() {
    try {
        hideMessage('backupError');
        hideMessage('backupSuccess');
        
        // Get all customers data
        const customers = await apiCall('/api/customers');
        
        // Create backup data object
        const backupData = {
            customers: customers,
            backupDate: new Date().toISOString(),
            version: '3.0',
            restaurant: 'Maa Samaleswari'
        };
        
        // Create JSON file
        const jsonData = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create download link with timestamp
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        link.setAttribute('href', url);
        link.setAttribute('download', `maa-samaleswari-backup-${timestamp}.json`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showSuccess('backupSuccess', '✅ Backup downloaded successfully!');
        
        // Schedule next auto-backup if it's the first time
        scheduleAutoBackup();
        
    } catch (error) {
        console.error('Backup error:', error);
        showError('backupError', '❌ Error creating backup. Please try again.');
    }
}

// Auto backup function
function scheduleAutoBackup() {
    // Check if auto-backup is enabled
    const autoBackupEnabled = localStorage.getItem('autoBackupEnabled');
    
    if (autoBackupEnabled !== 'true') {
        return; // Don't schedule if not enabled
    }
    
    // Calculate time until 2 AM
    const now = new Date();
    const targetTime = new Date();
    targetTime.setHours(2, 0, 0, 0);
    
    // If 2 AM has passed today, schedule for tomorrow
    if (now > targetTime) {
        targetTime.setDate(targetTime.getDate() + 1);
    }
    
    const timeUntilBackup = targetTime - now;
    
    // Schedule the backup
    setTimeout(() => {
        createBackup();
        // Schedule next day's backup
        scheduleAutoBackup();
    }, timeUntilBackup);
}

// Enable auto backup
function enableAutoBackup() {
    localStorage.setItem('autoBackupEnabled', 'true');
    scheduleAutoBackup();
    showSuccess('backupSuccess', '✅ Auto-backup enabled! Backup will run daily at 2:00 AM.');
}

// Disable auto backup
function disableAutoBackup() {
    localStorage.setItem('autoBackupEnabled', 'false');
    showSuccess('backupSuccess', '✅ Auto-backup disabled.');
}

// Toggle auto backup
function toggleAutoBackup() {
    const toggle = document.getElementById('autoBackupToggle');
    const status = document.getElementById('autoBackupStatus');
    
    if (toggle.checked) {
        enableAutoBackup();
        status.textContent = 'Enabled - Next at 2:00 AM';
    } else {
        disableAutoBackup();
        status.textContent = 'Disabled';
    }
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('ServiceWorker registration successful');
            })
            .catch((err) => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}
