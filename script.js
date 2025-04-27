document.getElementById('visualize-btn').addEventListener('click', visualizeWalls);

function visualizeWalls() {
    // Get input values
    const numWalls = parseInt(document.getElementById('num-walls').value);
    const wallHeightsInput = document.getElementById('wall-heights').value;
    const leftObserverHeight = parseFloat(document.getElementById('left-observer-height').value) || 0;
    const rightObserverHeight = parseFloat(document.getElementById('right-observer-height').value) || 0;
    const errorElement = document.getElementById('error');
    
    // Clear previous error message
    errorElement.textContent = '';
    
    // Validate number of walls
    if (isNaN(numWalls) || numWalls <= 0) {
        errorElement.textContent = 'Please enter a valid positive integer for the number of walls.';
        return;
    }
    
    // Parse wall heights
    const wallHeights = wallHeightsInput.split('#').map(h => parseFloat(h.trim()));
    
    // Validate wall heights
    if (wallHeights.length !== numWalls) {
        errorElement.textContent = `The number of heights (${wallHeights.length}) doesn't match the number of walls (${numWalls}).`;
        return;
    }
    
    if (wallHeights.some(isNaN)) {
        errorElement.textContent = 'All wall heights must be valid numbers.';
        return;
    }
    
    // Create walls visualization
    const wallsContainer = document.getElementById('walls-container');
    
    // Clear previous walls and sight lines
    const existingWalls = wallsContainer.querySelectorAll('.wall');
    existingWalls.forEach(wall => wall.remove());
    
    const existingSightLines = wallsContainer.querySelectorAll('.sight-line');
    existingSightLines.forEach(line => line.remove());
    
    // Find maximum height for scaling
    const maxHeight = Math.max(...wallHeights, leftObserverHeight, rightObserverHeight);
    const scale = 250 / Math.max(maxHeight, 1); // Scale for maximum visualization height of 250px
    
    // Position observers
    const personLeft = document.getElementById('person-left');
    const personRight = document.getElementById('person-right');
    
    personLeft.style.bottom = `${leftObserverHeight * scale - 20}px`; // -20 to center the circle
    personRight.style.bottom = `${rightObserverHeight * scale - 20}px`; // -20 to center the circle
    
    // Create and append wall elements
    const wallElements = [];
    wallHeights.forEach((height, index) => {
        const wallDiv = document.createElement('div');
        wallDiv.className = 'wall';
        wallDiv.style.height = `${height * scale}px`;
        wallDiv.textContent = height;
        
        const heightLabel = document.createElement('div');
        heightLabel.className = 'wall-height';
        heightLabel.textContent = height;
        
        wallDiv.appendChild(heightLabel);
        wallsContainer.appendChild(wallDiv);
        wallElements.push(wallDiv);
    });
    
    // Calculate visibility based on observer heights
    const visibleFromLeft = calculateVisibleFromLeft(wallHeights, leftObserverHeight);
    const visibleFromRight = calculateVisibleFromRight(wallHeights, rightObserverHeight);
    
    // Update results
    document.getElementById('visible-left').textContent = `Walls Visible from Left: ${visibleFromLeft.count}`;
    document.getElementById('visible-right').textContent = `Walls Visible from Right: ${visibleFromRight.count}`;
    
    // Draw sight lines for visible walls
    drawSightLines(wallElements, visibleFromLeft.indices, visibleFromRight.indices, leftObserverHeight * scale, rightObserverHeight * scale);
}

function calculateVisibleFromLeft(heights, observerHeight) {
    let count = 0;
    let maxSlope = -Infinity;
    const visibleIndices = [];
    
    for (let i = 0; i < heights.length; i++) {
        // Calculate the slope from observer to the top of this wall
        const distance = i + 1; // Distance from left observer (1-indexed)
        const relativeHeight = heights[i] - observerHeight;
        const slope = relativeHeight / distance;
        
        if (slope > maxSlope) {
            count++;
            maxSlope = slope;
            visibleIndices.push(i);
        }
    }
    
    return { count, indices: visibleIndices };
}

function calculateVisibleFromRight(heights, observerHeight) {
    let count = 0;
    let maxSlope = -Infinity;
    const visibleIndices = [];
    
    for (let i = heights.length - 1; i >= 0; i--) {
        // Calculate the slope from observer to the top of this wall
        const distance = heights.length - i; // Distance from right observer (1-indexed)
        const relativeHeight = heights[i] - observerHeight;
        const slope = relativeHeight / distance;
        
        if (slope > maxSlope) {
            count++;
            maxSlope = slope;
            visibleIndices.push(i);
        }
    }
    
    return { count, indices: visibleIndices };
}

function drawSightLines(wallElements, leftVisibleIndices, rightVisibleIndices, leftObserverY, rightObserverY) {
    const wallsContainer = document.getElementById('walls-container');
    const containerRect = wallsContainer.getBoundingClientRect();
    const personLeft = document.getElementById('person-left');
    const personRight = document.getElementById('person-right');
    
    // Get eye positions
    const leftEyeX = personLeft.getBoundingClientRect().left - containerRect.left + 20; // Center of circle
    const leftEyeY = containerRect.height - leftObserverY;
    
    const rightEyeX = personRight.getBoundingClientRect().left - containerRect.left + 20; // Center of circle
    const rightEyeY = containerRect.height - rightObserverY; 
    
    // Draw sight lines from left observer
    leftVisibleIndices.forEach(index => {
        const wall = wallElements[index];
        const wallRect = wall.getBoundingClientRect();
        const wallTopX = wallRect.left - containerRect.left + wallRect.width / 2;
        const wallTopY = containerRect.height - parseInt(wall.style.height);
        
        const sightLine = document.createElement('div');
        sightLine.className = 'sight-line';
        
        // Calculate position and width for the sight line
        const length = Math.sqrt(Math.pow(wallTopX - leftEyeX, 2) + Math.pow(wallTopY - leftEyeY, 2));
        const angle = Math.atan2(wallTopY - leftEyeY, wallTopX - leftEyeX) * 180 / Math.PI;
        
        sightLine.style.width = `${length}px`;
        sightLine.style.left = `${leftEyeX}px`;
        sightLine.style.top = `${leftEyeY}px`;
        sightLine.style.transformOrigin = 'left center';
        sightLine.style.transform = `rotate(${angle}deg)`;
        sightLine.style.opacity = '0.7';
        
        wallsContainer.appendChild(sightLine);
    });
    
    // Draw sight lines from right observer
    rightVisibleIndices.forEach(index => {
        const wall = wallElements[index];
        const wallRect = wall.getBoundingClientRect();
        const wallTopX = wallRect.left - containerRect.left + wallRect.width / 2;
        const wallTopY = containerRect.height - parseInt(wall.style.height);
        
        const sightLine = document.createElement('div');
        sightLine.className = 'sight-line';
        
        // Calculate position and width for the sight line
        const length = Math.sqrt(Math.pow(wallTopX - rightEyeX, 2) + Math.pow(wallTopY - rightEyeY, 2));
        const angle = Math.atan2(wallTopY - rightEyeY, wallTopX - rightEyeX) * 180 / Math.PI;
        
        sightLine.style.width = `${length}px`;
        sightLine.style.left = `${rightEyeX}px`;
        sightLine.style.top = `${rightEyeY}px`;
        sightLine.style.transformOrigin = 'left center';
        sightLine.style.transform = `rotate(${angle}deg)`;
        sightLine.style.opacity = '0.7';
        sightLine.style.borderTop = '2px dashed #ff6b6b'; // Different color for right observer
        
        wallsContainer.appendChild(sightLine);
    });
}