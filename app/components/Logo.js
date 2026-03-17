"use client";

export default function Logo({ size = 32 }) {
  return (
    <div className="logo-wrapper" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 24 26"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="sketch-svg"
      >
        {/* Sketchy Pin Body - Perfectly contained in 26 height viewBox */}
        <path d="M12 5 C8 5 4 9 4 14 C4 18 9 22 12 25 C15 22 20 18 20 14 C20 9 16 5 12 5 Z" fill="var(--primary-light)" />
        
        {/* Cute Face */}
        <circle cx="9" cy="13.5" r="0.6" fill="currentColor" />
        <circle cx="15" cy="13.5" r="0.6" fill="currentColor" />
        <path d="M10 16 C11 17 13 17 14 16" strokeWidth="1.2" />

        {/* Doctor Hat (Mortarboard) */}
        <path d="M5 5 L12 2 L19 5 L12 8 Z" fill="var(--primary)" stroke="currentColor" strokeWidth="1.8" />
        {/* Tassel - Made thinner for contrast */}
        <path d="M19 5 L19 10" strokeWidth="1.0" />
      </svg>
      
      <style jsx>{`
        .logo-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sketch-svg {
          width: 100%;
          height: 100%;
          filter: url(#sketchy-line);
          transform: rotate(-3deg);
        }
      `}</style>
    </div>
  );
}
