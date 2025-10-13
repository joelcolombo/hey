"use client";

import { useState } from 'react';

interface ProtectedEmailLinkProps {
  mode: 'copy' | 'mailto';
  text?: string;
  className?: string;
  subject?: string;
}

export default function ProtectedEmailLink({
  mode,
  text = 'Email',
  className = '',
  subject = 'Hey there!'
}: ProtectedEmailLinkProps) {
  const [copied, setCopied] = useState(false);

  // Email parts to prevent scraping
  const getEmail = () => ['hey', '@', 'joelcolombo', '.', 'co'].join('');

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const email = getEmail();

    if (mode === 'copy') {
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(email);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy email:', err);
      }
    } else {
      // Open email client with a slight delay to ensure preventDefault works
      const encodedSubject = encodeURIComponent(subject);
      setTimeout(() => {
        window.location.href = `mailto:${email}?Subject=${encodedSubject}`;
      }, 10);
    }
  };

  const displayText = mode === 'copy' && copied ? 'Copied!' : text;
  const title = mode === 'copy'
    ? 'Click to copy email address'
    : 'Click to send an email';

  return (
    <a
      href="#"
      onClick={handleClick}
      className={`${className} cursor-pointer`}
      title={title}
      role="button"
      aria-label={mode === 'copy' ? 'Copy email to clipboard' : 'Send email'}
    >
      {displayText}
    </a>
  );
}
