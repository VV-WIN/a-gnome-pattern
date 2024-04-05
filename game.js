const directions = {
   up: "up",
   down: "down",
   left: "left",
   right: "right",
}
const keys = {
   'ArrowUp': directions.up,
   'ArrowLeft': directions.left,
   'ArrowRight': directions.right,
   'ArrowDown': directions.down,
}

const character = document.querySelector(".character");
const map = document.querySelector(".map");

//start in the middle of the map
let x = 90;
let y = 34;
let camX = x; 
let camY = y; 
let pressedDirections = []; //State of which arrow keys we are holding down
const speed = 1; //How fast the character moves in pixels per frame

// Linear interpolation which will be used to move the cam smoothly
function lerp(currentVal, desiredVal, time) {
   return currentVal * (1-time) + desiredVal * time;
}

const placeCharacter = () => {
   const pixelSize = parseInt(
       getComputedStyle(document.documentElement).getPropertyValue('--pixel-size')
   );

   const direction = pressedDirections[0];
   if (direction) {
      if (direction === directions.right) {x += speed;}
      if (direction === directions.left) {x -= speed;}
      if (direction === directions.down) {y += speed;}
      if (direction === directions.up) {y -= speed;}
      character.setAttribute("facing", direction);
   }
   character.setAttribute("walking", direction ? "true" : "false");

   //Limits (gives the illusion of walls)
   const leftLimit = -8;
   const rightLimit = (16 * 11)+8;
   const topLimit = -8 + 32;
   const bottomLimit = (16 * 7);
   if (x < leftLimit) { x = leftLimit; }
   if (x > rightLimit) { x = rightLimit; }
   if (y < topLimit) { y = topLimit; }
   if (y > bottomLimit) { y = bottomLimit; }


   const CAMERA_LEFT_OFFSET_PX = 66;
   const CAMERA_TOP_OFFSET_PX = 42;

   //Update camera
   const camera_transform_left = -camX*pixelSize+(pixelSize * CAMERA_LEFT_OFFSET_PX);
   const camera_transform_top = -camY*pixelSize+(pixelSize * CAMERA_TOP_OFFSET_PX);
   map.style.transform = `translate3d( ${camera_transform_left}px, ${camera_transform_top}px, 0 )`;

   //Update character
   character.style.transform = `translate3d( ${x*pixelSize}px, ${y*pixelSize}px, 0 )`;
}

//Set up the game loop
let previousMs;
const stepTime = 1 / 60;
const tick = (timestampMs) => {
   if (previousMs === undefined) {
      previousMs = timestampMs;
   }
   let delta = (timestampMs - previousMs) / 1000;
   while (delta >= stepTime) {
      placeCharacter();
      delta -= stepTime;
   }
   previousMs = timestampMs - delta * 1000; // Make sure we don't lose unprocessed (delta) time

   //Recapture the callback to be able to shut it off
   requestAnimationFrame(tick);
}
requestAnimationFrame(tick); //kick off the first step!


/* Direction key state */
document.addEventListener("keydown", (e) => {
   const dir = keys[e.code];
   if (dir && pressedDirections.indexOf(dir) === -1) {
      pressedDirections.unshift(dir)
   }
})

document.addEventListener("keyup", (e) => {
   const dir = keys[e.code];
   const index = pressedDirections.indexOf(dir);
   if (index > -1) {
      pressedDirections.splice(index, 1)
   }
});