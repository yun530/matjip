"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "지도", href: "/", icon: "🏠" },
    { name: "등록", href: "/post", icon: "➕" },
    { name: "저장", href: "/collection", icon: "💾" },
    { name: "프로필", href: "/profile", icon: "👤" },
  ];

  return (
    <>
      {/* Desktop Header */}
      <div className="header-wrapper desktop-only">
        <header className="header doodle-box container">
          <Link href="/" className="logo">
            <span className="logo-emoji">🗺️</span>
            <span className="logo-text">쩝쩝박사지도</span>
          </Link>
          <nav className="desktop-nav">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item doodle-btn ${pathname === item.href ? "active" : ""}`}
              >
                {item.icon} {item.name}
              </Link>
            ))}
          </nav>
        </header>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="mobile-nav-wrapper mobile-only">
        <nav className="mobile-nav doodle-box">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item ${pathname === item.href ? "active" : ""}`}
            >
              <span className="mobile-icon">{item.icon}</span>
              <span className="mobile-label">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      <style jsx>{`
        /* Desktop Header */
        .header-wrapper {
          position: sticky;
          top: 16px;
          z-index: 1000;
          padding: 0 20px;
          margin-bottom: 30px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: var(--header-height);
          padding: 0 24px;
          background-color: var(--accent); /* Crayon yellow sticky note */
          border-radius: 15px 255px 15px 225px/225px 15px 225px 15px; /* Different doodle shape */
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: 1.8rem;
          color: var(--black);
        }
        .logo-text {
          letter-spacing: 1px;
        }
        .desktop-nav {
          display: flex;
          gap: 16px;
        }
        .nav-item {
          background-color: var(--white);
          font-size: 1.2rem;
          color: var(--black);
        }
        .nav-item.active {
          background-color: var(--primary);
          color: var(--white);
          transform: translateY(-2px);
          box-shadow: 4px 4px 0px var(--black);
        }

        /* Mobile Bottom Tab Bar */
        .mobile-nav-wrapper {
          position: fixed;
          bottom: 16px;
          left: 16px;
          right: 16px;
          z-index: 1000;
          padding-bottom: env(safe-area-inset-bottom);
        }
        .mobile-nav {
          display: flex;
          justify-content: space-around;
          align-items: center;
          height: 70px;
          background-color: var(--accent);
          border-radius: 255px 15px 225px 15px/15px 225px 15px 255px; 
          padding: 0 10px;
        }
        .mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex: 1;
          color: var(--black);
          transition: all 0.2s;
          opacity: 0.7;
        }
        .mobile-icon {
          font-size: 1.6rem;
          transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.4, 1.2);
        }
        .mobile-label {
          font-size: 0.9rem;
          font-weight: bold;
        }
        .mobile-nav-item.active {
          opacity: 1;
        }
        .mobile-nav-item.active .mobile-icon {
          transform: scale(1.2) translateY(-2px);
        }

        /* Utility Classes for Responsive */
        @media (min-width: 769px) {
          .mobile-only { display: none; }
        }
        @media (max-width: 768px) {
          .desktop-only { display: none; }
        }
      `}</style>
    </>
  );
}
