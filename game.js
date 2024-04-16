// Defing the dimensions of the game map and pizel size here to keep the game logic separate from the CSS
const TILE_SIZE_PX = 4; // Size of each tile in pixels
const GAME_MAP_CELL_DIMENSIONS = 32; // 32 x 32 cells

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

// Map key codes to directions (up, down, left, right)
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

// Set the initial position of the character and camera
// Depending on the size of the browser window, the positions might get multiplied by 2, 3,or 4
let x = 0
let y = 0;
let camX = x; 
let camY = y; 
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

function convertCSSPositionToArrayIndex(x, y) {
	const columnIndex = Math.ceil(x / 4);
	const rowIndex = Math.ceil(y / 4);
	return { rowIndex, columnIndex };
}

function isTileWalkable(x, y) {
  // Check if the position is outside the bounds of the game map
  if (y < 0 || y >= gameMap2DArray.length || x < 0 || x >= gameMap2DArray[y].length) { 
    return false;
  }
	return gameMap2DArray[y][x] === 0; // 0 = walkable, 1 = boundary
}

const moveCharacter = (lastMoveTimeMs, currentTimeMs) => {
   // Get the direction we are moving
  const direction = pressedDirections[0]; 
  if (direction) {
    console.log("Player is moving", direction);
    if (direction === DIRECTION.right ) {x += speed;} 
    if (direction === DIRECTION.left ) {x -= speed;}
    if (direction === DIRECTION.down) {y += speed;}
    if (direction === DIRECTION.up) {y -= speed;}

    // Set the direction the character is facing which will be used to change the sprite in the CSS
    character.setAttribute("facing", direction); 
  }
   // Set the walking attribute to true if we are moving and false if we are not
  character.setAttribute("walking", direction ? "true" : "false");

  //Camera Look Ahead
  let lahX = 0; 
  let lahY = 0;
  // if (direction === DIRECTION.left) { lahX -= LOOKAHEAD_DISTANCE; }
  // if (direction === DIRECTION.right) { lahX += LOOKAHEAD_DISTANCE; }
  // if (direction === DIRECTION.up) { lahY -= LOOKAHEAD_DISTANCE; }
  // if (direction === DIRECTION.down) { lahY += LOOKAHEAD_DISTANCE; }
  
  // Camera desired positions in
  let camDesX = x + lahX; 
  let camDesY = y + lahY; 
  
  // Calculate camera position
  const camCatchupTime = 1000; // Time in ms for the camera to catch up to the player
  let t = (currentTimeMs - lastMoveTimeMs) / camCatchupTime; // Time from 0-1
  t = Math.max(0, Math.min(1, t)); // Clamp to 0-1
  t = easeInQuad(t); // Ease in the value
  camX = lerp(camX, camDesX, t);
  camY = lerp(camY, camDesY, t);

  // Update camera
  const camTransformLeft = -camX * pixelSize + (pixelSize * CAMERA_LEFT_OFFSET_PX);
  const camTransformTop = -camY * pixelSize + (pixelSize * CAMERA_TOP_OFFSET_PX);
  
  // Set the camera position in the CSS 
  map.style.transform = `translate3d( ${camTransformLeft}px, ${camTransformTop}px, 0 )`;

  // Update character position in the CSS
  character.style.transform = `translate3d( ${x * pixelSize}px, ${y * pixelSize}px, 0 )`;
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
	const { rowIndex, columnIndex } = convertCSSPositionToArrayIndex(x, y);
	console.log(`Player walked on grid at row ${rowIndex}, column ${columnIndex}`);
  if (isTileWalkable(rowIndex, rowIndex)) {
    console.log("Player can walk here");
  }else {
    console.log("Player can't walk here");
  }
  if (dir && pressedDirections.indexOf(dir) === -1) {
   lastInputTimeMs = performance.now(); // Set the last input time to the current time
   pressedDirections.unshift(dir) // Add the direction to the beginning of the array
  }
})

document.addEventListener("keyup", (e) => {
  const dir = KEY_TO_DIRECTION[e.code]; 
  const index = pressedDirections.indexOf(dir); // Find the index of the direction in the array
  if (index > -1) { 
    pressedDirections.splice(index, 1) // Remove the direction from the array
  }
});