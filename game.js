const CAMERA_LEFT_OFFSET_PX = 66; // Offset the camera to the right by 66 pixels
const CAMERA_TOP_OFFSET_PX = 42; // Offset the camera down by 42 pixels
const LOOKAHEAD_DISTANCE = 6; 

// Define the directions we can move
const DIRECTION = {
  up: "up",
  down: "down",
  left: "left",
  right: "right",
}

// Map key codes to directions (up, down, left, right, W, A, S, D)
const KEY_TO_DIRECTION = {
  'ArrowUp': DIRECTION.up,
	'ArrowLeft': DIRECTION.left,
	'ArrowRight': DIRECTION.right,
	'ArrowDown': DIRECTION.down,
	'KeyW': DIRECTION.up,
	'KeyA': DIRECTION.left,
	'KeyD': DIRECTION.right,
	'KeyS': DIRECTION.down,
}

const character = document.querySelector(".character"); // Get the character element
const map = document.querySelector(".map"); // Get the map element

// Get the pixel size from the CSS custom property --pixel-size
const pixelSize = parseInt(
  getComputedStyle(document.documentElement).getPropertyValue('--pixel-size')
);

// True dimensions of the game map
const gridSize = 512; // Total size of the grid in pixels (width and height)
const numCells = 32;  // Number of cells per row/column
const cellSize = gridSize / numCells;  // Size of each cell in pixels

// Set the initial position of the character and camera
// Depending on the size of the browser window, the positions might get multiplied by 2, 3,or 4
let playerPosition = { x: 220, y: 375 }; // Initial position of the player
let cameraPosition = { x: playerPosition.x, y: playerPosition.y}; // Initial position of the camera

let pressedDirections = []; // State of which arrow keys we are holding down
let speed = 1; // How fast the character moves in pixels per frame
let gameMap2DArray = []; // 2D array to store the map data 

// Load the map data from a CSV file in the assets folder
async function loadMapData() {
  try {
    const response = await fetch("assets/IntGrid.csv");
    const csvText = await response.text(); 
    gameMap2DArray = parseCSV(csvText); // Save the map data to a global variable
  } catch (error) {
    console.error("Error fetching map data", error); 
  }
}

// Parse the CSV text into a 2D array of numbers
function parseCSV(csvText) {
  return csvText.trim().split('\n').map(row => row.split(',').map(Number));
}

//Linear interpolation which will be used to move the cam smoothly
function lerp(currentVal, desiredVal, time) {
  return currentVal +(desiredVal - currentVal) * time; 
}

function easeInQuad(t) {return t * t;}

function convertCSSPositionToArrayIndex(columnPos, rowPos) {
	const columnIndex = Math.ceil(columnPos / cellSize);
	const rowIndex = Math.ceil(rowPos / cellSize);
	return { columnIndex, rowIndex };
}

function isTileWalkable(columnPos, rowPos) {
  // Check if the position is outside the bounds of the game map
  if (rowPos < 0 || rowPos >= gameMap2DArray.length || columnPos < 0 || columnPos >= gameMap2DArray[rowPos].length) { 
    return false;
  }
  return gameMap2DArray[rowPos][columnPos] !== 1; // 0 = walkable, 1 = boundary
}

function updatePlayerVisualPosition() {
  // Update character position in the CSS
	  // Update camera
		const camTransformLeft = -cameraPosition.x * pixelSize + (pixelSize * CAMERA_LEFT_OFFSET_PX);
		const camTransformTop = -cameraPosition.y * pixelSize + (pixelSize * CAMERA_TOP_OFFSET_PX);
		// Set the camera position in the CSS 
		map.style.transform = `translate3d( ${camTransformLeft}px, ${camTransformTop}px, 0 )`;
  character.style.transform = `translate3d( ${playerPosition.x * pixelSize}px, ${playerPosition.y * pixelSize}px, 0 )`;
}

const moveCharacter = (lastMoveTimeMs, currentTimeMs) => {
  // Get the direction we are moving
	let newX = playerPosition.x;
	let newY = playerPosition.y;
  const direction = pressedDirections[0]; 
  
  if (direction) {
    if (direction === DIRECTION.right ) {newX += speed;} 
    if (direction === DIRECTION.left ) {newX -= speed;}
    if (direction === DIRECTION.down) {newY += speed;}
    if (direction === DIRECTION.up) {newY -= speed;}
    // Set the direction the character is facing which will be used to change the sprite in the CSS
    character.setAttribute("facing", direction); // Set the direction the character is facing which will be used to change the sprite in the CSS
  }
  
  // Set the walking attribute to true if we are moving and false if we are not
  character.setAttribute("walking", direction ? "true" : "false");
	const { columnIndex, rowIndex } = convertCSSPositionToArrayIndex(newX, newY);
  if (isTileWalkable(columnIndex, rowIndex)) {
    console.log("Player can walk here");
    const cellValue = gameMap2DArray[rowIndex][columnIndex];
    if (cellValue === 0) {speed = 1;}
    if (cellValue === 2) {speed = .50;}
    if (cellValue === 3) {speed = .25;}
    if (cellValue === 4) {speed = .10;}
		playerPosition.x = newX;
    playerPosition.y = newY;
	}else {
    console.log("Collision detected at:", columnIndex, rowIndex);
	}
  //Camera Look Ahead
  let lahX = 0; 
  let lahY = 0;

  // Camera desired positions in
  let camDesX = playerPosition.x + lahX; 
  let camDesY = playerPosition.y + lahY; 
  
  // Calculate camera position
  const camCatchupTime = 1000; // Time in ms for the camera to catch up to the player
  let t = (currentTimeMs - lastMoveTimeMs) / camCatchupTime; // Time from 0-1
  t = Math.max(0, Math.min(1, t)); // Clamp to 0-1
  t = easeInQuad(t); // Ease in the value
  cameraPosition.x = lerp(cameraPosition.x, camDesX, t);
  cameraPosition.y = lerp(cameraPosition.y, camDesY, t);

	updatePlayerVisualPosition();
}

// Game loop
const frameDuration = 1 / 60; // 60 frames per second
let previousTickMs = 0; // The timestamp of the last frame
let lastInputTimeMs = 0; // The timestamp of the last input event (keydown or keyup)

// The game loop function which will be called by the browser every frame (60 times per second) using requestAnimationFrame
const tick = (currentTimeMs) => {
  // Calculate the time since the last frame
  let delta = (currentTimeMs - previousTickMs) / 1000;
  // Only move the character if the time since the last frame is greater than the frame duration
  if (delta >= frameDuration) {
    moveCharacter(lastInputTimeMs, currentTimeMs); 
    previousTickMs = currentTimeMs; // Set the previous tick to the current time for the next frame
  }
  // Schedule the next frame to be drawn by the browser
  requestAnimationFrame(tick);
}
// Load the map data when the game starts
loadMapData();
// Start the game loop
requestAnimationFrame(tick);

/* Direction key state */
document.addEventListener("keydown", (e) => {
   // Get the direction from the key code and add it to the pressedDirections array
	const dir = KEY_TO_DIRECTION[e.code];
  if (dir && pressedDirections.indexOf(dir) === -1) {
		lastInputTimeMs = performance.now(); // Set the last input time to the current time
		pressedDirections.unshift(dir) // Add the direction to the beginning of the array
  }
})

document.addEventListener("keyup", (e) => {
  const dir = KEY_TO_DIRECTION[e.code]; 
  const index = pressedDirections.indexOf(dir); // Find the index of the direction in the arra
  if (index > -1) { 
    pressedDirections.splice(index, 1) // Remove the direction from the array
  }
});

window.addEventListener('load', function() {
  const message = document.getElementById('start-message');
  // Fade in the message
  setTimeout(() => {
      message.style.opacity = 1;
  }, 500); // Delay the fade in to give effect

  // Fade out the message after a few seconds
  setTimeout(() => {
      message.style.opacity = 0;
      setTimeout(() => {
          message.style.display = 'none';
      }, 2000); // Wait for the fade out transition to finish
  }, 4000); // Display time of the message
});

window.addEventListener("resize", function(){
  // Update the camera and character position when the window is resized
  console.log('Window was resized. This is the pixelSize', pixelSize);
})