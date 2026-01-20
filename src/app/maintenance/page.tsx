'use client';

import { useState, useEffect } from 'react';

export default function MaintenancePage() {
  const [message, setMessage] = useState('System maintenance is in progress. Please check back soon.');

  useEffect(() => {
    // Fetch the current maintenance message
    const fetchMessage = async () => {
      try {
        const res = await fetch('/api/maintenance');
        const data = await res.json();
        if (data.message) {
          setMessage(data.message);
        }
      } catch (error) {
        console.error('Error fetching maintenance info:', error);
      }
    };

    fetchMessage();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden flex items-center justify-center px-4">
      {/* Background */}
      <div>
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="30" y="30" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="1.5" fill="#06b6d4"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)"/>
        </svg>

        {/* Gradient Background */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 via-cyan-500/5 to-transparent pointer-events-none" />

        {/* Animated Glow */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-7xl mb-6">🔧</div>
          <h1 className="text-5xl font-black mb-3">Under Maintenance</h1>
          <p className="text-xl text-slate-400 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-linear-to-br from-blue-900/40 to-cyan-900/30 rounded-xl border border-cyan-500/50 p-6 mb-8">
          <p className="text-sm text-cyan-300">
            ⏱️ We're working hard to improve your experience. Thank you for your patience!
          </p>
        </div>

        {/* Animated Dots */}
        <div className="flex justify-center gap-2">
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}
