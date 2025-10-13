"use client";

import ThemeToggle from './ThemeToggle';
import ProtectedEmailLink from './ProtectedEmailLink';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="footer">
      <div className="social">
        <h6>
          <ProtectedEmailLink mode="copy" />
        </h6>
      </div>
      <div className="social"><h6><a href="https://x.com/joelcolombo" target="_blank" rel="noopener noreferrer">X</a></h6></div>
      <div className="social"><h6><a href="https://linkedin.com/in/joecolombo" target="_blank" rel="noopener noreferrer">LinkedIn</a></h6></div>
      <div className="social"><h6><a href="https://cal.com/joelcolombo" target="_blank" rel="noopener noreferrer">Calendar</a></h6></div>
      <div className="theme-toggle-wrapper"><ThemeToggle /></div>
      <div className="year"><h6>© {currentYear}</h6></div>
    </div>
  );
}
