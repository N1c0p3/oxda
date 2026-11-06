"use client";

import { usePathname } from "next/navigation";
import Nav from "@/components/nav";
import { ProfileProvider } from "@/components/profile-session";
import { GlobalZoneFilter, ZoneProvider } from "@/components/zone-filter";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") return children;

  return (
    <ProfileProvider>
      <ZoneProvider>
        <div className="shell" style={{ position: "relative", zIndex: 1 }}>
          <Nav />
          <div className="main">
            <GlobalZoneFilter />
            {children}
          </div>
        </div>
      </ZoneProvider>
    </ProfileProvider>
  );
}
