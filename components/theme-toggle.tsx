"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    const stored = localStorage.getItem("papas-theme") as "dark" | "light" | null;
    const initial = stored ?? "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("papas-theme", next);
  }

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: ".6rem",
        width: "100%",
        padding: ".55rem 1.1rem",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: ".86rem",
        fontWeight: 500,
        color: "var(--sidebar-text-color, rgba(255,255,255,0.52))",
        transition: "all .18s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
    >
      <span style={{ fontSize: ".95rem", width: 20, textAlign: "center", flexShrink: 0 }}>
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
      {theme === "dark" ? "Modo claro" : "Modo oscuro"}
    </button>
  );
}
