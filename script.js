class UangKuApp {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('uangku_transactions')) || [];
        this.chart = null;
        this.currentDate = new Date();
        this.selectedDate = null;
        this.filteredTransactions = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDate();
        this.updateDashboard();
        this.renderTransactions();
        this.initChart();
        this.setupAmountFormatting();
    }

    setupAmountFormatting() {
        const amountInputs = ['amount', 'editAmount'];
        
        amountInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', (e) => this.formatAmountInput(e.target));
                input.addEventListener('blur', (e) => this.formatAmountOnBlur(e.target));
                input.addEventListener('focus', (e) => this.formatAmountOnFocus(e.target));
            }
        });
    }

    formatAmountInput(input) {
        let value = input.value.replace(/[^\d]/g, '');
        
        if (value === '') {
            input.value = '';
            input.dataset.numericValue = '';
            return;
        }

        const numericValue = parseInt(value);
        if (numericValue > 999999999) {
            value = '999999999';
        }

        input.dataset.numericValue = numericValue;
        
        // Format langsung saat mengetik
        if (numericValue > 0) {
            input.value = this.formatNumberWithSeparator(numericValue);
        } else {
            input.value = '';
        }
    }

    formatAmountOnBlur(input) {
        const numericValue = input.dataset.numericValue || input.value.replace(/[^\d]/g, '');
        
        if (numericValue === '' || numericValue === '0') {
            input.value = '';
            return;
        }

        // Tetap format dengan separator, bukan currency
        if (numericValue > 0) {
            input.value = this.formatNumberWithSeparator(numericValue);
        }
    }

    formatAmountOnFocus(input) {
        const numericValue = input.dataset.numericValue || input.value.replace(/[^\d]/g, '');
        if (numericValue && numericValue > 0) {
            input.value = this.formatNumberWithSeparator(numericValue);
        } else {
            input.value = numericValue;
        }
    }

    formatCurrencyDisplay(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatNumberWithSeparator(amount) {
        return new Intl.NumberFormat('id-ID').format(amount);
    }

    getNumericValue(input) {
        return parseInt(input.dataset.numericValue || input.value.replace(/[^\d]/g, '')) || 0;
    }

    setupEventListeners() {
        document.getElementById('addTransactionBtn').addEventListener('click', () => this.openModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        
        document.getElementById('transactionForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        document.getElementById('transactionModal').addEventListener('click', (e) => {
            if (e.target.id === 'transactionModal') {
                this.closeModal();
            }
        });

        document.getElementById('calendarBtn').addEventListener('click', () => this.openCalendarModal());
        document.getElementById('closeCalendarModal').addEventListener('click', () => this.closeCalendarModal());
        document.getElementById('calendarModal').addEventListener('click', (e) => {
            if (e.target.id === 'calendarModal') {
                this.closeCalendarModal();
            }
        });

        document.getElementById('prevMonth').addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.navigateMonth(1));

        document.getElementById('closeDailyDetailModal').addEventListener('click', () => this.closeDailyDetailModal());
        document.getElementById('dailyDetailModal').addEventListener('click', (e) => {
            if (e.target.id === 'dailyDetailModal') {
                this.closeDailyDetailModal();
            }
        });

        document.getElementById('viewAllBtn').addEventListener('click', () => this.openAllTransactionsModal());
        document.getElementById('closeAllTransactionsModal').addEventListener('click', () => this.closeAllTransactionsModal());
        document.getElementById('allTransactionsModal').addEventListener('click', (e) => {
            if (e.target.id === 'allTransactionsModal') {
                this.closeAllTransactionsModal();
            }
        });

        document.getElementById('filterCategory').addEventListener('change', () => this.filterTransactions());
        document.getElementById('resetFilterBtn').addEventListener('click', () => this.resetFilter());

        document.getElementById('resetBtn').addEventListener('click', () => this.openResetModal());
        document.getElementById('closeResetModal').addEventListener('click', () => this.closeResetModal());
        document.getElementById('cancelResetBtn').addEventListener('click', () => this.closeResetModal());
        document.getElementById('confirmResetBtn').addEventListener('click', () => this.confirmReset());
        document.getElementById('resetConfirmModal').addEventListener('click', (e) => {
            if (e.target.id === 'resetConfirmModal') {
                this.closeResetModal();
            }
        });
    }

    setDefaultDate() {
        const todayDate = new Date();
        const todayYear = todayDate.getFullYear();
        const todayMonth = String(todayDate.getMonth() + 1).padStart(2, '0');
        const todayDay = String(todayDate.getDate()).padStart(2, '0');
        const today = `${todayYear}-${todayMonth}-${todayDay}`;
        document.getElementById('date').value = today;
    }

    openModal() {
        document.getElementById('transactionModal').classList.add('active');
        document.getElementById('amount').focus();
    }

    closeModal() {
        document.getElementById('transactionModal').classList.remove('active');
        document.getElementById('transactionForm').reset();
        this.setDefaultDate();
        
        const amountInput = document.getElementById('amount');
        amountInput.value = '';
        amountInput.dataset.numericValue = '';
    }

    openCalendarModal() {
        document.getElementById('calendarModal').classList.add('active');
        this.renderCalendar();
    }

    closeCalendarModal() {
        document.getElementById('calendarModal').classList.remove('active');
        this.selectedDate = null;
    }

    openAllTransactionsModal() {
        document.getElementById('allTransactionsModal').classList.add('active');
        this.renderAllTransactions();
    }

    closeAllTransactionsModal() {
        document.getElementById('allTransactionsModal').classList.remove('active');
        this.filteredTransactions = [];
        document.getElementById('filterCategory').value = '';
    }

    openResetModal() {
        document.getElementById('resetConfirmModal').classList.add('active');
    }

    closeResetModal() {
        document.getElementById('resetConfirmModal').classList.remove('active');
    }

    confirmReset() {
        this.transactions = [];
        this.saveTransactions();
        this.updateDashboard();
        this.renderTransactions();
        this.updateChart();
        this.closeResetModal();
        this.showNotification('Semua data berhasil dihapus!');
        
        if (document.getElementById('calendarModal').classList.contains('active')) {
            this.renderCalendar();
        }
        
        if (document.getElementById('allTransactionsModal').classList.contains('active')) {
            this.renderAllTransactions();
        }
    }

    openDailyDetailModal(date) {
        this.selectedDate = date;
        this.renderDailyDetail(date);
        document.getElementById('dailyDetailModal').classList.add('active');
    }

    closeDailyDetailModal() {
        document.getElementById('dailyDetailModal').classList.remove('active');
        this.selectedDate = null;
    }

    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        document.getElementById('currentMonthYear').textContent = 
            this.currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        const dayOfWeek = firstDay.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);

        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';

        const todayDate = new Date();
        const todayYear = todayDate.getFullYear();
        const todayMonth = String(todayDate.getMonth() + 1).padStart(2, '0');
        const todayDay = String(todayDate.getDate()).padStart(2, '0');
        const today = `${todayYear}-${todayMonth}-${todayDay}`;

        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
            
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = currentDate.getDate();

            if (currentDate.getMonth() !== month) {
                dayElement.classList.add('other-month');
            }

            if (dateString === today) {
                dayElement.classList.add('today');
            }

            const dayTransactions = this.getTransactionsByDate(dateString);
            if (dayTransactions.length > 0) {
                dayElement.classList.add('has-expenses');
                const totalAmount = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
                dayElement.title = `${dayTransactions.length} transaksi - ${this.formatCurrency(totalAmount)}`;
            }

            dayElement.addEventListener('click', () => {
                this.openDailyDetailModal(dateString);
            });

            calendarDays.appendChild(dayElement);
        }
    }

    renderDailyDetail(date) {
        const transactions = this.getTransactionsByDate(date);
        const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
        const dateObj = new Date(date);
        
        document.getElementById('dailyDetailTitle').textContent = 
            `Detail Pengeluaran - ${dateObj.toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}`;
        
        document.getElementById('dailyTotalAmount').textContent = this.formatCurrency(totalAmount);
        document.getElementById('dailyTransactionCount').textContent = `${transactions.length} transaksi`;

        const container = document.getElementById('dailyTransactionsList');
        
        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-day"></i>
                    <h3>Tidak ada transaksi</h3>
                    <p>Belum ada pengeluaran pada tanggal ini</p>
                </div>
            `;
            return;
        }

        container.innerHTML = transactions.map(transaction => `
            <div class="daily-transaction-item">
                <div class="daily-transaction-icon category-${transaction.category}">
                    ${this.getCategoryIcon(transaction.category)}
                </div>
                <div class="daily-transaction-details">
                    <div class="daily-transaction-title">${transaction.description}</div>
                    <div class="daily-transaction-category">${this.getCategoryName(transaction.category)}</div>
                </div>
                <div class="daily-transaction-amount">${this.formatCurrency(transaction.amount)}</div>
            </div>
        `).join('');
    }

    renderAllTransactions() {
        this.filteredTransactions = [...this.transactions];
        this.updateAllTransactionsDisplay();
    }

    filterTransactions() {
        const selectedCategory = document.getElementById('filterCategory').value;
        
        if (selectedCategory === '') {
            this.filteredTransactions = [...this.transactions];
        } else {
            this.filteredTransactions = this.transactions.filter(t => t.category === selectedCategory);
        }
        
        this.updateAllTransactionsDisplay();
    }

    resetFilter() {
        document.getElementById('filterCategory').value = '';
        this.filteredTransactions = [...this.transactions];
        this.updateAllTransactionsDisplay();
    }

    updateAllTransactionsDisplay() {
        const totalAmount = this.filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
        
        document.getElementById('totalTransactionsCount').textContent = `${this.filteredTransactions.length} transaksi`;
        document.getElementById('totalAmount').textContent = this.formatCurrency(totalAmount);

        const container = document.getElementById('allTransactionsList');
        
        if (this.filteredTransactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h3>Tidak ada transaksi</h3>
                    <p>Belum ada transaksi yang sesuai dengan filter</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredTransactions.map(transaction => `
            <div class="all-transaction-item" data-id="${transaction.id}">
                <div class="all-transaction-icon category-${transaction.category}">
                    ${this.getCategoryIcon(transaction.category)}
                </div>
                <div class="all-transaction-details">
                    <div class="all-transaction-title">${transaction.description}</div>
                    <div class="all-transaction-category">${this.getCategoryName(transaction.category)}</div>
                    <div class="all-transaction-date">${this.formatDate(transaction.date)}</div>
                </div>
                <div class="all-transaction-amount">${this.formatCurrency(transaction.amount)}</div>
                <div class="all-transaction-actions">
                    <button class="edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" title="Hapus"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');

        // Add event listeners for edit and delete
        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.closest('.all-transaction-item').getAttribute('data-id');
                this.openEditModal(id);
            });
        });
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.closest('.all-transaction-item').getAttribute('data-id');
                this.deleteTransactionConfirm(id);
            });
        });
    }

    openEditModal(id) {
        const transaction = this.transactions.find(t => t.id == id);
        if (!transaction) return;
        
        const editAmountInput = document.getElementById('editAmount');
        editAmountInput.value = transaction.amount;
        editAmountInput.dataset.numericValue = transaction.amount;
        
        document.getElementById('editCategory').value = transaction.category;
        document.getElementById('editDescription').value = transaction.description;
        document.getElementById('editDate').value = transaction.date;
        document.getElementById('editTransactionModal').classList.add('active');
        this.editingTransactionId = id;
    }

    closeEditModal() {
        document.getElementById('editTransactionModal').classList.remove('active');
        this.editingTransactionId = null;
        
        const editAmountInput = document.getElementById('editAmount');
        editAmountInput.value = '';
        editAmountInput.dataset.numericValue = '';
    }

    handleEditFormSubmit(e) {
        e.preventDefault();
        const id = this.editingTransactionId;
        const idx = this.transactions.findIndex(t => t.id == id);
        if (idx === -1) return;
        
        const formData = new FormData(e.target);
        const amount = this.getNumericValue(document.getElementById('editAmount'));
        
        this.transactions[idx] = {
            ...this.transactions[idx],
            amount: amount,
            category: formData.get('category'),
            description: formData.get('description'),
            date: formData.get('date')
        };
        
        this.saveTransactions();
        this.updateDashboard();
        this.renderTransactions();
        this.updateChart();
        this.closeEditModal();
        this.showNotification('Transaksi berhasil diupdate!');
        
        if (document.getElementById('calendarModal').classList.contains('active')) {
            this.renderCalendar();
        }
        
        if (document.getElementById('allTransactionsModal').classList.contains('active')) {
            this.renderAllTransactions();
        }
    }

    deleteTransactionConfirm(id) {
        if (confirm('Yakin ingin menghapus transaksi ini?')) {
            this.deleteTransaction(Number(id));
        }
    }

    getTransactionsByDate(date) {
        return this.transactions.filter(t => t.date === date);
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const amount = this.getNumericValue(document.getElementById('amount'));
        
        const transaction = {
            id: Date.now(),
            amount: amount,
            category: formData.get('category'),
            description: formData.get('description'),
            date: formData.get('date'),
            timestamp: new Date().toISOString()
        };

        this.addTransaction(transaction);
        this.closeModal();
    }

    addTransaction(transaction) {
        this.transactions.unshift(transaction);
        this.saveTransactions();
        this.updateDashboard();
        this.renderTransactions();
        this.updateChart();
        this.showNotification('Transaksi berhasil ditambahkan!');
        
        if (document.getElementById('calendarModal').classList.contains('active')) {
            this.renderCalendar();
        }
        
        if (document.getElementById('allTransactionsModal').classList.contains('active')) {
            this.renderAllTransactions();
        }
    }

    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveTransactions();
        this.updateDashboard();
        this.renderTransactions();
        this.updateChart();
        this.showNotification('Transaksi berhasil dihapus!');
        
        if (document.getElementById('calendarModal').classList.contains('active')) {
            this.renderCalendar();
        }
        
        if (document.getElementById('allTransactionsModal').classList.contains('active')) {
            this.renderAllTransactions();
        }
    }

    saveTransactions() {
        localStorage.setItem('uangku_transactions', JSON.stringify(this.transactions));
    }

    updateDashboard() {
        const todayDate = new Date();
        const todayYear = todayDate.getFullYear();
        const todayMonth = String(todayDate.getMonth() + 1).padStart(2, '0');
        const todayDay = String(todayDate.getDate()).padStart(2, '0');
        const today = `${todayYear}-${todayMonth}-${todayDay}`;
        
        const weekStart = this.getWeekStart();
        const monthStart = this.getMonthStart();

        const todayAmount = this.getTotalByDateRange(today, today);
        const weekAmount = this.getTotalByDateRange(weekStart, today);
        const monthAmount = this.getTotalByDateRange(monthStart, today);

        document.getElementById('todayAmount').textContent = this.formatCurrency(todayAmount);
        document.getElementById('weekAmount').textContent = this.formatCurrency(weekAmount);
        document.getElementById('monthAmount').textContent = this.formatCurrency(monthAmount);
    }

    getTotalByDateRange(startDate, endDate) {
        return this.transactions
            .filter(t => t.date >= startDate && t.date <= endDate)
            .reduce((sum, t) => sum + t.amount, 0);
    }

    getWeekStart() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        
        const year = monday.getFullYear();
        const month = String(monday.getMonth() + 1).padStart(2, '0');
        const day = String(monday.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getMonthStart() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}-01`;
    }

    renderTransactions() {
        const container = document.getElementById('transactionsList');
        const recentTransactions = this.transactions.slice(0, 5);

        if (recentTransactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h3>Belum ada transaksi</h3>
                    <p>Mulai mencatat pengeluaran Anda hari ini</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recentTransactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-icon category-${transaction.category}">
                    ${this.getCategoryIcon(transaction.category)}
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${transaction.description}</div>
                    <div class="transaction-category">${this.getCategoryName(transaction.category)}</div>
                    <div class="transaction-date">${this.formatDate(transaction.date)}</div>
                </div>
                <div class="transaction-amount">${this.formatCurrency(transaction.amount)}</div>
            </div>
        `).join('');
    }

    getCategoryIcon(category) {
        const icons = {
            makanan: '<i class="fas fa-utensils"></i>',
            transport: '<i class="fas fa-car"></i>',
            belanja: '<i class="fas fa-shopping-bag"></i>',
            hiburan: '<i class="fas fa-gamepad"></i>',
            kesehatan: '<i class="fas fa-heartbeat"></i>',
            pendidikan: '<i class="fas fa-graduation-cap"></i>',
            lainnya: '<i class="fas fa-ellipsis-h"></i>'
        };
        return icons[category] || icons.lainnya;
    }

    getCategoryName(category) {
        const names = {
            makanan: 'Makanan & Minuman',
            transport: 'Transportasi',
            belanja: 'Belanja',
            hiburan: 'Hiburan',
            kesehatan: 'Kesehatan',
            pendidikan: 'Pendidikan',
            lainnya: 'Lainnya'
        };
        return names[category] || 'Lainnya';
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Hari ini';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Kemarin';
        } else {
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short'
            });
        }
    }

    initChart() {
        const ctx = document.getElementById('expenseChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#4ade80',
                        '#fbbf24',
                        '#3b82f6',
                        '#ec4899',
                        '#10b981',
                        '#ef4444',
                        '#8b5cf6'
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                family: 'Inter',
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0
                                }).format(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        this.updateChart();
    }

    updateChart() {
        const categoryData = {};
        
        const monthStart = this.getMonthStart();
        const today = new Date().toISOString().split('T')[0];
        const monthTransactions = this.transactions.filter(t => 
            t.date >= monthStart && t.date <= today
        );

        monthTransactions.forEach(transaction => {
            const category = this.getCategoryName(transaction.category);
            categoryData[category] = (categoryData[category] || 0) + transaction.amount;
        });

        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.update();
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            font-weight: 500;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new UangKuApp();
    document.getElementById('closeEditModal').addEventListener('click', () => app.closeEditModal());
    document.getElementById('cancelEditBtn').addEventListener('click', () => app.closeEditModal());
    document.getElementById('editTransactionForm').addEventListener('submit', (e) => app.handleEditFormSubmit(e));
});

function addSampleData() {
    const sampleTransactions = [
        {
            id: Date.now() - 4,
            amount: 25000,
            category: 'makanan',
            description: 'Makan siang di warteg',
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        },
        {
            id: Date.now() - 3,
            amount: 15000,
            category: 'transport',
            description: 'Ojek online',
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        },
        {
            id: Date.now() - 2,
            amount: 50000,
            category: 'belanja',
            description: 'Belanja kebutuhan rumah',
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        },
        {
            id: Date.now() - 1,
            amount: 75000,
            category: 'hiburan',
            description: 'Nonton film',
            date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        }
    ];

    if (!localStorage.getItem('uangku_transactions')) {
        localStorage.setItem('uangku_transactions', JSON.stringify(sampleTransactions));
    }
}

addSampleData(); 