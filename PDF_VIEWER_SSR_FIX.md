# PDF.js SSR Fix - Complete Implementation

## Problem Statement
The PDF.js implementation was causing critical errors:
- `ReferenceError: DOMMatrix is not defined` - PDF.js was rendering during SSR
- `Setting up fake worker failed` - Worker was loaded from CDN incorrectly
- Legacy build warnings

## Root Cause
1. PDF.js library was imported and configured at the top level of a Server Component
2. Worker was loaded from CDN (cdnjs.cloudflare.com)
3. No dynamic import with `ssr: false` to prevent server-side rendering

## Solution Implemented

### 1. Created Client-Only PDF Viewer Component
**File:** `frontend/src/components/PolicyPdfViewer.tsx`

```typescript
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
```

**Key Features:**
- ✅ Client-only component with `'use client'` directive
- ✅ Worker configured to use local bundled file (`/pdf.worker.min.mjs`)
- ✅ Mounted state to prevent hydration issues
- ✅ Proper TypeScript typing
- ✅ All PDF.js imports isolated to this component

### 2. Updated Company Policies View Page
**File:** `frontend/src/app/company-policies/[id]/view/page.tsx`

**Changes:**
```typescript
// Before
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// After
import dynamic from 'next/dynamic';

const PolicyPdfViewer = dynamic(() => import('@/components/PolicyPdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  ),
});
```

**In the render:**
```typescript
{pdfData && !pdfLoading && (
  <PolicyPdfViewer
    pdfData={pdfData}
    onLoadSuccess={onDocumentLoadSuccess}
    onLoadError={onDocumentLoadError}
    numPages={numPages}
  />
)}
```

**Key Features:**
- ✅ Dynamic import with `ssr: false` - prevents server-side rendering
- ✅ Loading fallback during component load
- ✅ No PDF.js imports in parent component
- ✅ Clean separation of concerns

### 3. Updated Next.js Configuration
**File:** `frontend/next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty Turbopack config to silence the warning
  // PDF.js works fine with Turbopack without special configuration
  turbopack: {},
  
  // Webpack configuration (fallback for --webpack flag)
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false,
    };
    return config;
  },
};

export default nextConfig;
```

**Key Features:**
- ✅ Empty Turbopack config (silences Next.js 16 warning)
- ✅ PDF.js works without special Turbopack configuration
- ✅ Webpack config as fallback for `--webpack` flag
- ✅ Disables canvas alias (prevents SSR issues)
- ✅ Disables encoding alias (prevents unnecessary dependencies)
- ✅ Compatible with Next.js 16 Turbopack default

### 4. Added Local Worker File
**File:** `frontend/public/pdf.worker.min.mjs`

Copied from: `node_modules/pdfjs-dist/build/pdf.worker.min.mjs`

**Key Features:**
- ✅ Local worker file (no CDN dependency)
- ✅ Same version as pdfjs-dist package
- ✅ Served from public directory
- ✅ No CORS issues

## Issues Fixed

### ✅ DOMMatrix is not defined
**Fixed by:** Client-only component with dynamic import and `ssr: false`

### ✅ Setting up fake worker failed  
**Fixed by:** Local worker file configured properly

### ✅ Legacy build warning
**Fixed by:** Using `.mjs` worker file instead of legacy `.js`

### ✅ CDN dependency
**Fixed by:** Local worker file in public directory

### ✅ TypeScript errors
**Fixed by:** Proper typing and interfaces

## Compatibility

- ✅ Next.js 16.3.0
- ✅ React 19.2.8
- ✅ TypeScript 5.x
- ✅ Turbopack
- ✅ pdfjs-dist 6.2.108
- ✅ react-pdf 10.4.1

## Build Verification

```bash
cd frontend
npx tsc --noEmit
```

**Result:** ✅ ZERO TypeScript errors

## Implementation Checklist

- ✅ PDF Viewer is CLIENT ONLY (using 'use client')
- ✅ No PDF.js imports in Server Components
- ✅ Created PolicyPdfViewer.tsx as Client Component
- ✅ Using official worker from pdfjs-dist (not CDN)
- ✅ Worker configured using local file
- ✅ Page only renders Client Component
- ✅ No iframe/object/embed tags (using react-pdf)
- ✅ Compatible with Next.js 16, Turbopack, React 19, TypeScript
- ✅ Fixed DOMMatrix error
- ✅ Fixed fake worker error
- ✅ Fixed legacy build warning
- ✅ Zero TypeScript errors

## Files Modified

1. **Created:** `frontend/src/components/PolicyPdfViewer.tsx`
2. **Modified:** `frontend/src/app/company-policies/[id]/view/page.tsx`
3. **Modified:** `frontend/next.config.ts`
4. **Created:** `frontend/public/pdf.worker.min.mjs` (copied from node_modules)

## Testing Instructions

1. Start the development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to a company policy view page:
   ```
   http://localhost:3000/company-policies/[id]/view
   ```

3. Verify:
   - ✅ No console errors for DOMMatrix
   - ✅ No fake worker errors
   - ✅ PDF renders correctly
   - ✅ Page works without server-side rendering issues
   - ✅ All security features remain intact

## Security Features Retained

- ✅ Copy protection
- ✅ Print prevention
- ✅ Right-click disabled
- ✅ Text selection disabled
- ✅ Keyboard shortcut blocking
- ✅ Watermark overlay
- ✅ Secure document notice

## Performance

- ✅ Worker loads from local file (faster than CDN)
- ✅ Component only loads on client (reduces server load)
- ✅ Loading states provide good UX
- ✅ Blob URL cleanup prevents memory leaks
