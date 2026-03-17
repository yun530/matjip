"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/",        icon: "🏠", label: "홈" },
  { href: "/map",     icon: "🗺️", label: "지도" },
  { href: "/post",    icon: "➕", label: "등록" },
  { href: "/profile", icon: "👤", label: "프로필" },
];

export default function SketchDock() {
  const pathname = usePathname();

  return (
    <>
      <nav className="tab-bar">
        {navItems.map(({ href, icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link href={href} key={label} className={`tab-item ${isActive ? "active" : ""}`}>
              <span className="tab-icon">{icon}</span>
              <span className="tab-label">{label}</span>
            </Link>
          );
        })}
      </nav>

      <style jsx>{`
        .tab-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          height: var(--tab-height);
          background: #ffffff;
          border-top: 1.5px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0 8px;
          padding-bottom: env(safe-area-inset-bottom);
          box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
        }

        .tab-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          flex: 1;
          padding: 8px 0;
          border-radius: 10px;
          color: var(--text-sub);
          transition: color 0.15s;
          min-height: 44px;
          justify-content: center;
        }

        .tab-item.active {
          color: var(--primary);
        }

        .tab-item:active {
          transform: scale(0.92);
        }

        .tab-icon {
          font-size: 1.4rem;
          line-height: 1;
        }

        .tab-label {
          font-size: 10px;
          font-weight: 700;
        }
      `}</style>
    </>
  );
}
