'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="pointer-events-none">
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="30" y="30" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="1.5" fill="#06b6d4"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)"/>
        </svg>
      </div>

      {/* Header */}
      <header className="z-50 border-b border-slate-800 backdrop-blur-md bg-slate-950/50 sticky top-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-0 flex justify-between items-center sm:h-24">
          <Link
            href="/"
            className="px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-linear-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg hover:shadow-blue-500/50 whitespace-nowrap"
          >
            ← Back
          </Link>
          <h1 className="text-xl sm:text-2xl font-black bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Terms of Service</h1>
          <div className="w-24"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="relative overflow-hidden rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-6 sm:p-8">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Terms of Service</h2>
            
            <div className="space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed">
              <section>
                <h3 className="text-lg sm:text-xl font-bold text-cyan-400 mb-3">1. Acceptance of Terms</h3>
                <p>
                  By accessing and using CricKeters, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h3 className="text-lg sm:text-xl font-bold text-cyan-400 mb-3">2. Use License</h3>
                <p>
                  Permission is granted to temporarily download one copy of the materials (information or software) on CricKeters for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
                </p>
              </section>

              <section>
                <h3 className="text-lg sm:text-xl font-bold text-cyan-400 mb-3">3. Disclaimer</h3>
                <p>
                  The materials on CricKeters are provided on an 'as is' basis. CricKeters makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                </p>
              </section>

              <section>
                <h3 className="text-lg sm:text-xl font-bold text-cyan-400 mb-3">4. Limitations</h3>
                <p>
                  In no event shall CricKeters or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on CricKeters.
                </p>
              </section>

              <section>
                <h3 className="text-lg sm:text-xl font-bold text-cyan-400 mb-3">5. Accuracy of Materials</h3>
                <p>
                  The materials appearing on CricKeters could include technical, typographical, or photographic errors. CricKeters does not warrant that any of the materials on our website are accurate, complete, or current. CricKeters may make changes to the materials contained on our website at any time without notice.
                </p>
              </section>

              <section>
                <h3 className="text-lg sm:text-xl font-bold text-cyan-400 mb-3">6. Links</h3>
                <p>
                  CricKeters has not reviewed all of the sites linked to our website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by CricKeters of the site. Use of any such linked website is at the user's own risk.
                </p>
              </section>

              <section>
                <p className="text-slate-400 text-xs sm:text-sm mt-8">
                  Last updated: January 2026
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 bg-slate-900/30 backdrop-blur-sm mt-12 sm:mt-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <p className="text-slate-400 text-xs sm:text-sm">&copy; 2026 CricKeters. All rights reserved.</p>
            <div className="flex gap-4 sm:gap-6 text-slate-400 text-xs sm:text-sm">
              <Link href="/privacy" className="hover:text-cyan-400 transition">Privacy</Link>
              <Link href="/terms" className="hover:text-cyan-400 transition">Terms</Link>
              <Link href="/contact" className="hover:text-cyan-400 transition">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
