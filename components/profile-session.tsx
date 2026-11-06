"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { canAccessPath, getProfile, type AppProfile, type ProfileId } from "@/lib/profiles";

type ProfileContextValue = {
  profile: AppProfile;
  cerrarSesion: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

function irAlLogin() {
  window.location.assign("/login");
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<AppProfile | null>(null);

  useEffect(() => {
    fetch("/api/auth/sesion", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Sesión no válida");
        const { perfil } = (await response.json()) as { perfil: ProfileId };
        const encontrado = getProfile(perfil);
        if (!encontrado) throw new Error("Perfil no válido");
        setProfile(encontrado);
      })
      .catch(irAlLogin);
  }, []);

  const cerrarSesion = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    irAlLogin();
  };

  if (!profile) {
    return <div className="profile-loading">Preparando OXDA…</div>;
  }

  return (
    <ProfileContext.Provider value={{ profile, cerrarSesion }}>
      <ProfileAccessGuard>{children}</ProfileAccessGuard>
    </ProfileContext.Provider>
  );
}

function ProfileAccessGuard({ children }: { children: React.ReactNode }) {
  const { profile } = useProfile();
  const pathname = usePathname();
  const router = useRouter();
  const allowed = canAccessPath(profile, pathname);

  useEffect(() => {
    if (!allowed) router.replace("/dashboard");
  }, [allowed, router]);

  if (!allowed) {
    return (
      <div className="profile-loading">
        <UserRound size={20} aria-hidden="true" />
        Abriendo la vista de {profile.department}…
      </div>
    );
  }

  return children;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfile debe utilizarse dentro de ProfileProvider");
  return context;
}
