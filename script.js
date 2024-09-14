document.addEventListener('DOMContentLoaded', () => {
    // Variable declarations
    const daysContainer = document.getElementById('days-container');
    const totalExpenditureEl = document.getElementById('total-expenditure');
    const totalIncomeEl = document.getElementById('total-income');
    const differenceEl = document.getElementById('difference');
    const averageSpendingEl = document.getElementById('average-spending');
    const highestExpenseEl = document.getElementById('highest-expense');
    const timeframeSelect = document.getElementById('timeframe');
    const dayInput = document.getElementById('day-input');
    const monthInput = document.getElementById('month-input');
    const yearInput = document.getElementById('year-input');
    const daySelect = document.getElementById('day-select');
    const monthSelect = document.getElementById('month-select');
    const yearSelect = document.getElementById('year-select');

    let incomeCategories = ['Dad', 'Webstax', 'Premier'];
    let expenditureCategories = ['Bar', 'Cash', 'GPay'];
    let incomeData = {};
    let expenditureData = {};
    let totalExpenditure = 0;
    let totalIncome = 0;
    let highestExpense = 0;
    let averageSpending = 0;
    let monthlyBudget = 0;

    // Initialize amCharts
    am4core.useTheme(am4themes_animated);

    // Charts variables
    let incomePieChart, expenditurePieChart, incomeExpenditureLineChart, incomeVsExpenditurePieChart;

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
            const response = await fetch('https://pft-pzif.onrender.com/fetch');
            const finances = await response.json();

            finances.forEach(finance => {
                const dateStr = finance.date;
                const formattedDate = dateStr;

                let dayCard = document.querySelector(`.day-card[data-date='${formattedDate}']`);
                if (!dayCard) {
                    dayCard = addDayEntry(new Date(formattedDate));
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
            await fetch('https://pft-pzif.onrender.com/save', {
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

        const incomeContainer = createEntryContainer('Income', incomeCategories);
        const expenditureContainer = createEntryContainer('Expenditure', expenditureCategories);

        dayCard.appendChild(incomeContainer);
        dayCard.appendChild(expenditureContainer);

        daysContainer.appendChild(dayCard);
        return dayCard;
    }

    function populateEntries(dayCard, entries) {
        const incomeEntries = entries.filter(e => incomeCategories.includes(capitalizeFirstLetter(e.method)));
        const expenditureEntries = entries.filter(e => expenditureCategories.includes(capitalizeFirstLetter(e.method)));

        const incomeContainer = dayCard.querySelector('.income-container');
        const expenditureContainer = dayCard.querySelector('.expenditure-container');

        incomeEntries.forEach(entry => addEntry(incomeContainer.querySelector('.entry-list'), incomeCategories, entry.amount, capitalizeFirstLetter(entry.method)));
        expenditureEntries.forEach(entry => addEntry(expenditureContainer.querySelector('.entry-list'), expenditureCategories, entry.amount, capitalizeFirstLetter(entry.method)));
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
        addEntryButton.classList.add('px-4', 'py-2', title === 'Income' ? 'bg-green-600' : 'bg-red-600', 'text-white', 'rounded-md', 'hover:bg-green-700', 'focus:outline-none', 'focus:ring-2', 'focus:ring-green-500');
        addEntryButton.textContent = `Add ${title} Entry`;
        addEntryButton.addEventListener('click', () => {
            addEntry(entryList, options);
            updateTotals();
        });
        container.appendChild(addEntryButton);

        return container;
    }

    function addEntry(entryList, options, amount = 0, method = options[0]) {
        const entryRow = document.createElement('div');
        entryRow.classList.add('flex', 'items-center', 'space-x-4', 'mt-2', 'entry-row');

        const amountInput = document.createElement('input');
        amountInput.type = 'number';
        amountInput.placeholder = 'Amount';
        amountInput.value = amount;
        amountInput.classList.add('border-gray-300', 'focus:ring-blue-500', 'focus:border-blue-500', 'rounded-md', 'w-1/2', 'amount-input', 'py-2', 'px-3');
        amountInput.addEventListener('input', () => {
            updateTotals();
            const dayCard = entryList.closest('.day-card');
            const date = dayCard.dataset.date;
            const entries = collectEntriesFromDay(dayCard);
            saveData(date, entries);
        });
        entryRow.appendChild(amountInput);

        const methodSelect = document.createElement('select');
        methodSelect.classList.add('border-gray-300', 'focus:ring-blue-500', 'focus:border-blue-500', 'rounded-md', 'w-1/2', 'method-select', 'py-2', 'px-3');
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.toLowerCase();
            opt.textContent = option;
            opt.selected = option === method;
            methodSelect.appendChild(opt);
        });
        methodSelect.addEventListener('change', () => {
            updateTotals();
            const dayCard = entryList.closest('.day-card');
            const date = dayCard.dataset.date;
            const entries = collectEntriesFromDay(dayCard);
            saveData(date, entries);
        });
        entryRow.appendChild(methodSelect);

        const removeButton = document.createElement('button');
        removeButton.classList.add('text-red-500', 'hover:text-red-700', 'ml-2', 'focus:outline-none');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => {
            entryRow.remove();
            updateTotals();
            const dayCard = entryList.closest('.day-card');
            const date = dayCard.dataset.date;
            const entries = collectEntriesFromDay(dayCard);
            saveData(date, entries);
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
        highestExpense = 0;
        let totalDays = 0;
        let totalDailySpending = 0;

        incomeData = {};
        expenditureData = {};

        incomeCategories.forEach(category => incomeData[category.toLowerCase()] = 0);
        expenditureCategories.forEach(category => expenditureData[category.toLowerCase()] = 0);

        daysContainer.querySelectorAll('.day-card:not(.hidden)').forEach(dayCard => {
            let dailyExpenditure = 0;
            let hasEntries = false;

            dayCard.querySelectorAll('.entry-row').forEach(entryRow => {
                const amount = parseFloat(entryRow.querySelector('.amount-input').value) || 0;
                const method = entryRow.querySelector('.method-select').value;

                if (incomeCategories.map(c => c.toLowerCase()).includes(method)) {
                    incomeData[method] += amount;
                    totalIncome += amount;
                } else if (expenditureCategories.map(c => c.toLowerCase()).includes(method)) {
                    expenditureData[method] += amount;
                    totalExpenditure += amount;
                    dailyExpenditure += amount;
                }
                hasEntries = true;
            });

            if (hasEntries) {
                totalDays++;
                totalDailySpending += dailyExpenditure;
                if (dailyExpenditure > highestExpense) {
                    highestExpense = dailyExpenditure;
                }
            }
        });

        averageSpending = totalDays ? (totalDailySpending / totalDays).toFixed(2) : 0;

        totalExpenditureEl.textContent = totalExpenditure.toFixed(2);
        totalIncomeEl.textContent = totalIncome.toFixed(2);
        differenceEl.textContent = (totalIncome - totalExpenditure).toFixed(2);
        averageSpendingEl.textContent = averageSpending;
        highestExpenseEl.textContent = highestExpense.toFixed(2);

        // Update charts
        updateIncomePieChart();
        updateExpenditurePieChart();
        updateIncomeExpenditureLineChart();
        updateIncomeVsExpenditurePieChart();
    }

    function updateIncomePieChart() {
        if (incomePieChart) {
            incomePieChart.dispose();
        }

        incomePieChart = am4core.create("incomePieChart", am4charts.PieChart);
        incomePieChart.hiddenState.properties.opacity = 0; // this creates initial fade-in

        incomePieChart.data = incomeCategories.map(category => ({
            category: category,
            value: incomeData[category.toLowerCase()]
        }));

        let pieSeries = incomePieChart.series.push(new am4charts.PieSeries());
        pieSeries.dataFields.value = "value";
        pieSeries.dataFields.category = "category";

        // Custom colors with distinct colors for each category
        const incomeColors = [
            "#4e73df", // Blue
            "#1cc88a", // Green
            "#36b9cc", // Teal
            "#f6c23e", // Yellow
            "#e74a3b", // Red
            "#858796", // Gray
            "#fd7e14", // Orange
            "#6f42c1", // Purple
            "#20c997", // Cyan
            "#e83e8c"  // Pink
        ];

        pieSeries.colors.list = incomeColors.map(color => am4core.color(color));

        incomePieChart.legend = new am4charts.Legend();
    }

    function updateExpenditurePieChart() {
        if (expenditurePieChart) {
            expenditurePieChart.dispose();
        }

        expenditurePieChart = am4core.create("expenditurePieChart", am4charts.PieChart);
        expenditurePieChart.hiddenState.properties.opacity = 0;

        expenditurePieChart.data = expenditureCategories.map(category => ({
            category: category,
            value: expenditureData[category.toLowerCase()]
        }));

        let pieSeries = expenditurePieChart.series.push(new am4charts.PieSeries());
        pieSeries.dataFields.value = "value";
        pieSeries.dataFields.category = "category";

        // Custom colors with distinct colors for each category
        const expenditureColors = [
            "#e74a3b", // Red
            "#f6c23e", // Yellow
            "#1cc88a", // Green
            "#4e73df", // Blue
            "#36b9cc", // Teal
            "#858796", // Gray
            "#fd7e14", // Orange
            "#6f42c1", // Purple
            "#20c997", // Cyan
            "#e83e8c"  // Pink
        ];

        pieSeries.colors.list = expenditureColors.map(color => am4core.color(color));

        expenditurePieChart.legend = new am4charts.Legend();
    }

    // Update Income vs. Expenditure Line Chart
    function updateIncomeExpenditureLineChart() {
        if (incomeExpenditureLineChart) {
            incomeExpenditureLineChart.dispose();
        }

        incomeExpenditureLineChart = am4core.create("incomeExpenditureLineChart", am4charts.XYChart);

        const dates = [];
        const incomeValues = [];
        const expenditureValues = [];

        daysContainer.querySelectorAll('.day-card:not(.hidden)').forEach(dayCard => {
            const date = dayCard.dataset.date;
            let dailyIncome = 0;
            let dailyExpenditure = 0;

            dayCard.querySelectorAll('.entry-row').forEach(entryRow => {
                const amount = parseFloat(entryRow.querySelector('.amount-input').value) || 0;
                const method = entryRow.querySelector('.method-select').value;

                if (incomeCategories.map(c => c.toLowerCase()).includes(method)) {
                    dailyIncome += amount;
                } else if (expenditureCategories.map(c => c.toLowerCase()).includes(method)) {
                    dailyExpenditure += amount;
                }
            });

            dates.push(date);
            incomeValues.push({ date: new Date(date), value: dailyIncome });
            expenditureValues.push({ date: new Date(date), value: dailyExpenditure });
        });

        incomeExpenditureLineChart.data = incomeValues.map((incomeDataPoint, index) => {
            return {
                date: incomeDataPoint.date,
                income: incomeDataPoint.value,
                expenditure: expenditureValues[index].value
            };
        });

        // Create axes
        let dateAxis = incomeExpenditureLineChart.xAxes.push(new am4charts.DateAxis());
        let valueAxis = incomeExpenditureLineChart.yAxes.push(new am4charts.ValueAxis());

        // Create series for income
        let incomeSeries = incomeExpenditureLineChart.series.push(new am4charts.LineSeries());
        incomeSeries.dataFields.valueY = "income";
        incomeSeries.dataFields.dateX = "date";
        incomeSeries.name = "Income";
        incomeSeries.stroke = am4core.color("#4caf50");
        incomeSeries.fill = am4core.color("#4caf50");
        incomeSeries.strokeWidth = 2;
        incomeSeries.tooltipText = "{name}: [bold]{valueY}[/]";
        incomeSeries.tensionX = 0.8;

        // Create series for expenditure
        let expenditureSeries = incomeExpenditureLineChart.series.push(new am4charts.LineSeries());
        expenditureSeries.dataFields.valueY = "expenditure";
        expenditureSeries.dataFields.dateX = "date";
        expenditureSeries.name = "Expenditure";
        expenditureSeries.stroke = am4core.color("#e53935");
        expenditureSeries.fill = am4core.color("#e53935");
        expenditureSeries.strokeWidth = 2;
        expenditureSeries.tooltipText = "{name}: [bold]{valueY}[/]";
        expenditureSeries.tensionX = 0.8;

        // Add legend
        incomeExpenditureLineChart.legend = new am4charts.Legend();

        // Add cursor
        incomeExpenditureLineChart.cursor = new am4charts.XYCursor();
    }

    // Update Total Income vs. Expenditure Pie Chart
    function updateIncomeVsExpenditurePieChart() {
        if (incomeVsExpenditurePieChart) {
            incomeVsExpenditurePieChart.dispose();
        }

        incomeVsExpenditurePieChart = am4core.create("incomeVsExpenditurePieChart", am4charts.PieChart);
        incomeVsExpenditurePieChart.hiddenState.properties.opacity = 0;

        incomeVsExpenditurePieChart.data = [
            { category: "Total Income", value: totalIncome },
            { category: "Total Expenditure", value: totalExpenditure },
        ];

        let pieSeries = incomeVsExpenditurePieChart.series.push(new am4charts.PieSeries());
        pieSeries.dataFields.value = "value";
        pieSeries.dataFields.category = "category";

        // Custom colors
        pieSeries.colors.list = [
            am4core.color("#4caf50"),
            am4core.color("#e53935")
        ];

        incomeVsExpenditurePieChart.legend = new am4charts.Legend();
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

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
});