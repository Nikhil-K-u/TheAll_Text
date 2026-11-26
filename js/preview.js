/**
 * Connects the style controls to the live page preview.
 * Styles are applied as CSS custom properties on the paper element
 * (see .paper in css/styles.css).
 */
import { $, $$, escapeHTML, readFile, toast } from './utils.js';

const paper = $('#paper');
const paperText = $('#paper-text');

const DEFAULT_FONT = "'Homemade Apple', cursive";
const DEFAULT_INK = '#000f55';

let customFontCount = 0;
let paperImageURL = null;

const setVar = (name, value) => paper.style.setProperty(name, value);

/** Range inputs: id → CSS variable */
const RANGE_CONTROLS = {
  'font-size': { variable: '--hw-size', unit: 'pt' },
  offset: { variable: '--offset', unit: 'px' },
  'word-spacing': { variable: '--word-spacing', unit: 'px' },
  'letter-spacing': { variable: '--letter-spacing', unit: 'px' }
};

function bindRanges() {
  for (const [id, { variable, unit }] of Object.entries(RANGE_CONTROLS)) {
    const input = $(`#${id}`);
    const output = $(`output[for="${id}"]`);
    const apply = () => {
      setVar(variable, input.value + unit);
      output.textContent = input.value + unit;
    };
    input.addEventListener('input', apply);
    apply();
  }
}

function setInk(color) {
  setVar('--ink', color);
  let matchedPreset = false;
  $$('.swatch[data-ink]').forEach((swatch) => {
    const active = swatch.dataset.ink === color;
    matchedPreset ||= active;
    swatch.classList.toggle('is-active', active);
    swatch.setAttribute('aria-checked', String(active));
  });
  $('.swatch-custom').classList.toggle('is-active', !matchedPreset);
}

function bindInk() {
  $$('.swatch[data-ink]').forEach((swatch) =>
    swatch.addEventListener('click', () => setInk(swatch.dataset.ink))
  );
  $('#ink-custom').addEventListener('input', (e) => setInk(e.target.value));
}

function bindFonts() {
  const select = $('#font');
  select.addEventListener('change', () => setVar('--hw-font', select.value));

  $('#font-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      customFontCount += 1;
      const family = `User Font ${customFontCount}`;
      const data = await readFile(file, 'readAsArrayBuffer');
      const face = new FontFace(family, data);
      document.fonts.add(await face.load());

      const name = file.name.replace(/\.[^.]+$/, '');
      const option = new Option(name, `'${family}'`);
      select.add(option);
      select.value = option.value;
      setVar('--hw-font', option.value);
      toast(`Font "${name}" added`);
    } catch (err) {
      toast('That font file could not be loaded. Try a .ttf or .otf file.', {
        error: true
      });
    } finally {
      e.target.value = '';
    }
  });
}

function bindPaper() {
  const toggle = (id, className) => {
    const input = $(`#${id}`);
    const apply = () => paper.classList.toggle(className, input.checked);
    input.addEventListener('change', apply);
    apply();
  };
  toggle('toggle-margin', 'has-margin');
  toggle('toggle-lines', 'has-lines');

  const fileInput = $('#paper-file');
  const resetButton = $('#paper-reset');

  const clearBackground = () => {
    if (paperImageURL) URL.revokeObjectURL(paperImageURL);
    paperImageURL = null;
    paper.style.backgroundImage = '';
    fileInput.value = '';
    resetButton.hidden = true;
  };

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return clearBackground();
    if (paperImageURL) URL.revokeObjectURL(paperImageURL);
    paperImageURL = URL.createObjectURL(file);
    paper.style.backgroundImage = `url("${paperImageURL}")`;
    resetButton.hidden = false;
  });
  resetButton.addEventListener('click', clearBackground);
}

function bindText() {
  // Paste as plain text so formatting from other apps doesn't leak in.
  paperText.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const html = escapeHTML(text).replace(/\r?\n/g, '<br>');
    if (!document.execCommand('insertHTML', false, html)) {
      paperText.insertAdjacentHTML('beforeend', html);
    }
  });

  $('#clear-text').addEventListener('click', () => {
    paperText.innerHTML = '';
    paperText.focus();
  });
}

function bindReset() {
  $('#reset-settings').addEventListener('click', () => {
    $('#font').value = DEFAULT_FONT;
    setVar('--hw-font', DEFAULT_FONT);
    setInk(DEFAULT_INK);
    for (const id of Object.keys(RANGE_CONTROLS)) {
      const input = $(`#${id}`);
      input.value = input.defaultValue;
      input.dispatchEvent(new Event('input'));
    }
    for (const id of ['toggle-margin', 'toggle-lines']) {
      $(`#${id}`).checked = true;
      $(`#${id}`).dispatchEvent(new Event('change'));
    }
    $('#effect').value = 'shadows';
    $('#quality').value = '2';
    $('#paper-reset').click();
    toast('Style reset to defaults');
  });
}

/** Current ink colour, used by the draw pad. */
export const getInkColor = () =>
  getComputedStyle(paper).getPropertyValue('--ink').trim() || DEFAULT_INK;

/** Inserts an image (e.g. a drawing) at the top of the page. */
export function insertImage(dataURL) {
  const img = document.createElement('img');
  img.src = dataURL;
  img.alt = 'Drawing';
  paperText.prepend(img);
}

export function initPreview() {
  bindRanges();
  bindInk();
  bindFonts();
  bindPaper();
  bindText();
  bindReset();
}
