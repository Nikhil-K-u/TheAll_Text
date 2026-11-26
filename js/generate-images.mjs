import {
  applyPaperStyles,
  removePaperStyles,
  renderOutput
} from './utils/generate-utils.mjs';
import { createPDF } from './utils/helpers.mjs';

const pageEl = document.querySelector('.page-a');
let outputImages = [];

/**
 * To generate image, we add styles to DIV and converts that HTML Element into Image.
 * This is the function that deals with it.
 */
async function convertDIVToImage() {
  const options = {
    scrollX: 0,
    scrollY: -window.scrollY,
    scale: Number(document.querySelector('#resolution').value) || 2,
    useCORS: true
  };

  /** Function html2canvas comes from a library html2canvas which is included in the index.html */
  const canvas = await html2canvas(pageEl, options);

  /** Send image data for modification if effect is scanner */
  if (document.querySelector('#page-effects').value === 'scanner') {
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    contrastImage(imageData, 0.55);
    canvas.getContext('2d').putImageData(imageData, 0, 0);
  }

  outputImages.push(canvas);
  updateOutputHeader();
}

/**
 * Shows number of generated images in the output header
 */
function updateOutputHeader() {
  document.querySelector('#output-header').textContent =
    'Output' + (outputImages.length ? ' ( ' + outputImages.length + ' )' : '');
}

/**
 * Returns true when the content overflows the visible page.
 */
function isPageOverflowing() {
  return pageEl.scrollHeight > pageEl.clientHeight + 1;
}

let isGenerating = false;

/**
 * This is the function that gets called on clicking "Generate Image" button.
 */
export async function generateImages() {
  if (isGenerating) return;
  isGenerating = true;
  const paperContentEl = document.querySelector('.page-a .paper-content');
  const initialPaperContent = paperContentEl.innerHTML;

  applyPaperStyles();
  pageEl.scrollTo(0, 0);

  try {
    if (!isPageOverflowing()) {
      // single image
      await convertDIVToImage();
    } else {
      // multiple images
      if (initialPaperContent.includes('<img')) {
        alert(
          "You're trying to generate more than one page, Images and some formatting may not work correctly with multiple pages" // eslint-disable-line max-len
        );
      }

      // Split into words while keeping whitespace and HTML tags intact
      const tokens = initialPaperContent
        .split(/(<[^>]*>|\s+)/)
        .filter((token) => token !== '');

      let index = 0;
      while (index < tokens.length) {
        const pageStart = index;
        let pageHTML = '';
        while (index < tokens.length) {
          const candidate = pageHTML + tokens[index];
          paperContentEl.innerHTML = candidate;
          // Always put at least one token on a page to avoid infinite loops
          if (isPageOverflowing() && index > pageStart) break;
          pageHTML = candidate;
          index++;
        }

        // Skip whitespace at the start of the next page
        while (index < tokens.length && /^\s+$/.test(tokens[index])) index++;

        if (pageHTML.trim() === '') continue;
        paperContentEl.innerHTML = pageHTML;
        pageEl.scrollTo(0, 0);
        await convertDIVToImage();
      }
    }
  } catch (err) {
    console.error(err);
    alert('Something went wrong while generating the image. Please try again.');
  } finally {
    paperContentEl.innerHTML = initialPaperContent;
    removePaperStyles();
    renderOutput(outputImages);
    setRemoveImageListeners();
    isGenerating = false;
  }
}

/**
 * Delete all generated images
 */

export const deleteAll = () => {
  outputImages.splice(0, outputImages.length);
  renderOutput(outputImages);
  updateOutputHeader();
};

const arrayMove = (arr, oldIndex, newIndex) => {
  arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
  return arr; // for testing
};

export const moveLeft = (index) => {
  if (index <= 0) return outputImages;
  outputImages = arrayMove(outputImages, index, index - 1);
  return outputImages;
};

export const moveRight = (index) => {
  if (index + 1 >= outputImages.length) return outputImages;
  outputImages = arrayMove(outputImages, index, index + 1);
  return outputImages;
};

/**
 * Downloads generated images as PDF
 */
export const downloadAsPDF = () => createPDF(outputImages);

/**
 * Re-renders output and re-attaches listeners
 */
function refreshOutput() {
  updateOutputHeader();
  renderOutput(outputImages);
  // When output changes, we have to set listeners again
  setRemoveImageListeners();
}

/**
 * Sets event listeners for close / move buttons on output images.
 */
function setRemoveImageListeners() {
  document
    .querySelectorAll('.output-image-container > .close-button')
    .forEach((closeButton) => {
      closeButton.addEventListener('click', (e) => {
        outputImages.splice(Number(e.currentTarget.dataset.index), 1);
        refreshOutput();
      });
    });

  document.querySelectorAll('.move-left').forEach((leftButton) => {
    leftButton.addEventListener('click', (e) => {
      moveLeft(Number(e.currentTarget.dataset.index));
      refreshOutput();
    });
  });

  document.querySelectorAll('.move-right').forEach((rightButton) => {
    rightButton.addEventListener('click', (e) => {
      moveRight(Number(e.currentTarget.dataset.index));
      refreshOutput();
    });
  });
}

/** Modifies image data to add contrast */

function contrastImage(imageData, contrast) {
  const data = imageData.data;
  contrast *= 255;
  const factor = (contrast + 255) / (255.01 - contrast);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = factor * (data[i] - 128) + 128;
    data[i + 1] = factor * (data[i + 1] - 128) + 128;
    data[i + 2] = factor * (data[i + 2] - 128) + 128;
  }
  return imageData;
}
