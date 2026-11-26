/**
 * A small drawing pad for adding diagrams to the page.
 * Uses pointer events, so mouse, touch and pen all work the same way.
 */
import { $, downloadURL, loadImage, readFile, toast } from './utils.js';
import { getInkColor, insertImage } from './preview.js';

const dialog = $('#drawpad');
const canvas = $('#drawpad-canvas');
const ctx = canvas.getContext('2d');
const penSize = $('#pen-size');

let drawing = false;
let last = null;

/** Converts a pointer event to canvas coordinates. */
function toCanvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) * canvas.width) / rect.width,
    y: ((e.clientY - rect.top) * canvas.height) / rect.height
  };
}

function strokeTo(point) {
  ctx.strokeStyle = getInkColor();
  ctx.fillStyle = getInkColor();
  ctx.lineWidth = Number(penSize.value) * 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  if (last) {
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  } else {
    ctx.arc(point.x, point.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  last = point;
}

function bindDrawing() {
  canvas.addEventListener('pointerdown', (e) => {
    drawing = true;
    last = null;
    canvas.setPointerCapture(e.pointerId);
    strokeTo(toCanvasPoint(e));
  });
  canvas.addEventListener('pointermove', (e) => {
    if (drawing) strokeTo(toCanvasPoint(e));
  });
  const stop = () => {
    drawing = false;
    last = null;
  };
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
}

const isEmpty = () =>
  !ctx
    .getImageData(0, 0, canvas.width, canvas.height)
    .data.some((value, i) => i % 4 === 3 && value !== 0);

function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

async function addBackgroundImage(file) {
  try {
    const image = await loadImage(await readFile(file, 'readAsDataURL'));
    const ratio = Math.min(
      canvas.width / image.width,
      canvas.height / image.height
    );
    const width = image.width * ratio;
    const height = image.height * ratio;
    ctx.drawImage(
      image,
      (canvas.width - width) / 2,
      (canvas.height - height) / 2,
      width,
      height
    );
  } catch (err) {
    toast('That image could not be loaded', { error: true });
  }
}

/** PNG with a white background, so it looks right in any image viewer. */
function toWhitePNG() {
  const copy = document.createElement('canvas');
  copy.width = canvas.width;
  copy.height = canvas.height;
  const copyCtx = copy.getContext('2d');
  copyCtx.fillStyle = '#fff';
  copyCtx.fillRect(0, 0, copy.width, copy.height);
  copyCtx.drawImage(canvas, 0, 0);
  return copy.toDataURL('image/png');
}

export function initDrawpad() {
  bindDrawing();

  $('#open-drawpad').addEventListener('click', () => dialog.showModal());
  dialog
    .querySelector('[data-close]')
    .addEventListener('click', () => dialog.close());
  // Close when clicking the backdrop.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  $('#drawpad-clear').addEventListener('click', clear);

  const imageInput = $('#drawpad-image');
  $('#drawpad-add-image').addEventListener('click', () => imageInput.click());
  imageInput.addEventListener('change', () => {
    if (imageInput.files[0]) addBackgroundImage(imageInput.files[0]);
    imageInput.value = '';
  });

  $('#drawpad-download').addEventListener('click', () =>
    downloadURL(toWhitePNG(), 'diagram.png')
  );

  $('#drawpad-insert').addEventListener('click', () => {
    if (isEmpty()) {
      toast('Draw something first');
      return;
    }
    insertImage(canvas.toDataURL('image/png'));
    clear();
    dialog.close();
    toast('Drawing added to the top of the page');
  });
}
