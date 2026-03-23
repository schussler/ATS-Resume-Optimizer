// PDF text extraction using pdf.js
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  // Dynamically load pdfjs to avoid SSR issues
  const pdfjsLib = await import('pdfjs-dist');

  // Use the bundled worker via URL
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).toString();

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const texts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => {
        if ('str' in item) return item.str;
        return '';
      })
      .join(' ');
    texts.push(pageText);
  }

  return texts.join('\n\n');
}
