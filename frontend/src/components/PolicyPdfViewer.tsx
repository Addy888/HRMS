'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker using the local bundled worker file
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface PolicyPdfViewerProps {
  pdfData: string;
  onLoadSuccess: (data: { numPages: number }) => void;
  onLoadError: (error: Error) => void;
  numPages: number;
}

export default function PolicyPdfViewer({
  pdfData,
  onLoadSuccess,
  onLoadError,
  numPages,
}: PolicyPdfViewerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative">
      <Document
        file={pdfData}
        onLoadSuccess={onLoadSuccess}
        onLoadError={onLoadError}
        loading={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        }
        error={
          <div className="flex items-center justify-center py-20">
            <p className="text-red-400">Failed to load PDF</p>
          </div>
        }
        className="flex flex-col items-center gap-4"
      >
        {Array.from(new Array(numPages), (el, index) => (
          <div key={`page_${index + 1}`} className="relative shadow-2xl">
            <Page
              pageNumber={index + 1}
              width={800}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="border border-neutral-800 rounded-lg overflow-hidden"
            />
            {/* Page number indicator */}
            <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white font-semibold">
              Page {index + 1} of {numPages}
            </div>
          </div>
        ))}
      </Document>
    </div>
  );
}
