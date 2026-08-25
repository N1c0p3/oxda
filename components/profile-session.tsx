"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, UserRound } from "lucide-react";
import { canAccessPath, getProfile, PROFILES, type AppProfile, type ProfileId } from "@/lib/profiles";

type ProfileContextValue = {
  profile: AppProfile;
  selectProfile: (profileId: ProfileId) => void;
  clearProfile: () => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);
const STORAGE_KEY = "oxda-active-profile";

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profileId, setProfileId] = useState<ProfileId | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ProfileId | null;
    if (getProfile(saved)) setProfileId(saved);
    setReady(true);
  }, []);

  const profile = getProfile(profileId);

  const selectProfile = (nextProfileId: ProfileId) => {
    localStorage.setItem(STORAGE_KEY, nextProfileId);
    setProfileId(nextProfileId);
    router.replace("/dashboard");
  };

  const clearProfile = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProfileId(null);
  };

  if (!ready) {
    return <div className="profile-loading">Preparando OXDA…</div>;
  }

  if (!profile) {
    return (
      <main className="profile-select-page">
        <section className="profile-select-panel">
          <div className="profile-select-brand">OXDA</div>
          <p className="profile-select-eyebrow">Acceso por perfil</p>
          <h1>Selecciona tu vista de trabajo</h1>
          <p className="profile-select-copy">
            Cada perfil muestra únicamente los indicadores y módulos relevantes para su departamento.
          </p>
          <div className="profile-grid">
            {PROFILES.map((item) => (
              <button key={item.id} type="button" className="profile-card" onClick={() => selectProfile(item.id)}>
                <span className="profile-avatar">{item.initials}</span>
                <span className="profile-card-body">
                  <strong>{item.name}</strong>
                  <small>{item.department}</small>
                  <span>{item.description}</span>
                </span>
                <ArrowRight size={20} aria-hidden="true" />
              </button>
            ))}
          </div>
          <div className="profile-select-note">
            <ShieldCheck size={17} aria-hidden="true" />
            Acceso temporal sin contraseña. La autenticación segura se puede activar en una siguiente etapa.
          </div>
        </section>
      </main>
    );
  }

  return (
    <ProfileContext.Provider value={{ profile, selectProfile, clearProfile }}>
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
