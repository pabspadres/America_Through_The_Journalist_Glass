// Array of image filenames (simple, web-friendly names)
const imageNames = [
    'img1.png',
    'img2.png',
    'img3.png',
    'img4.png',
    'img5.png',
    'img6.png',
    'img7.png',
    'img8.png',
    'img9.png',
    'img10.png',
    'img11.png',
    'img12.png',
    'img13.png',
    'img14.png'
];

// Working image paths (will be populated after testing)
let images = [];

// Gallery configuration
const VISIBLE_IMAGES = 9; // Number of images visible at once
const GALLERY_BOUNDS = {
    left: 20, // 20px from vertical line
    right: 20, // 20px from right edge  
    top: 20, // 20px from top
    bottom: 20 // 20px from bottom
};

let activeImages = [];
let imageRotationInterval;

// Dynamic positioning system
let occupiedAreas = []; // Array of {x, y, width, height} rectangles
let galleryDimensions = { width: 0, height: 0 };

// Initialize gallery when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, testing renamed images...');
    
    // Test real images first with new simple names
    testImagePaths().then(() => {
        initializeGallery();
        startImageRotation();
    });
});

// Simple function to setup image paths
async function testImagePaths() {
    console.log('Testing renamed image files...');
    
    // Test simple paths with clean filenames
    const testName = imageNames[0]; // img1.png
    const testPaths = [
        `landing_page_png/${testName}`,
        `./${testName}`,
        `./landing_page_png/${testName}`,
        testName
    ];
    
    let workingFormat = '';
    let imageFound = false;
    
    for (const testPath of testPaths) {
        try {
            await new Promise((resolve, reject) => {
                const testImg = new Image();
                testImg.onload = () => {
                    console.log('✓ SUCCESS! Image loaded from:', testPath);
                    if (testPath.includes('landing_page_png/')) {
                        workingFormat = testPath.startsWith('./') ? './landing_page_png/' : 'landing_page_png/';
                    } else {
                        workingFormat = testPath.startsWith('./') ? './' : '';
                    }
                    imageFound = true;
                    resolve();
                };
                testImg.onerror = () => reject();
                testImg.src = testPath;
                setTimeout(() => reject(), 3000); // 3 second timeout
            });
            break; // Found working format
        } catch (e) {
            console.log('✗ Failed:', testPath);
        }
    }
    
    if (imageFound) {
        // Populate images array with working format
        images = imageNames.map(name => `${workingFormat}${name}`);
        console.log('✓ All images ready! Using format:', workingFormat);
        console.log('First few images:', images.slice(0, 3));
    } else {
        console.log('⚠ Could not load any images, using fallbacks');
        createFallbackImages();
    }
    
    // Initialize dynamic positioning system
    initializeDynamicSystem();
}

function initializeDynamicSystem() {
    occupiedAreas = [];
    console.log('Dynamic positioning system initialized');
}

function checkOverlap(newArea, existingAreas) {
    for (const area of existingAreas) {
        if (newArea.x < area.x + area.width &&
            newArea.x + newArea.width > area.x &&
            newArea.y < area.y + area.height &&
            newArea.y + newArea.height > area.y) {
            return true; // Overlap detected
        }
    }
    return false; // No overlap
}

function findRandomPosition(gallery, imageWidth, imageHeight) {
    const galleryRect = gallery.getBoundingClientRect();
    galleryDimensions.width = galleryRect.width;
    galleryDimensions.height = galleryRect.height;
    
    const availableWidth = galleryRect.width - GALLERY_BOUNDS.left - GALLERY_BOUNDS.right - imageWidth;
    const availableHeight = galleryRect.height - GALLERY_BOUNDS.top - GALLERY_BOUNDS.bottom - imageHeight;
    
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loops
    
    while (attempts < maxAttempts) {
        const x = GALLERY_BOUNDS.left + Math.random() * Math.max(0, availableWidth);
        const y = GALLERY_BOUNDS.top + Math.random() * Math.max(0, availableHeight);
        
        const newArea = {
            x: x,
            y: y,
            width: imageWidth + 20, // Add some padding
            height: imageHeight + 20
        };
        
        // Check if this position overlaps with existing images
        if (!checkOverlap(newArea, occupiedAreas)) {
            return { x, y, area: newArea };
        }
        
        attempts++;
    }
    
    // If we can't find a non-overlapping position, try to fill gaps
    return findGapPosition(gallery, imageWidth, imageHeight);
}

function findGapPosition(gallery, imageWidth, imageHeight) {
    const galleryRect = gallery.getBoundingClientRect();
    
    // Try to place in areas that help distribute images evenly
    const regions = [
        { x: GALLERY_BOUNDS.left, y: GALLERY_BOUNDS.top }, // Top-left
        { x: galleryRect.width / 2, y: GALLERY_BOUNDS.top }, // Top-center
        { x: galleryRect.width - GALLERY_BOUNDS.right - imageWidth, y: GALLERY_BOUNDS.top }, // Top-right
        { x: GALLERY_BOUNDS.left, y: galleryRect.height / 2 }, // Middle-left
        { x: galleryRect.width / 2, y: galleryRect.height / 2 }, // Center
        { x: galleryRect.width - GALLERY_BOUNDS.right - imageWidth, y: galleryRect.height / 2 }, // Middle-right
        { x: GALLERY_BOUNDS.left, y: galleryRect.height - GALLERY_BOUNDS.bottom - imageHeight }, // Bottom-left
        { x: galleryRect.width / 2, y: galleryRect.height - GALLERY_BOUNDS.bottom - imageHeight }, // Bottom-center
        { x: galleryRect.width - GALLERY_BOUNDS.right - imageWidth, y: galleryRect.height - GALLERY_BOUNDS.bottom - imageHeight } // Bottom-right
    ];
    
    // Find the region with least overlap
    let bestPosition = regions[0];
    let minOverlapArea = Infinity;
    
    for (const region of regions) {
        const testArea = {
            x: region.x,
            y: region.y,
            width: imageWidth + 20,
            height: imageHeight + 20
        };
        
        let overlapArea = 0;
        for (const existingArea of occupiedAreas) {
            const overlapWidth = Math.max(0, Math.min(testArea.x + testArea.width, existingArea.x + existingArea.width) - Math.max(testArea.x, existingArea.x));
            const overlapHeight = Math.max(0, Math.min(testArea.y + testArea.height, existingArea.y + existingArea.height) - Math.max(testArea.y, existingArea.y));
            overlapArea += overlapWidth * overlapHeight;
        }
        
        if (overlapArea < minOverlapArea) {
            minOverlapArea = overlapArea;
            bestPosition = region;
        }
    }
    
    return {
        x: bestPosition.x,
        y: bestPosition.y,
        area: {
            x: bestPosition.x,
            y: bestPosition.y,
            width: imageWidth + 20,
            height: imageHeight + 20
        }
    };
}

function createFallbackImages() {
    console.log('Creating realistic document fallbacks...');
    images = [];
    
    // Create realistic looking historical documents
    const documentTypes = [
        { title: 'Boston Gazette', subtitle: '1770 Edition', color: '#8B4513' },
        { title: 'Pennsylvania Packet', subtitle: 'Revolutionary News', color: '#A0522D' },
        { title: 'Virginia Gazette', subtitle: 'Colonial Times', color: '#CD853F' },
        { title: 'New York Journal', subtitle: 'Independence Era', color: '#DEB887' },
        { title: 'Massachusetts Spy', subtitle: 'Liberty Press', color: '#D2691E' },
        { title: 'Newport Mercury', subtitle: 'Rhode Island', color: '#B8860B' },
        { title: 'Maryland Journal', subtitle: 'Annapolis News', color: '#DAA520' },
        { title: 'South Carolina', subtitle: 'Charleston Post', color: '#CD853F' }
    ];
    
    documentTypes.forEach((doc, index) => {
        // Random canvas sizes for variety
        const sizes = [
            { width: 280, height: 180 },
            { width: 320, height: 220 },
            { width: 260, height: 160 },
            { width: 340, height: 240 },
            { width: 300, height: 200 }
        ];
        const size = sizes[index % sizes.length];
        
        const canvas = document.createElement('canvas');
        canvas.width = size.width;
        canvas.height = size.height;
        const ctx = canvas.getContext('2d');
        
        // Paper background with aging effect
        const gradient = ctx.createLinearGradient(0, 0, size.width, size.height);
        gradient.addColorStop(0, '#f4f1e8');
        gradient.addColorStop(0.5, '#f0ede0');
        gradient.addColorStop(1, '#ebe6d3');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size.width, size.height);
        
        // Add paper texture with small spots
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = `rgba(139, 69, 19, ${Math.random() * 0.1})`;
            ctx.fillRect(Math.random() * size.width, Math.random() * size.height, 2, 2);
        }
        
        // Header decoration
        ctx.fillStyle = doc.color;
        ctx.fillRect(10, 10, size.width - 20, 30);
        
        // Title
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px serif';
        ctx.textAlign = 'center';
        ctx.fillText(doc.title, size.width / 2, 30);
        
        // Subtitle
        ctx.fillStyle = '#2c1810';
        ctx.font = '14px serif';
        ctx.fillText(doc.subtitle, size.width / 2, 55);
        
        // Mock article lines
        ctx.fillStyle = '#3c2820';
        ctx.font = '10px serif';
        ctx.textAlign = 'left';
        
        const lines = [
            'IN CONGRESS, July 4, 1776',
            'The unanimous Declaration of the',
            'thirteen united States of America',
            '',
            'When in the Course of human events,',
            'it becomes necessary for one people',
            'to dissolve the political bands...',
            '',
            '~ Revolutionary Era Publication ~'
        ];
        
        lines.forEach((line, i) => {
            ctx.fillText(line, 20, 75 + (i * 12));
        });
        
        // Border
        ctx.strokeStyle = doc.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(5, 5, size.width - 10, size.height - 10);
        
        images.push(canvas.toDataURL());
    });
    
    console.log('Realistic historical document fallbacks created:', images.length);
}

function initializeGallery() {
    const gallery = document.getElementById('imageGallery');
    const galleryRect = gallery.getBoundingClientRect();
    
    console.log('Initializing dynamic gallery...');
    
    // Clear existing images
    gallery.innerHTML = '';
    activeImages = [];
    
    // Reset dynamic system
    initializeDynamicSystem();
    
    // Create initial set of images with staggered timing
    let created = 0;
    for (let i = 0; i < VISIBLE_IMAGES; i++) {
        setTimeout(() => {
            const img = createRandomImage(gallery, galleryRect);
            if (img) created++;
            
            if (i === VISIBLE_IMAGES - 1) {
                console.log(`Gallery initialized with ${created} images`);
            }
        }, i * 200); // Stagger creation by 200ms each
    }
}

function createRandomImage(gallery, galleryRect) {
    // Create image element first to determine size
    const img = document.createElement('img');
    const randomImage = images[Math.floor(Math.random() * images.length)];
    
    img.className = 'gallery-image';
    
    // Random size variations (different widths and heights)
    const sizeVariations = [
        { width: 160, aspectRatio: 1.3 },
        { width: 200, aspectRatio: 1.4 },
        { width: 180, aspectRatio: 1.2 },
        { width: 240, aspectRatio: 1.5 },
        { width: 170, aspectRatio: 1.35 },
        { width: 210, aspectRatio: 1.25 },
        { width: 190, aspectRatio: 1.45 },
        { width: 230, aspectRatio: 1.3 }
    ];
    
    const randomSize = sizeVariations[Math.floor(Math.random() * sizeVariations.length)];
    const imageWidth = randomSize.width;
    const imageHeight = randomSize.width / randomSize.aspectRatio;
    
    img.style.width = imageWidth + 'px';
    img.style.height = imageHeight + 'px';
    img.style.objectFit = 'cover';
    
    // Find non-overlapping position
    const position = findRandomPosition(gallery, imageWidth, imageHeight);
    
    if (!position) {
        console.log('Could not find position for new image');
        return null;
    }
    
    // Store the occupied area
    occupiedAreas.push(position.area);
    img.dataset.areaIndex = occupiedAreas.length - 1;
    
    // Add some random rotation for natural look
    const randomRotation = (Math.random() - 0.5) * 12; // -6 to +6 degrees
    img.style.transform = `rotate(${randomRotation}deg)`;
    
    // Set position
    img.style.left = position.x + 'px';
    img.style.top = position.y + 'px';
    
    // Handle loading
    img.onload = function() {
        console.log('✓ Image loaded at position', Math.round(position.x), Math.round(position.y));
        setTimeout(() => {
            img.classList.add('visible');
        }, 100);
    };
    
    img.onerror = function() {
        console.log('✗ Image failed to load:', randomImage);
        // Remove from DOM and free up area
        if (img.parentNode) {
            img.parentNode.removeChild(img);
        }
        freeAreaByIndex(img.dataset.areaIndex);
    };
    
    // Set source (triggers loading)
    img.src = randomImage;
    
    // Add to gallery and track
    gallery.appendChild(img);
    activeImages.push(img);
    
    return img;
}

function freeAreaByIndex(areaIndex) {
    if (areaIndex !== undefined && occupiedAreas[areaIndex]) {
        console.log('Freeing area at index:', areaIndex);
        occupiedAreas.splice(areaIndex, 1);
        
        // Update all remaining image area indices
        activeImages.forEach((img, index) => {
            const imgIndex = parseInt(img.dataset.areaIndex);
            if (imgIndex > areaIndex) {
                img.dataset.areaIndex = imgIndex - 1;
            }
        });
    }
}

function startImageRotation() {
    imageRotationInterval = setInterval(() => {
        if (activeImages.length > 0) {
            // Remove random image
            const randomIndex = Math.floor(Math.random() * activeImages.length);
            const imageToRemove = activeImages[randomIndex];
            
            imageToRemove.classList.add('fadeout');
            
            setTimeout(() => {
                // Free up the occupied area
                const areaIndex = imageToRemove.dataset.areaIndex;
                if (areaIndex !== undefined) {
                    freeAreaByIndex(parseInt(areaIndex));
                }
                
                // Remove from DOM
                if (imageToRemove.parentNode) {
                    imageToRemove.parentNode.removeChild(imageToRemove);
                }
                
                // Remove from active images array
                const index = activeImages.indexOf(imageToRemove);
                if (index > -1) {
                    activeImages.splice(index, 1);
                }
                
                // Add new image after a short delay
                setTimeout(() => {
                    const gallery = document.getElementById('imageGallery');
                    const galleryRect = gallery.getBoundingClientRect();
                    createRandomImage(gallery, galleryRect);
                }, 300);
                
            }, 800);
        }
    }, 2500); // Change image every 2.5 seconds for more dynamic feel
}

function stopImageRotation() {
    if (imageRotationInterval) {
        clearInterval(imageRotationInterval);
    }
}

// Function to transition to main visualization
function enterVisualization() {
    stopImageRotation();
    
    // Add fade out class to entire page
    document.body.classList.add('fade-out');
    
    // Navigate to main page after fade
    setTimeout(() => {
        window.location.href = 'map.html';
    }, 1000);
}

// Handle window resize
window.addEventListener('resize', function() {
    // Reinitialize gallery with new dimensions
    setTimeout(() => {
        initializeGallery();
    }, 100);
});

// Preload images for smoother transitions
function preloadImages() {
    images.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// Start preloading
preloadImages();
