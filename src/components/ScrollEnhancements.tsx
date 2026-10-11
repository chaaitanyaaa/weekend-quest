import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export function ScrollEnhancements() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setScrollProgress(progress);
      setShowTopBtn(scrollTop > 250);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* 1. Top Reading / Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-coral via-amber to-lime z-50 pointer-events-none transition-all duration-100 ease-out"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      {/* 2. Floating Scroll-to-Top Button */}
      {showTopBtn && (
        <button
          onClick={scrollToTop}
          aria-label="Back to top"
          title="Back to top"
          className="fixed bottom-20 sm:bottom-8 right-5 z-40 w-11 h-11 rounded-full bg-white dark:bg-navy-card border border-navy/10 dark:border-white/10 text-navy dark:text-cream shadow-xl flex items-center justify-center hover:bg-coral hover:text-white dark:hover:bg-coral dark:hover:text-white hover:-translate-y-1 hover:shadow-coral/25 active:translate-y-0 transition-all duration-200 group"
        >
          <ArrowUp className="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-0.5" />
        </button>
      )}
    </>
  );
}
