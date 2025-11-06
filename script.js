// Historical Newspaper Visualization JavaScript
let csvData = [];
let currentPeriod = '1796-1809';
let currentState = null;

// State mappings for different periods
const stateVisibility = {
    '1770-1795': ['Virginia', 'Rhode Island', 'Pennsylvania', 'New Hampshire', 'Massachusetts', 'New York'],
    '1796-1809': ['Virginia', 'Rhode Island', 'Pennsylvania', 'New Hampshire', 'Delaware', 'Massachusetts', 'Kentucky', 'Washington City [D.C.]', 'New York']
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
        'Washington City [D.C.]': 'Washington1796',
        'New York': 'NewYork1796'  // Now using the proper NewYork1796.png file
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
        'Washington City [D.C.]': ['Washington City [D.C.]'],
        'New York': ['New York [N.Y.]', 'New-York [N.Y.]', 'Albany [N.Y.]']
    }
};

// Modal filtering state
let selectedDecade = '';
let selectedCategory = '';

// State selection function for image map (global scope)
window.selectState = function(stateName) {
    console.log('State clicked:', stateName); // Debug log
    console.log('Current period:', currentPeriod);
    console.log('Available states for period:', stateVisibility[currentPeriod]);
    console.log('PNG mappings for state:', pngMappings[currentPeriod][stateName]);
    
    // Check if state is valid for current period
    if (!stateVisibility[currentPeriod].includes(stateName)) {
        console.log('State not available in current period:', stateName);
        return false;
    }
    
    // Toggle state selection
    if (currentState === stateName) {
        currentState = null;
        hideModal();
        console.log('State deselected');
    } else {
        currentState = stateName;
        console.log('State selected:', stateName);
        showModal(stateName);
    }
    
    updatePNG();
    updateTable();
    
    // Prevent default link behavior
    return false;
};





// Responsive image map - resize coordinates based on displayed image size
function makeImageMapResponsive() {
    const img = document.getElementById('displayPng');
    const areas = document.querySelectorAll('area');
    
    if (!img || areas.length === 0) return;
    
    function resizeMap() {
        const originalWidth = 1640;
        const originalHeight = 2360;
        
        // Get current displayed size
        const currentWidth = img.clientWidth;
        const currentHeight = img.clientHeight;
        
        if (currentWidth === 0 || currentHeight === 0) return;
        
        const scaleX = currentWidth / originalWidth;
        const scaleY = currentHeight / originalHeight;
        
        console.log('Resizing image map:', { 
            originalWidth, originalHeight,
            currentWidth, currentHeight,
            scaleX, scaleY 
        });
        
        areas.forEach(area => {
            const originalCoords = area.dataset.originalCoords;
            if (!originalCoords) {
                // Store original coordinates on first run
                area.dataset.originalCoords = area.getAttribute('coords');
            }
            
            const coords = area.dataset.originalCoords.split(',').map((coord, index) => {
                const num = parseInt(coord);
                return Math.round(index % 2 === 0 ? num * scaleX : num * scaleY);
            });
            
            area.setAttribute('coords', coords.join(','));
        });
    }
    
    // Resize when image loads
    if (img.complete && img.naturalWidth > 0) {
        resizeMap();
    } else {
        img.addEventListener('load', resizeMap);
    }
    
    // Resize on window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resizeMap, 100);
    });
    
    // Also resize when image changes
    const observer = new MutationObserver(() => {
        setTimeout(resizeMap, 100);
    });
    observer.observe(img, { attributes: true, attributeFilter: ['src'] });
}

// Setup image map hover effects
function setupImageMapHoverEffects() {
    console.log('Setting up responsive image map');
    makeImageMapResponsive();
    
    // Add hover effects to all area elements
    const areas = document.querySelectorAll('area');
    const img = document.getElementById('displayPng');
    
    areas.forEach(area => {
        area.addEventListener('mouseenter', function() {
            // Create a highlight overlay for the state (including all parts)
            createStateHighlight(this.dataset.state);
            console.log('Hovering over:', this.dataset.state);
        });
        
        area.addEventListener('mouseleave', function() {
            // Remove the highlight overlay
            removeStateHighlight();
        });
    });
}

// Create a visual highlight overlay for hovered states
function createStateHighlight(stateName) {
    // Remove any existing highlight
    removeStateHighlight();
    
    const container = document.querySelector('.png-display-container');
    const img = document.getElementById('displayPng');
    
    // Find all areas that belong to this state
    const stateAreas = document.querySelectorAll(`area[data-state="${stateName}"]`);
    
    if (stateAreas.length === 0) return;
    
    // Get the current image dimensions for proper SVG scaling
    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Create an SVG overlay for the highlight
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'stateHighlight';
    svg.style.position = 'absolute';
    svg.style.top = (imgRect.top - containerRect.top) + 'px';
    svg.style.left = (imgRect.left - containerRect.left) + 'px';
    svg.style.width = imgRect.width + 'px';
    svg.style.height = imgRect.height + 'px';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '10';
    
    // Set SVG viewBox to match the image dimensions
    svg.setAttribute('viewBox', `0 0 ${imgRect.width} ${imgRect.height}`);
    
    // Create polygon elements for each part of the state
    stateAreas.forEach(area => {
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        
        // Use the current (scaled) coordinates from the area
        const coords = area.getAttribute('coords');
        polygon.setAttribute('points', coords);
        polygon.style.fill = '#c19c63';
        polygon.style.fillOpacity = '0.8';
        polygon.style.stroke = 'none';
        
        svg.appendChild(polygon);
    });
    
    container.appendChild(svg);
}

// Remove the state highlight overlay
function removeStateHighlight() {
    const existingHighlight = document.getElementById('stateHighlight');
    if (existingHighlight) {
        existingHighlight.remove();
    }
}

// Modal Functions
function showModal(stateName) {
    const modal = document.getElementById('tableModal');
    const stateHeader = document.getElementById('stateHeader');
    
    stateHeader.textContent = `${stateName} Publications`;
    modal.style.display = 'flex';
    
    // Reset filters when opening modal
    selectedDecade = '';
    selectedCategory = '';
    updateDropdownText();
    
    updateModalTable();
}

function hideModal() {
    const modal = document.getElementById('tableModal');
    modal.style.display = 'none';
    
    // Reset filters
    selectedDecade = '';
    selectedCategory = '';
}

function updateDropdownText() {
    const decadeBtn = document.getElementById('decadeBtn').querySelector('span');
    const categoryBtn = document.getElementById('categoryBtn').querySelector('span');
    
    decadeBtn.textContent = selectedDecade || 'Decade';
    categoryBtn.textContent = selectedCategory || 'Category';
    
    // Update selected options in dropdowns
    document.querySelectorAll('#decadeDropdown .dropdown-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.value === selectedDecade);
    });
    
    document.querySelectorAll('#categoryDropdown .dropdown-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.value === selectedCategory);
    });
}

function setupModalEventListeners() {
    // Close modal button
    document.getElementById('closeModal').addEventListener('click', () => {
        currentState = null;
        hideModal();
        updatePNG();
    });
    
    // Close modal when clicking overlay
    document.querySelector('.modal-overlay').addEventListener('click', () => {
        currentState = null;
        hideModal();
        updatePNG();
    });
    
    // Dropdown toggles
    document.getElementById('decadeBtn').addEventListener('click', () => {
        toggleDropdown('decadeDropdown');
    });
    
    document.getElementById('categoryBtn').addEventListener('click', () => {
        toggleDropdown('categoryDropdown');
    });
    
    // Dropdown options
    document.querySelectorAll('#decadeDropdown .dropdown-option').forEach(option => {
        option.addEventListener('click', () => {
            selectedDecade = option.dataset.value;
            updateDropdownText();
            closeAllDropdowns();
            updateModalTable();
        });
    });
    
    document.querySelectorAll('#categoryDropdown .dropdown-option').forEach(option => {
        option.addEventListener('click', () => {
            selectedCategory = option.dataset.value;
            updateDropdownText();
            closeAllDropdowns();
            updateModalTable();
        });
    });
    
    // Close dropdowns when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-container')) {
            closeAllDropdowns();
        }
    });
}

function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    const container = dropdown.parentElement;
    
    // Close other dropdowns
    document.querySelectorAll('.dropdown-container').forEach(cont => {
        if (cont !== container) {
            cont.classList.remove('active');
        }
    });
    
    container.classList.toggle('active');
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-container').forEach(container => {
        container.classList.remove('active');
    });
}

function updateModalTable() {
    const tableBody = document.getElementById('modalTableBody');
    tableBody.innerHTML = '';
    
    if (csvData.length === 0 || !currentState) {
        return;
    }
    
    // Filter data
    let filteredData = filterDataForModal();
    
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
        
        // Create hyperlink using issue_date and Web_URL
        const link = document.createElement('a');
        link.href = row.Web_URL;
        link.textContent = row.issue_date;
        link.target = '_blank'; // Open in new tab
        
        td.appendChild(link);
        tr.appendChild(td);
        tableBody.appendChild(tr);
    });
}

function filterDataForModal() {
    let filteredData = csvData;
    
    // Filter by state
    if (currentState) {
        const places = placeMappings[currentPeriod][currentState];
        if (places) {
            filteredData = filteredData.filter(row => {
                if (!row.place_of_publication) return false;
                return places.some(place => 
                    row.place_of_publication.includes(place)
                );
            });
        }
    }
    
    // Filter by decade
    if (selectedDecade) {
        const [startYear, endYear] = selectedDecade.split('-').map(year => parseInt(year));
        filteredData = filteredData.filter(row => {
            if (!row.issue_date) return false;
            const year = parseInt(row.issue_date.substring(0, 4));
            return year >= startYear && year <= endYear;
        });
    }
    
    // Filter by category
    if (selectedCategory) {
        filteredData = filteredData.filter(row => {
            if (!row.Categories) return false;
            return row.Categories.includes(selectedCategory);
        });
    }
    
    return filteredData;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadCSVData();
    setupEventListeners();
    setupModalEventListeners();
    // updateStateButtonVisibility(); // Removed - no state buttons in current layout
    updatePNG();
    updateTable();
    setupImageMapHoverEffects();
    makeImageMapResponsive(); // Re-enabled - it's working correctly
    
    // Debug: Add click listener to the entire document
    document.addEventListener('click', function(e) {
        console.log('Document click detected:', e.target.tagName, e.target);
        if (e.target.tagName === 'AREA') {
            console.log('Area element clicked!', e.target.dataset.state);
            console.log('Area coords:', e.target.getAttribute('coords'));
            console.log('Area title:', e.target.title);
        }
    });
    
    // Debug: Add click listener to the image
    const img = document.getElementById('displayPng');
    if (img) {
        img.addEventListener('click', function(e) {
            console.log('Image clicked at coordinates:', e.offsetX, e.offsetY);
        });
    }
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
            
            // Remove active class from all state buttons (removed - no state buttons)
            // document.querySelectorAll('.state-btn').forEach(b => b.classList.remove('active'));
            
            // Adjust state button position based on time period (removed - no state buttons)
            // adjustStateButtonPosition();
            
            // updateStateButtonVisibility(); // Removed - no state buttons in current layout
            updatePNG();
            updateTable();
        });
    });
    
    // State button listeners (removed - no state buttons in current layout)
    // document.querySelectorAll('.state-btn').forEach(btn => {
    //     btn.addEventListener('click', function() {
    //         if (this.classList.contains('hidden')) return;
    //         
    //         // Toggle state selection
    //         if (this.classList.contains('active')) {
    //             this.classList.remove('active');
    //             currentState = null;
    //         } else {
    //             // Remove active class from all state buttons
    //             document.querySelectorAll('.state-btn').forEach(b => b.classList.remove('active'));
    //             // Add active class to clicked button
    //             this.classList.add('active');
    //             currentState = this.dataset.state;
    //         }
    //         
    //         updatePNG();
    //         updateTable();
    //     });
    // });
}

// Update state button visibility based on current period (removed - no state buttons)
// function updateStateButtonVisibility() {
//     const visibleStates = stateVisibility[currentPeriod];
//     
//     document.querySelectorAll('.state-btn').forEach(btn => {
//         const state = btn.dataset.state;
//         if (visibleStates.includes(state)) {
//             btn.classList.remove('hidden');
//         } else {
//             btn.classList.add('hidden');
//             btn.classList.remove('active');
//         }
//     });
// }

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
