import type { Metadata } from "next";
import Nav from "@/components/nav";
import { GlobalZoneFilter, ZoneProvider } from "@/components/zone-filter";
import "./globals.css";

export const metadata: Metadata = {
  title: "OXDA | Sistema de Gestión",
  description: "Sistema operativo inteligente para gestión de inventarios, ventas y producción",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        {/* Hydrate theme before first paint — prevents flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('papas-theme') || 'light';
              document.documentElement.setAttribute('data-theme', t);
            } catch(e){}
          })()
        ` }} />
        {/* Decorative ambient blobs — OXDA Blue Theme */}
        <div aria-hidden="true" style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", width: 600, height: 600,
            top: "-15%", left: "-10%",
            background: "radial-gradient(circle, rgba(0,48,135,0.18) 0%, transparent 70%)",
            borderRadius: "50%", filter: "blur(40px)",
          }} />
          <div style={{
            position: "absolute", width: 500, height: 500,
            top: "30%", right: "-8%",
            background: "radial-gradient(circle, rgba(0,160,227,0.12) 0%, transparent 70%)",
            borderRadius: "50%", filter: "blur(50px)",
          }} />
          <div style={{
            position: "absolute", width: 450, height: 450,
            bottom: "-10%", left: "25%",
            background: "radial-gradient(circle, rgba(0,48,135,0.15) 0%, transparent 70%)",
            borderRadius: "50%", filter: "blur(45px)",
          }} />
        </div>
        <ZoneProvider>
          <div className="shell" style={{ position: "relative", zIndex: 1 }}>
            <Nav />
            <div className="main">
              <GlobalZoneFilter />
              {children}
            </div>
          </div>
        </ZoneProvider>
      </body>
    </html>
  );
}
