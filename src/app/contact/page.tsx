'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to a server
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSubmitted(false), 3000);
  };

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
          <h1 className="text-xl sm:text-2xl font-black bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Contact Us</h1>
          <div className="w-24"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Get in Touch</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-cyan-400 mb-2">Email</h3>
                  <p className="text-slate-300 text-sm sm:text-base">divyanshjain883@gmail.com</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-cyan-400 mb-2">Phone</h3>
                  <p className="text-slate-300 text-sm sm:text-base">+91 9761854883</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-cyan-400 mb-2">Address</h3>
                  <p className="text-slate-300 text-sm sm:text-base">Bennett University<br/>Greater Noida, Uttar Pradesh</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-cyan-400 mb-3">Response Time</h3>
                  <p className="text-slate-300 text-sm sm:text-base">We typically respond within 24 hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="relative overflow-hidden rounded-xl border border-cyan-500/50 bg-linear-to-br from-slate-900/90 to-slate-800/70 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Send Message</h2>

            {submitted && (
              <div className="mb-6 p-4 rounded-lg bg-green-500/20 border border-green-500/50 text-green-300 text-sm">
                ✓ Thank you! Your message has been sent successfully.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-cyan-300 mb-2 sm:mb-3">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="w-full px-3 sm:px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-cyan-300 mb-2 sm:mb-3">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full px-3 sm:px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-cyan-300 mb-2 sm:mb-3">Subject</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition text-sm"
                  required
                >
                  <option value="">Select subject...</option>
                  <option value="support">Technical Support</option>
                  <option value="feedback">Feedback</option>
                  <option value="bug">Report Bug</option>
                  <option value="feature">Feature Request</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-cyan-300 mb-2 sm:mb-3">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Your message..."
                  rows={5}
                  className="w-full px-3 sm:px-4 py-3 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition text-sm resize-none"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-cyan-500/50 text-sm sm:text-base"
              >
                Send Message
              </button>
            </form>
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
