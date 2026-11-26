/**
 * Turns the paper preview into page images.
 *
 * Long text is split into as many pages as needed by adding one token
 * (a word, a run of whitespace or an HTML tag) at a time until the page
 * overflows. Each page is then captured with html2canvas.
 */
import { $, randomInt } from './utils.js';

const paper = $('#paper');
const paperText = $('#paper-text');
const overlay = $('#paper-overlay');

/**
 * Some fonts render a few pixels lower in html2canvas than in the browser.
 * This shift is applied only while capturing.
 */
const CAPTURE_SHIFT = { 'Homemade Apple': 5 };

const isOverflowing = () => paper.scrollHeight > paper.clientHeight + 1;

/**
 * Splits HTML into words, whitespace and tags so tags are never cut in half.
 * @param {string} html
 * @return {string[]}
 */
export function tokenize(html) {
  return html.split(/(<[^>]*>|\s+)/).filter(Boolean);
}

/**
 * Splits the current paper text into page-sized chunks of HTML.
 * Leaves the paper text in an undefined state; callers must restore it.
 * @param {string} html
 * @return {string[]}
 */
function paginate(html) {
  paperText.innerHTML = html;
  if (!isOverflowing()) return [html];

  const tokens = tokenize(html);
  const pages = [];
  let index = 0;

  while (index < tokens.length) {
    const start = index;
    let pageHTML = '';

    while (index < tokens.length) {
      const candidate = pageHTML + tokens[index];
      paperText.innerHTML = candidate;
      // Always place at least one token per page so we can't loop forever.
      if (isOverflowing() && index > start) break;
      pageHTML = candidate;
      index++;
    }

    // Don't start the next page with blank space.
    while (index < tokens.length && /^\s+$/.test(tokens[index])) index++;

    if (pageHTML.trim()) pages.push(pageHTML);
  }
  return pages;
}

function applyEffect(effect) {
  overlay.classList.toggle('is-visible', effect !== 'none');
  // Scanner light stays between 50° and 120° so margins don't disappear.
  const angle = effect === 'scanner' ? randomInt(50, 120) : randomInt(0, 359);
  overlay.style.background =
    effect === 'none' ? '' : `linear-gradient(${angle}deg, #0008, #0000)`;
}

/** Boosts contrast to mimic a scanned page. */
function boostContrast(canvas, amount = 0.55) {
  const ctx = canvas.getContext('2d');
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = image;
  const contrast = amount * 255;
  const factor = (contrast + 255) / (255.01 - contrast);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = factor * (data[i] - 128) + 128;
    data[i + 1] = factor * (data[i + 1] - 128) + 128;
    data[i + 2] = factor * (data[i + 2] - 128) + 128;
  }
  ctx.putImageData(image, 0, 0);
}

async function capturePage({ scale, effect }) {
  paper.scrollTop = 0;
  applyEffect(effect);
  const canvas = await window.html2canvas(paper, {
    scale,
    scrollX: 0,
    scrollY: -window.scrollY,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false
  });
  if (effect === 'scanner') boostContrast(canvas);
  return canvas;
}

/**
 * Generates one canvas per page from the current paper content.
 * @param {{scale: number, effect: 'shadows'|'scanner'|'none'}} options
 * @return {Promise<HTMLCanvasElement[]>}
 */
export async function generatePages({ scale, effect }) {
  const originalHTML = paperText.innerHTML;
  const font = $('#font').selectedOptions[0]?.text || '';
  const shift = CAPTURE_SHIFT[font] || 0;

  document.activeElement?.blur();
  paper.classList.add('is-capturing');
  paper.style.setProperty('--capture-shift', `${shift}px`);

  try {
    const pages = paginate(originalHTML);
    const canvases = [];
    for (const pageHTML of pages) {
      paperText.innerHTML = pageHTML;
      canvases.push(await capturePage({ scale, effect }));
    }
    return canvases;
  } finally {
    paperText.innerHTML = originalHTML;
    paper.classList.remove('is-capturing');
    paper.style.removeProperty('--capture-shift');
    applyEffect('none');
  }
}
