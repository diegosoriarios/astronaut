Array.prototype.last = function () {
  return this[this.length - 1];
};

let phase = "waiting";
let lastTimestamp, heroX, heroY, sceneOffset;

let platforms = sticks = stars = [];

let score = highscore = 0;

const colorrange = [0,60,240];

const canvasWidth = 375;
const canvasHeight = 375;
const platformHeight = 100;
const heroDistanceFromEdge = 10;
const paddingX = 100;
const perfectAreaSize = 10;

const stretchingSpeed = 4;
const turningSpeed = 4;
const walkingSpeed = 4;
const transitioningSpeed = 2;
const fallingSpeed = 2;

const heroWidth = 17;
const heroHeight = 30;

const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");

const perfectElement = document.getElementById("perfect");
const restartButton = document.getElementById("restart");
const scoreElement = document.getElementById("score");
scoreElement.style.color = "white";

resetGame();

function resetGame() {
  highscore = localStorage.getItem("spaceHighScore") || 0;
  phase = "waiting";
  lastTimestamp = undefined;
  sceneOffset = 0;
  score = 0;

  perfectElement.style.opacity = 0;
  restartButton.style.display = "none";
  scoreElement.innerText = `${score}/${highscore}`;

  platforms = [{ x: 50, w: 50 }];
  generatePlatform();
  generatePlatform();
  generatePlatform();
  generatePlatform();

  sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];

  heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
  heroY = 0;

  for (let i = 0; i < 50; i++) {
    let x = Math.random() * canvas.offsetWidth;
    let y = Math.random() * canvas.offsetHeight;
    let radius = Math.random() * 1.2;
    let hue = colorrange[getRandom(0,colorrange.length - 1)];
    let sat = getRandom(50,100);
    stars.push({x,y,radius,hue,sat});
  }

  draw();
}

function generatePlatform() {
  const minimumGap = 40;
  const maximumGap = 200;
  const minimumWidth = 20;
  const maximumWidth = 100;

  const lastPlatform = platforms[platforms.length - 1];
  let furthestX = lastPlatform.x + lastPlatform.w;

  const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));
  const w =
    minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));

  platforms.push({ x, w });
}

resetGame();

window.addEventListener("keydown", handleKeyDown, false);
window.addEventListener("mousedown", handleMouseDown, false);
window.addEventListener("mouseup", handleMouseUp, false);
window.addEventListener("resize", handleResize, false);

window.requestAnimationFrame(animate);

function animate(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    window.requestAnimationFrame(animate);
    return;
  }

  switch (phase) {
    case "waiting":
      return;
    case "stretching": {
      sticks.last().length += (timestamp - lastTimestamp) / stretchingSpeed;
      break;
    }
    case "turning": {
      sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;

      if (sticks.last().rotation > 90) {
        sticks.last().rotation = 90;

        const [nextPlatform, perfectHit] = thePlatformTheStickHits();
        if (nextPlatform) {
          score += perfectHit ? 2 : 1;
          scoreElement.innerText = `${score}/${highscore}`;

          if (perfectHit) {
            perfectElement.style.opacity = 1;
            setTimeout(() => (perfectElement.style.opacity = 0), 1000);
          }

          generatePlatform();
        }

        phase = "walking";
      }
      break;
    }
    case "walking": {
      heroX += (timestamp - lastTimestamp) / walkingSpeed;

      const [nextPlatform] = thePlatformTheStickHits();
      if (nextPlatform) {
        const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = "transitioning";
        }
      } else {
        const maxHeroX = sticks.last().x + sticks.last().length + heroWidth;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = "falling";
        }
      }
      break;
    }
    case "transitioning": {
      sceneOffset += (timestamp - lastTimestamp) / transitioningSpeed;

      const [nextPlatform] = thePlatformTheStickHits();
      if (sceneOffset > nextPlatform.x + nextPlatform.w - paddingX) {
        sticks.push({
          x: nextPlatform.x + nextPlatform.w,
          length: 0,
          rotation: 0
        });
        if (platforms.length > 5) {
          platforms.shift();
          sticks.shift();
        }
        phase = "waiting";
      }
      break;
    }
    case "falling": {
      if (sticks.last().rotation < 180)
        sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;

      heroY += (timestamp - lastTimestamp) / fallingSpeed;
      const maxHeroY =
        platformHeight + 100 + (window.innerHeight - canvasHeight) / 2;
      if (heroY > maxHeroY) {
        restartButton.style.display = "block";
        if (score > parseInt(highscore)) localStorage.setItem("spaceHighScore", score);
        return;
      }
      break;
    }
    default:
      throw Error("Wrong phase");
  }

  draw();
  window.requestAnimationFrame(animate);

  lastTimestamp = timestamp;
}

function thePlatformTheStickHits() {
  if (sticks.last().rotation != 90)
    throw Error(`Stick is ${sticks.last().rotation}°`);
  const stickFarX = sticks.last().x + sticks.last().length;

  const platformTheStickHits = platforms.find(
    (platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w
  );

  if (
    platformTheStickHits &&
    platformTheStickHits.x + platformTheStickHits.w / 2 - perfectAreaSize / 2 <
    stickFarX &&
    stickFarX <
    platformTheStickHits.x + platformTheStickHits.w / 2 + perfectAreaSize / 2
  )
    return [platformTheStickHits, true];

  return [platformTheStickHits, false];
}

function draw() {
  ctx.save();
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  background();
  drawStars();
  drawEarth();

  ctx.translate(
    (window.innerWidth - canvasWidth) / 2 - sceneOffset,
    (window.innerHeight - canvasHeight) / 2
  );

  drawPlatforms();
  drawHero();
  drawSticks();

  ctx.restore();
}

restartButton.addEventListener("click", function (event) {
  event.preventDefault();
  resetGame();
  restartButton.style.display = "none";
});

function drawPlatforms() {
  platforms.forEach(({ x, w }) => {
    ctx.fillStyle = "white";
    ctx.fillRect(
      x,
      canvasHeight - platformHeight,
      w,
      platformHeight + (window.innerHeight - canvasHeight) / 2
    );

    if (sticks.last().x < x) {
      ctx.fillStyle = "rgba(20, 106, 221, 1)";
      ctx.fillRect(
        x + w / 2 - perfectAreaSize / 2,
        canvasHeight - platformHeight,
        perfectAreaSize,
        perfectAreaSize
      );
    }
  });
}

function drawHero() {
  ctx.save();
  ctx.fillStyle = "white";
  ctx.translate(
    heroX - heroWidth / 2,
    heroY + canvasHeight - platformHeight - heroHeight / 2
  );

  ctx.fillRect(
    -heroWidth / 2,
    -heroHeight / 2,
    heroWidth,
    heroHeight - 4,
    5
  );

  const legDistance = 5;
  ctx.beginPath();
  ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "white";
  ctx.fillRect(heroWidth / 2 - 22, 0, 5, 10);

  ctx.beginPath();
  ctx.fillStyle = "white";
  ctx.arc(0, -7, 12, 0, Math.PI * 2, false);
  ctx.fill();

  ctx.fillStyle = "rgba(20, 106, 221, 1)";
  ctx.beginPath();
  ctx.arc(5, -8, heroWidth / 3, 0, Math.PI * 2, false);
  ctx.fill();

  ctx.restore();
}

function drawSticks() {
  sticks.forEach(stick => {
    ctx.save();

    ctx.strokeStyle = "white";
    ctx.translate(stick.x, canvasHeight - platformHeight);
    ctx.rotate((Math.PI / 180) * stick.rotation);

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -stick.length);
    ctx.stroke();

    ctx.restore();
  });
}

function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function drawStars() {
  stars.forEach(({x,y,radius,hue,sat}) => {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 360);
    ctx.fillStyle = "hsl(" + hue + ", " + sat + "%, 88%)";
    ctx.fill();
  })
}

function background() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
}

function drawEarth() {
  ctx.fillStyle = "rgba(20, 106, 221, 0.3)";
  ctx.beginPath();
  ctx.arc(0, canvas.height, canvas.height / 1.5, 0, 360);
  ctx.fill();
  ctx.fillStyle = "rgba(20, 106, 221, 0.5)";
  ctx.beginPath();
  ctx.arc(0, canvas.height, canvas.height / 2, 0, 360);
  ctx.fill();
  ctx.fillStyle = "rgba(20, 106, 221, 1)";
  ctx.beginPath();
  ctx.arc(0, canvas.height, canvas.height / 3, 0, 360);
  ctx.fill();
}