'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Shield, Eye } from 'lucide-react';

interface SecurePolicyViewerProps {
  policyId: string;
  employeeName: string;
  employeeId: string;
  employeeEmail: string;
}

export default function SecurePolicyViewer({
  policyId,
  employeeName,
  employeeId,
  employeeEmail,
}: SecurePolicyViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for watermark
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Detect DevTools
  useEffect(() => {
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      const isOpen = widthThreshold || heightThreshold;
      
      if (isOpen !== devToolsOpen) {
        setDevToolsOpen(isOpen);
      }
    };

    const interval = setInterval(detectDevTools, 1000);
    window.addEventListener('resize', detectDevTools);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', detectDevTools);
    };
  }, [devToolsOpen]);

  // Blur document when tab is inactive
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsBlurred(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Prevent context menu (right-click)
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const container = document.getElementById('secure-policy-container');
    if (container) {
      container.addEventListener('contextmenu', preventContextMenu);
      return () => {
        container.removeEventListener('contextmenu', preventContextMenu);
      };
    }
  }, []);

  // Prevent keyboard shortcuts
  useEffect(() => {
    const preventKeyboard = (e: KeyboardEvent) => {
      // Prevent Ctrl+C (Copy)
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        return false;
      }
      // Prevent Ctrl+A (Select All)
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        return false;
      }
      // Prevent Ctrl+P (Print)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        return false;
      }
      // Prevent Ctrl+S (Save)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return false;
      }
      // Prevent F12 and Ctrl+Shift+I (DevTools)
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        return false;
      }
    };

    const container = document.getElementById('secure-policy-container');
    if (container) {
      container.addEventListener('keydown', preventKeyboard);
      return () => {
        container.removeEventListener('keydown', preventKeyboard);
      };
    }
  }, []);

  // Prevent text selection and drag
  const containerStyle: React.CSSProperties = {
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
  };

  const watermarkText = `${employeeName} | ${employeeId} | ${employeeEmail} | ${currentTime.toLocaleString()}`;

  return (
    <div id="secure-policy-container" className="relative w-full h-full" style={containerStyle}>
      {/* DevTools Warning */}
      {devToolsOpen && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 flex items-center gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div className="text-sm font-semibold">
            Developer tools detected! This document is protected and monitored. Attempting to extract content is prohibited.
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-blue-950/50 border border-blue-800 rounded-xl p-4 mb-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-blue-300 mb-1">Protected Document - Read Only</p>
          <p className="text-blue-400/80 text-xs">
            This document is watermarked and monitored. You cannot download, print, copy, or save this file. 
            Screenshots are traceable to your account.
          </p>
        </div>
      </div>

      {/* PDF Viewer Container */}
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden" style={{ height: '800px' }}>
        {/* Watermark Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 200px,
              rgba(59, 130, 246, 0.03) 200px,
              rgba(59, 130, 246, 0.03) 400px
            )`,
          }}
        >
          {/* Diagonal Watermarks */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-blue-500/10 font-bold text-xs whitespace-nowrap transform -rotate-45"
              style={{
                top: `${(i % 5) * 25}%`,
                left: `${Math.floor(i / 5) * 25}%`,
                fontSize: '10px',
              }}
            >
              {watermarkText}
            </div>
          ))}
        </div>

        {/* Blur Overlay when tab inactive */}
        {isBlurred && (
          <div className="absolute inset-0 backdrop-blur-xl bg-neutral-950/80 z-20 flex items-center justify-center">
            <div className="text-center">
              <Eye className="w-12 h-12 text-blue-400 mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">Document Hidden</p>
              <p className="text-neutral-400 text-sm">Return to tab to continue viewing</p>
            </div>
          </div>
        )}

        {/* PDF iframe with security headers */}
        <iframe
          ref={iframeRef}
          src={`/api/company-policies/${policyId}/view#toolbar=0&navpanes=0&scrollbar=1`}
          className="w-full h-full border-0"
          title="Company Policy"
          sandbox="allow-same-origin"
          style={{
            pointerEvents: devToolsOpen ? 'none' : 'auto',
          }}
        />

        {/* Invisible overlay to prevent iframe interactions when devtools open */}
        {devToolsOpen && (
          <div className="absolute inset-0 z-30" />
        )}
      </div>

      {/* Footer Notice */}
      <div className="mt-4 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Shield className="w-4 h-4 text-neutral-600" />
          <span>
            This document is confidential and for your viewing only. 
            Unauthorized distribution, copying, or sharing is prohibited and may result in disciplinary action.
          </span>
        </div>
      </div>

      {/* CSS to prevent selection */}
      <style jsx>{`
        #secure-policy-container * {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          -khtml-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
        
        #secure-policy-container iframe {
          pointer-events: auto;
        }
      `}</style>
    </div>
  );
}
