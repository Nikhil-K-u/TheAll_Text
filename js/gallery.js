/**
 * Keeps the list of generated pages and renders them.
 * Buttons use event delegation, so no listeners need re-binding on render.
 */
import { $ } from './utils.js';

/** @type {{url: string, width: number, height: number}[]} */
let pages = [];

const gallery = $('#gallery');
const emptyMessage = $('#gallery-empty');

export const getPages = () => pages;

export function addPages(canvases) {
  pages = pages.concat(
    canvases.map((canvas) => ({
      url: canvas.toDataURL('image/jpeg', 0.92),
      width: canvas.width,
      height: canvas.height
    }))
  );
  render();
}

export function clearPages() {
  pages = [];
  render();
}

function move(from, to) {
  if (to < 0 || to >= pages.length) return;
  const [page] = pages.splice(from, 1);
  pages.splice(to, 0, page);
  render();
}

function remove(index) {
  pages.splice(index, 1);
  render();
}

function pageCard(page, index) {
  const number = index + 1;
  const isFirst = index === 0;
  const isLast = index === pages.length - 1;
  return /* html */ `
    <figure class="page-card">
      <img src="${page.url}" alt="Generated page ${number}"
           width="${page.width}" height="${page.height}" loading="lazy" />
      <figcaption class="page-card-bar">
        <span class="page-number">Page ${number}</span>
        <button type="button" class="btn btn-ghost btn-icon btn-small"
          data-action="left" data-index="${index}"
          aria-label="Move page ${number} earlier" ${isFirst ? 'disabled' : ''}
        >←</button>
        <button type="button" class="btn btn-ghost btn-icon btn-small"
          data-action="right" data-index="${index}"
          aria-label="Move page ${number} later" ${isLast ? 'disabled' : ''}
        >→</button>
        <a class="btn btn-ghost btn-small" href="${page.url}"
          download="TheAll_Text-page-${number}.jpg">Save</a>
        <button type="button" class="btn btn-danger btn-icon btn-small"
          data-action="remove" data-index="${index}"
          aria-label="Remove page ${number}">✕</button>
      </figcaption>
    </figure>`;
}

function render() {
  gallery.innerHTML = pages.map(pageCard).join('');
  if (!pages.length) gallery.append(emptyMessage);

  $('#page-count').textContent = pages.length;
  $('#download-pdf').disabled = !pages.length;
  $('#clear-pages').disabled = !pages.length;
}

export function initGallery() {
  gallery.addEventListener('click', (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    const index = Number(button.dataset.index);
    if (button.dataset.action === 'left') move(index, index - 1);
    if (button.dataset.action === 'right') move(index, index + 1);
    if (button.dataset.action === 'remove') remove(index);
  });
  render();
}
