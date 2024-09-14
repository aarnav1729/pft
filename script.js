document.addEventListener('DOMContentLoaded', () => {
    // Variable declarations
    const daysContainer = document.getElementById('days-container');
    const totalExpenditureEl = document.getElementById('total-expenditure');
    const totalIncomeEl = document.getElementById('total-income');
    const differenceEl = document.getElementById('difference');
    const timeframeSelect = document.getElementById('timeframe');
    const dayInput = document.getElementById('day-input');
    const monthInput = document.getElementById('month-input');
    const yearInput = document.getElementById('year-input');
    const daySelect = document.getElementById('day-select');
    const monthSelect = document.getElementById('month-select');
    const yearSelect = document.getElementById('year-select');

    let incomeData = { dad: 0, webstax: 0, premier: 0 };
    let expenditureData = { bar: 0, cash: 0, gpay: 0 };
    let totalExpenditure = 0;
    let totalIncome = 0;

    // Initialize charts
    const incomePieChartCtx = document.getElementById('incomePieChart').getContext('2d');
    const expenditurePieChartCtx = document.getElementById('expenditurePieChart').getContext('2d');
    const incomeExpenditureLineChartCtx = document.getElementById('incomeExpenditureLineChart').getContext('2d');
    const incomeVsExpenditurePieChartCtx = document.getElementById('incomeVsExpenditurePieChart').getContext('2d');

    const incomePieChart = new Chart(incomePieChartCtx, {
        type: 'pie',
        data: {
            labels: ['Dad', 'Webstax', 'Premier'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#4F46E5', '#10B981', '#F59E0B'],
            }],
        },
        options: {
            responsive: true,
        },
    });

    const expenditurePieChart = new Chart(expenditurePieChartCtx, {
        type: 'pie',
        data: {
            labels: ['Bar', 'Cash', 'GPay'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#EF4444', '#3B82F6', '#FBBF24'],
            }],
        },
        options: {
            responsive: true,
        },
    });

    const incomeExpenditureLineChart = new Chart(incomeExpenditureLineChartCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Income',
                    data: [],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    fill: true,
                },
                {
                    label: 'Expenditure',
                    data: [],
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    fill: true,
                }
            ],
        },
        options: {
            responsive: true,
        },
    });

    const incomeVsExpenditurePieChart = new Chart(incomeVsExpenditurePieChartCtx, {
        type: 'pie',
        data: {
            labels: ['Total Income', 'Total Expenditure'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#10B981', '#EF4444'],
            }],
        },
        options: {
            responsive: true,
        },
    });

    // Generate initial dates
    generateDates('2024-09-01', 30);

    // Fetch data from server
    fetchData();

    // Event listeners
    timeframeSelect.addEventListener('change', updateView);
    daySelect.addEventListener('change', filterData);
    monthSelect.addEventListener('change', filterData);
    yearSelect.addEventListener('change', filterData);

    // Function definitions
    async function fetchData() {
        try {
            const response = await fetch('http://localhost:3000/fetch');
            const finances = await response.json();
            finances.forEach(finance => {
                const date = new Date(finance.date);
                const formattedDate = date.toISOString().split('T')[0];
                
                let dayCard = document.querySelector(`.day-card[data-date='${formattedDate}']`);
                if (!dayCard) {
                    dayCard = addDayEntry(date);
                }
                populateEntries(dayCard, finance.entries);
            });
            updateTotals();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    async function saveData(date, entries) {
        try {
            await fetch('http://localhost:3000/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, entries })
            });
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    function generateDates(startDate, numDays) {
        const date = new Date(startDate);
        for (let i = 0; i < numDays; i++) {
            addDayEntry(new Date(date));
            date.setDate(date.getDate() + 1);
        }
    }

    function addDayEntry(date) {
        const dayCard = document.createElement('div');
        dayCard.classList.add('bg-white', 'border', 'rounded-lg', 'shadow', 'p-6', 'space-y-4', 'day-card');
        dayCard.dataset.date = date.toISOString().split('T')[0];

        const dateLabel = document.createElement('h4');
        dateLabel.classList.add('text-lg', 'font-semibold', 'mb-2');
        dateLabel.textContent = date.toLocaleDateString('en-GB');
        dayCard.appendChild(dateLabel);

        const incomeContainer = createEntryContainer('Income', ['Dad', 'Webstax', 'Premier']);
        const expenditureContainer = createEntryContainer('Expenditure', ['Bar', 'Cash', 'GPay']);

        dayCard.appendChild(incomeContainer);
        dayCard.appendChild(expenditureContainer);

        daysContainer.appendChild(dayCard);
        return dayCard;
    }

    function populateEntries(dayCard, entries) {
        const incomeEntries = entries.filter(e => ['dad', 'webstax', 'premier'].includes(e.method));
        const expenditureEntries = entries.filter(e => ['bar', 'cash', 'gpay'].includes(e.method));

        const incomeContainer = dayCard.querySelector('.income-container');
        const expenditureContainer = dayCard.querySelector('.expenditure-container');

        incomeEntries.forEach(entry => addEntry(incomeContainer.querySelector('.entry-list'), ['Dad', 'Webstax', 'Premier'], entry.amount, entry.method));
        expenditureEntries.forEach(entry => addEntry(expenditureContainer.querySelector('.entry-list'), ['Bar', 'Cash', 'GPay'], entry.amount, entry.method));
    }

    function createEntryContainer(title, options) {
        const container = document.createElement('div');
        container.classList.add('mb-4', `${title.toLowerCase()}-container`);

        const titleLabel = document.createElement('h5');
        titleLabel.classList.add('text-md', 'font-semibold', 'mb-2');
        titleLabel.textContent = `${title} Entries`;
        container.appendChild(titleLabel);

        const entryList = document.createElement('div');
        entryList.classList.add('space-y-2', 'entry-list');
        container.appendChild(entryList);

        const addEntryButton = document.createElement('button');
        addEntryButton.classList.add('px-4', 'py-2', 'bg-blue-600', 'text-white', 'rounded-md', 'hover:bg-blue-700', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
        addEntryButton.textContent = `Add ${title} Entry`;
        addEntryButton.addEventListener('click', () => {
            addEntry(entryList, options);
            updateTotals();
            saveData(container.closest('.day-card').dataset.date, collectEntriesFromDay(container.closest('.day-card')));
        });
        container.appendChild(addEntryButton);

        return container;
    }

    function addEntry(entryList, options, amount = 0, method = options[0].toLowerCase()) {
        const entryRow = document.createElement('div');
        entryRow.classList.add('flex', 'items-center', 'space-x-4', 'mt-2', 'entry-row');

        const amountInput = document.createElement('input');
        amountInput.type = 'number';
        amountInput.placeholder = 'Amount';
        amountInput.value = amount;
        amountInput.classList.add('border-gray-300', 'focus:ring-blue-500', 'focus:border-blue-500', 'rounded-md', 'w-1/2', 'amount-input', 'py-2', 'px-3');
        amountInput.addEventListener('input', () => {
            updateTotals();
            saveData(entryList.closest('.day-card').dataset.date, collectEntriesFromDay(entryList.closest('.day-card')));
        });
        entryRow.appendChild(amountInput);

        const methodSelect = document.createElement('select');
        methodSelect.classList.add('border-gray-300', 'focus:ring-blue-500', 'focus:border-blue-500', 'rounded-md', 'w-1/2', 'method-select', 'py-2', 'px-3');
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.toLowerCase();
            opt.textContent = option;
            opt.selected = option.toLowerCase() === method;
            methodSelect.appendChild(opt);
        });
        methodSelect.addEventListener('change', () => {
            updateTotals();
            saveData(entryList.closest('.day-card').dataset.date, collectEntriesFromDay(entryList.closest('.day-card')));
        });
        entryRow.appendChild(methodSelect);

        const removeButton = document.createElement('button');
        removeButton.classList.add('text-red-500', 'hover:text-red-700', 'ml-2', 'focus:outline-none');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => {
            entryRow.remove();
            updateTotals();
            saveData(entryList.closest('.day-card').dataset.date, collectEntriesFromDay(entryList.closest('.day-card')));
        });
        entryRow.appendChild(removeButton);

        entryList.appendChild(entryRow);
    }

    function collectEntriesFromDay(dayCard) {
        const entries = [];
        dayCard.querySelectorAll('.entry-row').forEach(entryRow => {
            const amount = parseFloat(entryRow.querySelector('.amount-input').value) || 0;
            const method = entryRow.querySelector('.method-select').value;
            entries.push({ amount, method });
        });
        return entries;
    }

    function updateTotals() {
        totalExpenditure = 0;
        totalIncome = 0;
        incomeData = { dad: 0, webstax: 0, premier: 0 };
        expenditureData = { bar: 0, cash: 0, gpay: 0 };

        daysContainer.querySelectorAll('.day-card:not(.hidden)').forEach(dayCard => {
            dayCard.querySelectorAll('.entry-row').forEach(entryRow => {
                const amount = parseFloat(entryRow.querySelector('.amount-input').value) || 0;
                const method = entryRow.querySelector('.method-select').value;

                if (['dad', 'webstax', 'premier'].includes(method)) {
                    incomeData[method] += amount;
                    totalIncome += amount;
                } else if (['bar', 'cash', 'gpay'].includes(method)) {
                    expenditureData[method] += amount;
                    totalExpenditure += amount;
                }
            });
        });

        totalExpenditureEl.textContent = totalExpenditure.toFixed(2);
        totalIncomeEl.textContent = totalIncome.toFixed(2);
        differenceEl.textContent = (totalIncome - totalExpenditure).toFixed(2);

        // Update charts
        incomePieChart.data.datasets[0].data = [incomeData.dad, incomeData.webstax, incomeData.premier];
        incomePieChart.update();

        expenditurePieChart.data.datasets[0].data = [expenditureData.bar, expenditureData.cash, expenditureData.gpay];
        expenditurePieChart.update();

        // Prepare data for line chart
        const dates = [];
        const incomeValues = [];
        const expenditureValues = [];

        daysContainer.querySelectorAll('.day-card:not(.hidden)').forEach(dayCard => {
            const date = dayCard.dataset.date;
            dates.push(date);

            let dailyIncome = 0;
            let dailyExpenditure = 0;

            dayCard.querySelectorAll('.entry-row').forEach(entryRow => {
                const amount = parseFloat(entryRow.querySelector('.amount-input').value) || 0;
                const method = entryRow.querySelector('.method-select').value;

                if (['dad', 'webstax', 'premier'].includes(method)) {
                    dailyIncome += amount;
                } else if (['bar', 'cash', 'gpay'].includes(method)) {
                    dailyExpenditure += amount;
                }
            });

            incomeValues.push(dailyIncome);
            expenditureValues.push(dailyExpenditure);
        });

        incomeExpenditureLineChart.data.labels = dates;
        incomeExpenditureLineChart.data.datasets[0].data = incomeValues;
        incomeExpenditureLineChart.data.datasets[1].data = expenditureValues;
        incomeExpenditureLineChart.update();

        incomeVsExpenditurePieChart.data.datasets[0].data = [totalIncome, totalExpenditure];
        incomeVsExpenditurePieChart.update();
    }

    function updateView() {
        const selectedView = timeframeSelect.value;
        dayInput.classList.add('hidden');
        monthInput.classList.add('hidden');
        yearInput.classList.add('hidden');

        if (selectedView === 'day') {
            dayInput.classList.remove('hidden');
        } else if (selectedView === 'month') {
            monthInput.classList.remove('hidden');
        } else if (selectedView === 'year') {
            yearInput.classList.remove('hidden');
        }

        filterData();
    }

    function filterData() {
        const selectedView = timeframeSelect.value;
        const selectedDate = daySelect.value;
        const selectedMonth = monthSelect.value;
        const selectedYear = yearSelect.value;

        daysContainer.querySelectorAll('.day-card').forEach(dayCard => {
            const date = new Date(dayCard.dataset.date);
            let showCard = false;

            if (selectedView === 'day' && daySelect.value && dayCard.dataset.date === selectedDate) {
                showCard = true;
            } else if (selectedView === 'month' && monthSelect.value && dayCard.dataset.date.startsWith(selectedMonth)) {
                showCard = true;
            } else if (selectedView === 'year' && yearSelect.value && date.getFullYear() === parseInt(selectedYear)) {
                showCard = true;
            } else if (selectedView === 'day' && !daySelect.value) {
                showCard = true;
            } else if (selectedView === 'month' && !monthSelect.value) {
                showCard = true;
            } else if (selectedView === 'year' && !yearSelect.value) {
                showCard = true;
            }

            if (showCard) {
                dayCard.classList.remove('hidden');
            } else {
                dayCard.classList.add('hidden');
            }
        });

        updateTotals();
    }
});