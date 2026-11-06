"use client";

import { FileWarning, KeyRound, Mic, Send, ShieldCheck, Sparkles, UserRound } from "lucide-react";
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

  return (
    <div className="page maggie-page">
      <section className="maggie-hero">
        <div className="maggie-hero-avatar"><MaggieLogo size={132} /></div>
        <div className="maggie-hero-copy">
          <p className="maggie-eyebrow">{MAGGIE.rol}</p>
          <h1 className="maggie-title">{MAGGIE.lema}</h1>
          <p className="maggie-lead">{MAGGIE.presentacion}</p>
          <a className="btn maggie-cta" href={MAGGIE.enlaceTelegram} target="_blank" rel="noreferrer">
            <Send size={16} aria-hidden="true" /> Abrir a Maggie en Telegram
          </a>
          <p className="maggie-note"><KeyRound size={14} aria-hidden="true" /> La primera vez necesitas tu enlace de vinculación. Pídeselo a Dirección.</p>
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
