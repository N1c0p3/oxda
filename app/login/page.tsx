"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";

function destinoSeguro() {
  const destino = new URLSearchParams(window.location.search).get("next");
  return destino?.startsWith("/") && !destino.startsWith("//") && !destino.includes("\\") ? destino : "/dashboard";
}

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    setOcupado(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "No fue posible entrar");
      window.location.assign(destinoSeguro());
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No fue posible entrar");
      setOcupado(false);
    }
  }

  return (
    <main className="profile-select-page">
      <form className="profile-select-panel login-panel" onSubmit={entrar}>
        <div className="profile-select-brand">OXDA</div>
        <p className="profile-select-eyebrow">Sistema de Gestión</p>
        <h1>Inicia sesión</h1>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <div className="form-group">
          <label className="form-label" htmlFor="login-usuario">Usuario</label>
          <input id="login-usuario" className="form-input" autoComplete="username" autoCapitalize="none" autoFocus required value={usuario} onChange={(evento) => setUsuario(evento.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="login-password">Contraseña</label>
          <input id="login-password" className="form-input" type="password" autoComplete="current-password" required value={password} onChange={(evento) => setPassword(evento.target.value)} />
        </div>
        <button className="btn btn-primary login-boton" type="submit" disabled={ocupado}>
          <LogIn size={16} aria-hidden="true" /> {ocupado ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
