/**
 * Small shared helpers used across the app.
 */

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [
  ...root.querySelectorAll(selector)
];

export const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Reads a File with FileReader.
 * @param {File} file
 * @param {'readAsDataURL'|'readAsArrayBuffer'} method
 * @return {Promise<string|ArrayBuffer>}
 */
export function readFile(file, method) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader[method](file);
  });
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load image'));
    image.src = src;
  });
}

let toastTimer;

/**
 * Shows a short, non-blocking message at the bottom of the screen.
 * @param {string} message
 * @param {{error?: boolean}} [options]
 */
export function toast(message, { error = false } = {}) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.toggle('is-error', error);
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 3500);
}

export function downloadURL(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
