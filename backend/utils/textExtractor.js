const fs = require('fs');
const path = require('path');

/**
 * Extracts plain text from PDF, DOCX, or TXT resume files.
 * Always uses absolute path from process.cwd() + relative path.
 */
async function extractTextFromFile(relativePath, mimetype) {
  try {
    // Build absolute path
    const absolutePath = path.join(
      process.cwd(),
      relativePath.replace(/^\//, '')
    );

    if (!fs.existsSync(absolutePath)) {
      console.error('[TextExtract] File not found:', absolutePath);
      return null;
    }

    const fileSize = fs.statSync(absolutePath).size;
    if (fileSize === 0) {
      console.error('[TextExtract] File is empty:', absolutePath);
      return null;
    }

    // PDF
    if (mimetype === 'application/pdf') {
      return await new Promise((resolve) => {
        const PDFParser = require('pdf2json');
        const parser = new PDFParser(null, 1);
        parser.on('pdfParser_dataReady', (pdfData) => {
          try {
            const pages = pdfData.Pages || [];
            const text = pages.map(p =>
              (p.Texts || []).map(t =>
                (t.R || []).map(r => {
                  try { return decodeURIComponent(r.T); } catch { return r.T || ''; }
                }).join('')
              ).join(' ')
            ).join('\n').trim();
            console.log('[TextExtract] PDF extracted via pdf2json:', text.length, 'chars');
            resolve(text.length > 20 ? text : null);
          } catch (e) {
            console.error('[TextExtract] pdf2json parse error:', e.message);
            resolve(null);
          }
        });
        parser.on('pdfParser_dataError', (err) => {
          console.error('[TextExtract] pdf2json error:', err.parserError);
          resolve(null);
        });
        parser.loadPDF(absolutePath);
      });
    }

    // DOCX
    if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword'
    ) {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: absolutePath });
      const text = result.value?.trim();
      if (text && text.length > 20) {
        console.log('[TextExtract] DOCX extracted:', text.length, 'chars');
        return text;
      }
      return null;
    }

    // Plain text
    if (mimetype === 'text/plain') {
      const text = fs.readFileSync(absolutePath, 'utf8').trim();
      return text.length > 20 ? text : null;
    }

    return null;
  } catch (err) {
    console.error('[TextExtract] Error for', mimetype, ':', err.message);
    return null;
  }
}

module.exports = { extractTextFromFile };
