import { isMobile } from './helpers.mjs';

/**
 * This file deals with what happens when you click "Draw" button text to handwriting.
 */

let inkColor = '#000f55';
const pointSize = isMobile ? 0.5 : 1;
let lastX = null;
let lastY = null;

const drawCanvas = document.querySelector('canvas#diagram-canvas');
// Set smaller canvas on mobiles
if (isMobile) {
  drawCanvas.height = 150;
  drawCanvas.width = 300;
}
const ctx = drawCanvas.getContext('2d');

function setInkColor(color) {
  inkColor = color;
}

function toCanvasPosition(eventX, eventY) {
  const canvasRect = drawCanvas.getBoundingClientRect();
  // Account for CSS scaling of the canvas element
  const scaleX = canvasRect.width ? drawCanvas.width / canvasRect.width : 1;
  const scaleY = canvasRect.height ? drawCanvas.height / canvasRect.height : 1;
  return [
    (eventX - canvasRect.left) * scaleX,
    (eventY - canvasRect.top) * scaleY
  ];
}

function drawPoint(x, y) {
  if (lastX !== null && lastY !== null && (x !== lastX || y !== lastY)) {
    ctx.lineWidth = 2 * pointSize;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.strokeStyle = inkColor;
    ctx.moveTo(...toCanvasPosition(lastX, lastY));
    ctx.lineTo(...toCanvasPosition(x, y));
    ctx.stroke();
  }

  ctx.beginPath(); // Start path
  ctx.fillStyle = inkColor;
  // Draw a point using the arc function of the canvas with a point structure.
  ctx.arc(...toCanvasPosition(x, y), pointSize, 0, Math.PI * 2, true);
  ctx.fill(); // Close

  lastX = x;
  lastY = y;
}

function toggleDrawCanvas() {
  const drawContainer = document.querySelector('.draw-container');
  if (drawContainer.classList.contains('show')) {
    // draw canvas is currently shown
    document.querySelector('main').style.display = 'block';
  } else {
    document.querySelector('main').style.display = 'none';
  }

  drawContainer.classList.toggle('show');
}

function clear() {
  ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
}

function downloadFile() {
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = drawCanvas.toDataURL('image/png');
  a.download = 'diagram.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function addToPaper() {
  document.querySelector('#note').innerHTML =
    /* html */ `
    <img style="width: 100%;" src="${drawCanvas.toDataURL('image/png')}" />
  ` + document.querySelector('#note').innerHTML;
  toggleDrawCanvas();
}

const imageInput = document.querySelector('#image-to-add-in-canvas');

function drawImageOnCanvas(image) {
  // Fit image inside canvas while keeping aspect ratio
  const ratio = Math.min(
    drawCanvas.width / image.width,
    drawCanvas.height / image.height
  );
  const newWidth = image.width * ratio;
  const newHeight = image.height * ratio;
  ctx.drawImage(
    image,
    (drawCanvas.width - newWidth) / 2,
    (drawCanvas.height - newHeight) / 2,
    newWidth,
    newHeight
  );
}

imageInput.addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener('load', function () {
    const tempImage = new Image();
    tempImage.onload = () => drawImageOnCanvas(tempImage);
    tempImage.src = this.result;
  });
  reader.readAsDataURL(file);
});

function addImageToPaper() {
  imageInput.value = '';
  imageInput.click();
}

let isMouseDown = false;

const onMouseDown = (e) => {
  isMouseDown = true;
  lastX = e.clientX;
  lastY = e.clientY;
  drawPoint(e.clientX, e.clientY);
};

const onMouseUp = (e) => {
  isMouseDown = false;
  lastX = null;
  lastY = null;
};

const onMouseMove = (e) => {
  if (isMouseDown) {
    drawPoint(e.clientX, e.clientY);
  }
};

const onTouchStart = (e) => {
  isMouseDown = true;
  const touchX = e.touches[0].clientX;
  const touchY = e.touches[0].clientY;

  lastX = touchX;
  lastY = touchY;
  drawPoint(touchX, touchY);
};

const onTouchEnd = (e) => {
  isMouseDown = false;
  lastX = null;
  lastY = null;
};

const onTouchMove = (e) => {
  if (e.cancelable) e.preventDefault(); // stop page scrolling while drawing
  const touchX = e.touches[0].clientX;
  const touchY = e.touches[0].clientY;

  drawPoint(touchX, touchY);
};

/* Event listeners */
document.querySelector('#clear-draw-canvas').addEventListener('click', clear);
document
  .querySelector('#add-to-paper-button')
  .addEventListener('click', addToPaper);
document
  .querySelector('#draw-download-button')
  .addEventListener('click', downloadFile);

document
  .querySelector('#add-new-image-button')
  .addEventListener('click', addImageToPaper);

if (isMobile) {
  drawCanvas.addEventListener('touchstart', onTouchStart, { passive: true });
  drawCanvas.addEventListener('touchend', onTouchEnd, { passive: true });
  drawCanvas.addEventListener('touchmove', onTouchMove, { passive: false });
} else {
  drawCanvas.addEventListener('mousedown', onMouseDown, { passive: true });
  drawCanvas.addEventListener('mouseup', onMouseUp, { passive: true });
  drawCanvas.addEventListener('mouseleave', onMouseUp, { passive: true });
  drawCanvas.addEventListener('mousemove', onMouseMove, { passive: true });
}

export { setInkColor, drawPoint, toggleDrawCanvas };
