function handleMouseDown(e) {
  if (phase == "waiting") {
    lastTimestamp = undefined;
    phase = "stretching";
    window.requestAnimationFrame(animate);
  }
}

function handleMouseUp(e) {
  if (phase == "stretching") {
    phase = "turning";
  }
}

function handleResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
}

function handleKeyDown(e) {
  if (e.key == " ") {
    e.preventDefault();
    resetGame();
    return;
  }
}