"use client";

import { useCallback, useEffect, useState } from "react";
import { FileWarning, Link2, Mic, Send, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import MaggieLogo from "@/components/maggie-logo";
import { useProfile } from "@/components/profile-session";
import { MAGGIE } from "@/lib/maggie/identidad";
import type { ProfileId } from "@/lib/profiles";

const EJEMPLOS: Record<ProfileId, string[]> = {
  contador: [
    "¿Qué comisiones faltan por autorizar?",
    "Marca como pagada la comisión de Mario con fecha de hoy",
    "Sube a 320 el costo por caja de la papa 10 mm",
    "¿Cuánta cartera vence esta semana en GDL?",
  ],
  logistica: [
    "¿Qué pedidos faltan por salir?",
    "Programa el envío del pedido 48 para el lunes",
    "Cambia el envío 12 a entregado",
    "Registra un ajuste de menos 3 cajas del 804104 en Cancún",
  ],
  ventas: [
    "Dame mis prospectos en negociación",
    "Pasa a Juan Pérez a negociación",
    "Anota que visité a Fritos Ana y le mando propuesta el viernes",
    "Haz un pedido de 10 cajas de papa 10 mm para Slovensko",
  ],
  direccion: [
    "¿Cómo vamos contra presupuesto este mes?",
    "¿Qué zona trae más cartera vencida?",
    "¿Qué producto se está quedando sin cobertura?",
    "Resúmeme las comisiones pendientes",
  ],
};

const FORMAS = [
  { Icono: Send, titulo: "Escríbele", texto: "Como a una compañera. No necesitas comandos ni saberte los códigos." },
  { Icono: Mic, titulo: "Háblale", texto: "Mándale una nota de voz. Te muestra lo que escuchó antes de actuar." },
  { Icono: ShieldCheck, titulo: "Tú decides", texto: "Antes de cambiar algo te manda una tarjeta. Sin tu confirmación no se toca nada." },
];

const REGLAS = [
  { Icono: UserRound, texto: "Solo ve y cambia lo que tu perfil permite en el sistema." },
  { Icono: Sparkles, texto: "Es una IA: consulta los datos reales, pero revisa la tarjeta antes de confirmar." },
  { Icono: FileWarning, texto: "Por ahora entiende texto y notas de voz. Fotos y documentos todavía no." },
];

export default function MaggiePage() {
  const { profile } = useProfile();
  const [cuentas, setCuentas] = useState<Array<string | null> | null>(null);
  const [conectando, setConectando] = useState(false);
  const [error, setError] = useState("");

  const revisar = useCallback(async () => {
    const response = await fetch("/api/v1/maggie/conectar", { cache: "no-store" });
    if (response.ok) setCuentas(((await response.json()) as { cuentas: Array<string | null> }).cuentas);
  }, []);

  // Al volver de Telegram se actualiza el estado sin recargar la página.
  useEffect(() => {
    const alVolver = () => void revisar();
    alVolver();
    window.addEventListener("focus", alVolver);
    return () => window.removeEventListener("focus", alVolver);
  }, [revisar]);

  async function conectar() {
    // Se abre antes de esperar al servidor para que el navegador no la bloquee.
    const ventana = window.open("", "_blank");
    setConectando(true);
    setError("");
    try {
      const response = await fetch("/api/v1/maggie/conectar", { method: "POST" });
      const data = (await response.json()) as { enlace?: string; error?: string };
      if (!response.ok || !data.enlace) throw new Error(data.error ?? "No fue posible conectar");
      if (ventana) ventana.location.href = data.enlace;
      else window.location.assign(data.enlace);
    } catch (fallo) {
      ventana?.close();
      setError(fallo instanceof Error ? fallo.message : "No fue posible conectar");
    } finally {
      setConectando(false);
    }
  }

  const conectada = Boolean(cuentas?.length);

  return (
    <div className="page maggie-page">
      <section className="maggie-hero">
        <div className="maggie-hero-avatar"><MaggieLogo size={132} /></div>
        <div className="maggie-hero-copy">
          <p className="maggie-eyebrow">{MAGGIE.rol}</p>
          <h1 className="maggie-title">{MAGGIE.lema}</h1>
          <p className="maggie-lead">{MAGGIE.presentacion}</p>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          {conectada ? (
            <div className="maggie-acciones">
              <a className="btn maggie-cta" href={MAGGIE.enlaceTelegram} target="_blank" rel="noreferrer">
                <Send size={16} aria-hidden="true" /> Abrir a Maggie en Telegram
              </a>
              <button type="button" className="maggie-secundario" onClick={() => void conectar()} disabled={conectando}>Conectar otra cuenta</button>
            </div>
          ) : (
            <button type="button" className="btn maggie-cta" onClick={() => void conectar()} disabled={conectando || cuentas === null}>
              <Link2 size={16} aria-hidden="true" /> {conectando ? "Conectando…" : "Conectar a Maggie"}
            </button>
          )}
          <p className="maggie-note">
            {conectada
              ? `Conectada con ${cuentas?.map((cuenta) => (cuenta ? `@${cuenta}` : "tu cuenta")).join(", ")} como ${profile.department}.`
              : `Te llevamos a Telegram: toca Iniciar y quedas conectado como ${profile.department}.`}
          </p>
        </div>
      </section>

      <section className="maggie-formas" aria-label="Cómo funciona">
        {FORMAS.map(({ Icono, titulo, texto }) => (
          <div key={titulo} className="card maggie-forma">
            <span className="maggie-forma-icono"><Icono size={18} aria-hidden="true" /></span>
            <h2>{titulo}</h2>
            <p>{texto}</p>
          </div>
        ))}
      </section>

      <div className="maggie-detalle">
        <section className="card">
          <h2 className="card-title">Prueba con esto · {profile.department}</h2>
          <ul className="maggie-ejemplos">
            {EJEMPLOS[profile.id].map((ejemplo) => <li key={ejemplo}>{ejemplo}</li>)}
          </ul>
        </section>
        <section className="card">
          <h2 className="card-title">Antes de usarla</h2>
          <ul className="maggie-reglas">
            {REGLAS.map(({ Icono, texto }) => (
              <li key={texto}><Icono size={16} aria-hidden="true" /><span>{texto}</span></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
