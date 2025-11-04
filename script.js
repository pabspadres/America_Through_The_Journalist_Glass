// Historical Newspaper Visualization JavaScript
let csvData = [];
let currentPeriod = '1770-1795';
let currentState = null;

// State mappings for different periods
const stateVisibility = {
    '1770-1795': ['Virginia', 'Rhode Island', 'Pennsylvania', 'New Hampshire', 'Massachusetts', 'New York'],
    '1796-1809': ['Virginia', 'Rhode Island', 'Pennsylvania', 'New Hampshire', 'Delaware', 'Massachusetts', 'Kentucky', 'Washington City [D.C.]']
};

// PNG mappings
const pngMappings = {
    '1770-1795': {
        'default': 'Blank1770',
        'Virginia': 'Virginia1770',
        'Rhode Island': 'RhodeIsland1770',
        'Pennsylvania': 'Pennsylvania1770',
        'New Hampshire': 'NewHampshire1770',
        'Massachusetts': 'Massachusetts1770',
        'New York': 'NewYork1770'
    },
    '1796-1809': {
        'default': 'Blank1796',
        'Virginia': 'Virginia1796',
        'Rhode Island': 'RhodeIsland1796',
        'Pennsylvania': 'Pennsylvania1796',
        'New Hampshire': 'NewHampshire1796',
        'Delaware': 'Delaware1796',
        'Massachusetts': 'Massachusetts1796',
        'Kentucky': 'Kentucky1796',
        'Washington City [D.C.]': 'Washington1796'
    }
};

// Place mappings for filtering
const placeMappings = {
    '1770-1795': {
        'Virginia': ['Lexington [Ky.]', 'Shepherdstown, Va. [W. Va.]', 'Williamsburg [Va.]', 'Williamsburg, Va.'],
        'Rhode Island': ['Newport [R.I.]'],
        'Pennsylvania': ['Philadelphia [Pa.]'],
        'New Hampshire': ['[Portsmouth, N.H.]', 'Portsmouth [N.H.]', 'Portsmouth, N.H.'],
        'Massachusetts': ['Boston [Mass.]'],
        'New York': ['New York [N.Y.]', 'New-York [N.Y.]']
    },
    '1796-1809': {
        'Virginia': ['Shepherdstown, Va. [W. Va.]', 'Williamsburg [Va.]', 'Alexandria [Va.]', 'Lynchburg [Va.]', 'Martinsburg, Va.', 'Norfolk [Va.]', 'Richmond, Va.', 'Wheeling, Va. [W. Va.]', 'Williamsburg, Va.'],
        'Rhode Island': ['Warren, R.I.', 'Providence [R.I.]', 'Newport, R.I.', 'Newport [R.I.]'],
        'Pennsylvania': ['Philadelphia [Pa.]'],
        'New Hampshire': ['[Portsmouth, N.H.]', 'Portsmouth [N.H.]', 'Portsmouth, N.H.'],
        'Delaware': ['Dover, Del.', 'Wilmington [Del.]', 'Wilmington, Del.'],
        'Massachusetts': ['Boston [Mass.]', 'Portland [Me.]', 'Portland, Me.'],
        'Kentucky': ['[Lexington, Ky.]', 'Lexington [Ky.]'],
        'Washington City [D.C.]': ['Washington City [D.C.]']
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadCSVData();
    setupEventListeners();
    updateStateButtonVisibility();
    updatePNG();
    updateTable();
});

// Load CSV data
async function loadCSVData() {
    try {
        const response = await fetch('data.csv');
        const csvText = await response.text();
        csvData = parseCSV(csvText);
        console.log('CSV data loaded:', csvData.length, 'rows');
        updateTable();
    } catch (error) {
        console.error('Error loading CSV data:', error);
    }
}

// Parse CSV data
function parseCSV(text) {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = parseCSVLine(lines[i]);
        if (values.length >= headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] ? values[index].trim() : '';
            });
            data.push(row);
        }
    }
    
    return data;
}

// Parse CSV line handling quoted values
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

// Setup event listeners
function setupEventListeners() {
    // Time button listeners
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all time buttons
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            currentPeriod = this.dataset.period;
            currentState = null; // Reset state selection
            
            // Remove active class from all state buttons
            document.querySelectorAll('.state-btn').forEach(b => b.classList.remove('active'));
            
            // Adjust state button position based on time period
            adjustStateButtonPosition();
            
            updateStateButtonVisibility();
            updatePNG();
            updateTable();
        });
    });
    
    // State button listeners
    document.querySelectorAll('.state-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.classList.contains('hidden')) return;
            
            // Toggle state selection
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                currentState = null;
            } else {
                // Remove active class from all state buttons
                document.querySelectorAll('.state-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');
                currentState = this.dataset.state;
            }
            
            updatePNG();
            updateTable();
        });
    });
}

// Update state button visibility based on current period
function updateStateButtonVisibility() {
    const visibleStates = stateVisibility[currentPeriod];
    
    document.querySelectorAll('.state-btn').forEach(btn => {
        const state = btn.dataset.state;
        if (visibleStates.includes(state)) {
            btn.classList.remove('hidden');
        } else {
            btn.classList.add('hidden');
            btn.classList.remove('active');
        }
    });
}

// Update PNG display
function updatePNG() {
    const displayImg = document.getElementById('displayPng');
    let pngName;
    
    if (currentState && pngMappings[currentPeriod][currentState]) {
        pngName = pngMappings[currentPeriod][currentState];
    } else {
        pngName = pngMappings[currentPeriod]['default'];
    }
    
    const newSrc = `${currentPeriod}/${pngName}.png`;
    
    // Sharp, instant swap - no transition
    displayImg.src = newSrc;
}

// Update publications table
function updateTable() {
    const tableBody = document.getElementById('publicationsTableBody');
    tableBody.innerHTML = '';
    
    if (csvData.length === 0) {
        return;
    }
    
    // Filter data by period
    let filteredData = filterByPeriod(csvData);
    
    // Filter by state if selected
    if (currentState) {
        filteredData = filterByState(filteredData);
    }
    
    // Sort by date (ascending)
    filteredData.sort((a, b) => {
        const dateA = new Date(a.issue_date);
        const dateB = new Date(b.issue_date);
        return dateA - dateB;
    });
    
    // Populate table
    filteredData.forEach(row => {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        
        // Display date as plain text without hyperlinks
        td.textContent = row.issue_date;
        
        tr.appendChild(td);
        tableBody.appendChild(tr);
    });
}

// Filter data by period
function filterByPeriod(data) {
    const [startYear, endYear] = currentPeriod.split('-').map(year => parseInt(year));
    
    return data.filter(row => {
        if (!row.issue_date) return false;
        const year = parseInt(row.issue_date.substring(0, 4));
        return year >= startYear && year <= endYear;
    });
}

// Filter data by state
function filterByState(data) {
    const places = placeMappings[currentPeriod][currentState];
    if (!places) return data;
    
    return data.filter(row => {
        if (!row.place_of_publication) return false;
        return places.some(place => 
            row.place_of_publication.includes(place)
        );
    });
}

// Utility function to scroll to PNG area
function scrollToPNG() {
    const pngContainer = document.querySelector('.png-display-container');
    if (pngContainer) {
        pngContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
}

// Adjust state button position based on time period
function adjustStateButtonPosition() {
    const stateButtonsContainer = document.querySelector('.state-buttons-container');
    
    if (currentPeriod === '1770-1795') {
        // Keep original position for 1770-1795
        stateButtonsContainer.style.top = '50%';
    } else if (currentPeriod === '1796-1809') {
        // Move down for 1796-1809
        stateButtonsContainer.style.top = '58%';
    }
}

// Export functions for debugging
window.debugApp = {
    csvData: () => csvData,
    currentPeriod: () => currentPeriod,
    currentState: () => currentState,
    placeMappings: placeMappings,
    pngMappings: pngMappings
};
