"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const Icons = {
  Home: ({ className, style }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M3 11 L12 3 L21 11" />
      <path d="M5 11 V22 H19 V11" />
      <path d="M9 22 V15 H15 V22" />
    </svg>
  ),
  Map: ({ className, style }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M3 6 L9 3 L15 6 L21 3 V18 L15 21 L9 18 L3 21 V6 Z" />
      <path d="M9 3 V18 M15 6 V21" />
      <circle cx="16" cy="10" r="3" />
      <path d="M16 8 V12 M14 10 H18" />
    </svg>
  ),
  Plus: ({ className, style }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M12 5 V19 M5 12 H19" />
    </svg>
  ),
  Profile: ({ className, style }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="10" r="0.8" fill="currentColor" />
      <circle cx="15" cy="10" r="0.8" fill="currentColor" />
      <path d="M8 15 C10 17.5, 14 17.5, 16 15" />
    </svg>
  ),
};

const navItems = [
  { icon: Icons.Home,    label: "메인", href: "/" },
  { icon: Icons.Map,     label: "지도", href: "/map" },
  { icon: Icons.Plus,    label: "등록", href: "/post" },
  { icon: Icons.Profile, label: "me",   href: "/profile" },
];

export default function Dock() {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = React.useState(null);
  const [hovered, setHovered] = React.useState(null);

  return (
    <div style={{
      position: "fixed",
      bottom: 16,
      left: 16,
      right: 16,
      zIndex: 1000,
      display: "flex",
      justifyContent: "center",
    }}>
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 16,
          padding: "12px 16px",
          borderRadius: 24,
          border: "2px solid var(--text)",
          background: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(20px)",
          boxShadow: "4px 4px 0px var(--text)",
          transform: "perspective(600px) rotateX(10deg)",
          filter: "url(#sketchy-line)",
        }}
      >
        {navItems.map((item, i) => {
          const isActive = pathname === item.href || active === item.label;
          const isHovered = hovered === i;

          return (
            <div key={item.label} style={{ position: "relative" }}>
              <motion.div
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                animate={{
                  scale: isHovered ? 1.2 : 1,
                  rotate: isHovered ? -5 : 0,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                <button
                  onClick={() => {
                    setActive(item.label);
                    router.push(item.href);
                  }}
                  style={{
                    borderRadius: 16,
                    padding: 8,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    boxShadow: isHovered ? "0 4px 12px rgba(160,82,45,0.2)" : "none",
                    transition: "box-shadow 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <item.icon
                    style={{
                      width: 24,
                      height: 24,
                      color: isActive ? "var(--primary)" : "var(--text-sub)",
                      transition: "color 0.15s",
                    }}
                  />
                  <AnimatePresence>
                    {isHovered && (
                      <motion.span
                        layoutId="glow"
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: 16,
                          border: "1px solid rgba(160,82,45,0.4)",
                          pointerEvents: "none",
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    )}
                  </AnimatePresence>
                </button>

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="dot"
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--primary)",
                        marginTop: 4,
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                    />
                  )}
                </AnimatePresence>
              </motion.div>

              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    style={{
                      position: "absolute",
                      bottom: "calc(100% + 8px)",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "var(--text)",
                      color: "#fff",
                      padding: "3px 8px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontFamily: "var(--font-title)",
                      whiteSpace: "nowrap",
                      pointerEvents: "none",
                    }}
                  >
                    {item.label}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
