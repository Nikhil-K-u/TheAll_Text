/**
 * Exports generated pages as a single A4 PDF using jsPDF
 * (bundled in js/vendor/jspdf.min.js).
 */
import { toast } from './utils.js';

/**
 * @param {{url: string, width: number, height: number}[]} pages
 */
export function downloadPDF(pages) {
  if (!pages.length) {
    toast('Generate a page first');
    return;
  }
  if (typeof window.jsPDF !== 'function') {
    toast('PDF library failed to load. Please refresh the page.', {
      error: true
    });
    return;
  }

  const doc = new window.jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  pages.forEach((page, i) => {
    if (i > 0) doc.addPage();
    // Fit the image on the page while keeping its aspect ratio.
    const ratio = Math.min(pageWidth / page.width, pageHeight / page.height);
    const width = page.width * ratio;
    const height = page.height * ratio;
    doc.addImage(
      page.url,
      'JPEG',
      (pageWidth - width) / 2,
      (pageHeight - height) / 2,
      width,
      height,
      `page-${i}`,
      'FAST'
    );
  });

  doc.save('TheAll_Text.pdf');
}
