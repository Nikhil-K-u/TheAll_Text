const pageEl = document.querySelector('.page-a');
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

function addFontFromFile(fileObj) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const newFont = new FontFace('temp-font', e.target.result);
    newFont
      .load()
      .then((loadedFace) => {
        document.fonts.add(loadedFace);
        pageEl.style.fontFamily = 'temp-font';
      })
      .catch(() => {
        alert('Could not load this font file. Please try a .ttf or .otf file');
      });
  };
  reader.readAsArrayBuffer(fileObj);
}

/**
 * @method createPDF
 * @param imgs array of canvases
 * @description
 * Creates PDF from list of given images
 */
function createPDF(imgs) {
  if (!imgs.length) {
    alert('Generate at least one image before downloading the PDF');
    return;
  }
  if (typeof window.jsPDF === 'undefined') {
    alert('PDF library is still loading, please try again in a moment');
    return;
  }
  // eslint-disable-next-line new-cap
  const doc = new window.jsPDF('p', 'pt', 'a4');
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  imgs.forEach((img, i) => {
    if (i > 0) doc.addPage();
    doc.addImage(
      img.toDataURL('image/jpeg'),
      'JPEG',
      25,
      50,
      width - 50,
      height - 80,
      'image-' + i
    );
  });
  doc.save('TheAll_Text.pdf');
}

function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatText(event) {
  event.preventDefault();
  const text = escapeHTML(event.clipboardData.getData('text/plain')).replace(
    /\r?\n/g,
    '<br/>'
  );
  document.execCommand('insertHTML', false, text);
}

let paperObjectURL;
function addPaperFromFile(file) {
  if (paperObjectURL) URL.revokeObjectURL(paperObjectURL);
  paperObjectURL = URL.createObjectURL(file);
  pageEl.style.backgroundImage = `url(${paperObjectURL})`;
  pageEl.style.backgroundSize = 'cover';
}

export { isMobile, addFontFromFile, createPDF, formatText, addPaperFromFile };
