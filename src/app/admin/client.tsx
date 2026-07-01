"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminPriceEditor } from "@/components/AdminPriceEditor";
import { AdminLeadsList } from "@/components/AdminLeadsList";

const TOKEN_KEY = "rose-admin-token";

type Tab = "prices" | "leads";

/** Panneau d'administration : connexion, puis édition des prix et liste des devis. */
export function AdminClient() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(TOKEN_KEY);
  });
  const [tab, setTab] = useState<Tab>("prices");

  function handleLogin(t: string) {
    sessionStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  }

  function handleLogout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {!token ? (
          <AdminLogin onLogin={handleLogin} />
        ) : (
          <div>
            <div className="mb-8 flex items-center justify-between">
              <h1 className="font-mono text-xl font-bold uppercase tracking-widest text-foreground">
                Administration
              </h1>
              <button
                type="button"
                onClick={handleLogout}
                className="border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted transition-colors hover:border-accent hover:text-accent"
              >
                Déconnexion
              </button>
            </div>

            <nav className="mb-8 flex gap-2">
              <TabButton active={tab === "prices"} onClick={() => setTab("prices")}>
                Prix
              </TabButton>
              <TabButton active={tab === "leads"} onClick={() => setTab("leads")}>
                Demandes
              </TabButton>
            </nav>

            {tab === "prices" ? (
              <AdminPriceEditor token={token} />
            ) : (
              <AdminLeadsList token={token} />
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
        active
          ? "border-accent bg-accent text-background"
          : "border-border text-muted hover:border-accent hover:text-accent"
      }`}
    >
      {children}
    </button>
  );
}
