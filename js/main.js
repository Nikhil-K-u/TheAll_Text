/**
 * TheAll_Text: app entry point.
 */
import { $, toast } from './utils.js';
import { initTheme } from './theme.js';
import { initPreview } from './preview.js';
import { initDrawpad } from './drawpad.js';
import { initGallery, addPages, clearPages, getPages } from './gallery.js';
import { generatePages } from './generator.js';
import { downloadPDF } from './pdf.js';

const form = $('#settings-form');
const generateButton = $('[data-testid="generate"]');
let busy = false;

async function onGenerate(e) {
  e.preventDefault();
  if (busy) return;
  if (!$('#paper-text').textContent.trim() && !$('#paper-text img')) {
    toast('Type something on the page first');
    return;
  }

  busy = true;
  generateButton.disabled = true;
  generateButton.textContent = 'Generating…';
  try {
    const canvases = await generatePages({
      scale: Number($('#quality').value) || 2,
      effect: $('#effect').value
    });
    addPages(canvases);
    toast(
      canvases.length === 1
        ? 'Page generated'
        : `${canvases.length} pages generated`
    );
    $('#output-heading').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    console.error(err);
    toast('Something went wrong while generating. Please try again.', {
      error: true
    });
  } finally {
    busy = false;
    generateButton.disabled = false;
    generateButton.textContent = 'Generate pages';
  }
}

function init() {
  initTheme();
  initPreview();
  initDrawpad();
  initGallery();

  form.addEventListener('submit', onGenerate);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') form.requestSubmit();
  });

  $('#download-pdf').addEventListener('click', () => downloadPDF(getPages()));
  $('#clear-pages').addEventListener('click', clearPages);
}

init();
