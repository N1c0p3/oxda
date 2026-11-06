import { useId } from "react";

type Props = { size?: number; className?: string; "aria-hidden"?: boolean | "true" | "false" };

/** Mismo trazo que public/maggie/logo.svg; va en línea para usarse como icono del menú. */
export default function MaggieLogo({ size = 24, className, ...resto }: Props) {
  const fondo = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={className}
      role={resto["aria-hidden"] ? undefined : "img"}
      aria-label={resto["aria-hidden"] ? undefined : "Maggie"}
      {...resto}
    >
      <defs>
        <linearGradient id={fondo} x1="60" y1="40" x2="440" y2="470" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#003087" />
          <stop offset="1" stopColor="#00a0e3" />
        </linearGradient>
      </defs>
      <path fill={`url(#${fondo})`} d="M160 44h192c64 0 116 52 116 116v164c0 64-52 116-116 116H214l-82 58c-11 8-26 0-26-14v-54C69 412 44 372 44 324V160C44 96 96 44 160 44Z" />
      <path fill="none" stroke="#fff" strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" d="M150 322V170l106 104 106-104v152" />
      <path fill="#ffc247" d="M398 62c5 26 18 39 44 44-26 5-39 18-44 44-5-26-18-39-44-44 26-5 39-18 44-44Z" />
    </svg>
  );
}
