const CAMERA_LEFT_OFFSET_PX = 66;
const CAMERA_TOP_OFFSET_PX = 42;
const LOOKAHEAD_DISTANCE = 20;

const DIRECTION = {
  up: "up",
  down: "down",
  left: "left",
  right: "right",
}

const KEY_TO_DIRECTION = {
  'ArrowUp': DIRECTION.up,
  'ArrowLeft': DIRECTION.left,
  'ArrowRight': DIRECTION.right,
  'ArrowDown': DIRECTION.down,
}

const character = document.querySelector(".character");
const map = document.querySelector(".map");
const pixelSize = parseInt(
  getComputedStyle(document.documentElement).getPropertyValue('--pixel-size')
);

//start in the middle of the map
let x = 90;
let y = 34;
let camX = x; 
let camY = y; 
let pressedDirections = []; //State of which arrow keys we are holding down
let speed = 1; //How fast the character moves in pixels per frame
let gameMap2DArray = [];

async function loadMapData() {
  try {
    const response = await fetch("assets/IntGrid.csv");
    const csvText = await response.text();
    const mapData = parseCSV(csvText);
    gameMap2DArray = mapData;
    console.log(mapData);
  } catch (error) {
    console.error("Error fetching map data", error);
  }
 }

 loadMapData();

function parseCSV(csvText) {
  return csvText.trim().split('\n').map(row => row.split(',').map(Number));
 }

//Linear interpolation which will be used to move the cam smoothly
function lerp(currentVal, desiredVal, time) {
  return currentVal +(desiredVal - currentVal) * time;
}

function easeInQuad(t) { return t*t; }

const moveCharacter = (lastMoveTimeMs, currentTimeMs) => {
  //console.log("moveCharacter", lastMoveTimeMs, currentTimeMs);
  //console.log(gameMap2DArray);

  const direction = pressedDirections[0];
  if (direction) {
    if (direction === DIRECTION.right) {x += speed;}
    if (direction === DIRECTION.left) {x -= speed;}
    if (direction === DIRECTION.down) {y += speed;}
    if (direction === DIRECTION.up) {y -= speed;}
    character.setAttribute("facing", direction);
  }
  character.setAttribute("walking", direction ? "true" : "false");

  // //Limits (gives the illusion of walls)
  // const leftLimit = -8;
  // const rightLimit = (16 * 32)+8;
  // const topLimit = -8 + 32;
  // const bottomLimit = (32 * 7);
  // if (x < leftLimit) { x = leftLimit; }
  // if (x > rightLimit) { x = rightLimit; }
  // if (y < topLimit) { y = topLimit; }
  // if (y > bottomLimit) { y = bottomLimit; }

  //Camera Look Ahead
  let lahX = 0;
  let lahY = 0;
  // if (direction === DIRECTION.left) { lahX -= LOOKAHEAD_DISTANCE; }
  // if (direction === DIRECTION.right) { lahX += LOOKAHEAD_DISTANCE; }
  // if (direction === DIRECTION.up) { lahY -= LOOKAHEAD_DISTANCE; }
  // if (direction === DIRECTION.down) { lahY += LOOKAHEAD_DISTANCE; }
  
  let camDesX = x + lahX;
  let camDesY = y + lahY;
  
  // Calculate camera position
  const camCatchupTime = 1000;
  let t = (currentTimeMs - lastMoveTimeMs) / camCatchupTime; // Time from 0-1
  t = Math.max(0, Math.min(1, t)); // Clamp to 0-1
  t = easeInQuad(t); // Ease in the value
  camX = lerp(camX, camDesX, t);
  camY = lerp(camY, camDesY, t);

  // Update camera
  const camTransformLeft = -camX * pixelSize + (pixelSize * CAMERA_LEFT_OFFSET_PX);
  const camTransformTop = -camY * pixelSize + (pixelSize * CAMERA_TOP_OFFSET_PX);
  map.style.transform = `translate3d( ${camTransformLeft}px, ${camTransformTop}px, 0 )`;

  // Update character
  character.style.transform = `translate3d( ${x * pixelSize}px, ${y * pixelSize}px, 0 )`;
}

// Set up the game loop
const frameDuration = 1 / 60;
let previousTickMs = 0;
let lastInputTimeMs = 0;

const tick = (currentTimeMs) => {
  let delta = (currentTimeMs - previousTickMs) / 1000;
  if (delta >= frameDuration) {
    moveCharacter(lastInputTimeMs, currentTimeMs);
    previousTickMs = currentTimeMs;
  }

  // Schedule the next frame
  requestAnimationFrame(tick);
}
// Start the game loop
requestAnimationFrame(tick);


/* Direction key state */
document.addEventListener("keydown", (e) => {
  const dir = KEY_TO_DIRECTION[e.code];
  if (dir && pressedDirections.indexOf(dir) === -1) {
    lastInputTimeMs = performance.now();
    pressedDirections.unshift(dir)
  }
})

document.addEventListener("keyup", (e) => {
  const dir = KEY_TO_DIRECTION[e.code];
  const index = pressedDirections.indexOf(dir);
  if (index > -1) {
    pressedDirections.splice(index, 1)
  }
});