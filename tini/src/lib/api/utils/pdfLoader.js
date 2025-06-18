export async function initializePdfViewer() {
    try {
      const domDocument = document;
      
      if (!window.pdfjsLib) {
        await new Promise((resolve) => {
          const script = domDocument.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve();
          };
          domDocument.head.appendChild(script);
        });
      }
      
      await loadPdf();
    } catch (err) {
      console.error('Error initializing PDF viewer:', err);
      error = 'Failed to initialize PDF viewer';
    }
  }
  

export async function loadPdf() {
    try {
      console.log('Loading PDF:', pdfDocument?.cloudinary_url);
      
      if (!window.pdfjsLib || !pdfDocument?.cloudinary_url) {
        throw new Error('PDF library not loaded or document URL missing');
      }

      const loadingTask = window.pdfjsLib.getDocument(pdfDocument.cloudinary_url);
      pdfDoc = await loadingTask.promise;
      
      console.log('PDF loaded successfully, pages:', pdfDoc.numPages);
      
      totalPages = pdfDoc.numPages;
      
      await waitForCanvas();
      await renderPage(1);
      
    } catch (err) {
      console.error('Error loading PDF:', err);
      error = 'Failed to load PDF document: ' + err.message;
    }
  }