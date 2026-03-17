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
        <header className="header container">
          <Link href="/" className="logo">
            <span className="logo-emoji">🗺️</span>
            <span className="logo-text">쩝쩝박사지도</span>
          </Link>
          <nav className="desktop-nav">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? "active" : ""}`}
              >
                {item.icon} {item.name}
              </Link>
            ))}
          </nav>
        </header>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="mobile-nav-wrapper mobile-only">
        <nav className="mobile-nav">
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
          top: 0;
          z-index: 1000;
          background: var(--white);
        }
        .header-wrapper::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 0;
          border-bottom: 2.5px solid var(--black);
          filter: url(#wobbly);
          pointer-events: none;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: var(--header-height);
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 900;
          font-size: 1.4rem;
          color: var(--black);
        }
        .desktop-nav {
          display: flex;
          gap: 8px;
        }
        .nav-item {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--gray-700);
          padding: 7px 14px;
          border-radius: var(--radius-md);
          border: 2px solid transparent;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.1s ease;
        }
        .nav-item:hover {
          background-color: var(--secondary);
          border-color: var(--black);
          transform: translate(-1px, -1px);
        }
        .nav-item.active {
          background-color: var(--primary);
          color: var(--white);
          border: 2.5px solid var(--black);
        }

        /* Mobile Bottom Tab Bar */
        .mobile-nav-wrapper {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: var(--white);
          padding-bottom: env(safe-area-inset-bottom);
        }
        .mobile-nav-wrapper::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 0;
          border-top: 2.5px solid var(--black);
          filter: url(#wobbly);
          pointer-events: none;
        }
        .mobile-nav {
          display: flex;
          justify-content: space-around;
          align-items: center;
          height: 60px;
        }
        .mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          flex: 1;
          color: var(--gray-400);
          transition: all 0.1s ease;
        }
        .mobile-icon {
          font-size: 1.4rem;
          transition: transform 0.15s ease;
        }
        .mobile-label {
          font-size: 0.75rem;
          font-weight: 800;
        }
        .mobile-nav-item.active {
          color: var(--primary);
        }
        .mobile-nav-item.active .mobile-icon {
          transform: translateY(-3px) scale(1.1);
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
