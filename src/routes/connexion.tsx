import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import loginVisual from "@/assets/login-visual.jpg";
import { AuroraBackground } from "@/components/aurora-background";
import { BrandLogo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DEMO_CREDENTIALS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Connexion — ArchbyAI Back-office" },
      {
        name: "description",
        content: "Accédez au back-office ArchbyAI pour piloter les API, services et simulations de plans.",
      },
      { property: "og:title", content: "Connexion — ArchbyAI Back-office" },
      {
        property: "og:description",
        content: "Accédez au back-office ArchbyAI pour piloter les API, services et simulations de plans.",
      },
    ],
  }),
  component: ConnexionPage,
});

function Field({
  id,
  label,
  type,
  value,
  onChange,
  icon: Icon,
  error,
  children,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  icon: typeof Mail;
  error?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="group relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <input
          id={id}
          type={type}
          value={value}
          placeholder=" "
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "peer h-14 w-full rounded-xl border bg-card/60 px-10 pt-5 text-sm outline-none transition-all duration-200",
            error
              ? "border-destructive ring-4 ring-destructive/10"
              : "border-border focus:border-primary/70 focus:ring-4 focus:ring-primary/12",
          )}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-10 top-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:uppercase peer-focus:tracking-wide peer-focus:text-primary"
        >
          {label}
        </label>
        {children}
      </div>
      {error && <p className="animate-rise pl-1 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function ConnexionPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(DEMO_CREDENTIALS.email);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password);
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: { email?: string; password?: string } = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Adresse e-mail invalide";
    if (password.length < 6) next.password = "Le mot de passe doit contenir au moins 6 caractères";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      toast.success("Connexion réussie", { description: "Bienvenue sur le back-office ArchbyAI." });
      navigate({ to: "/" });
    }, 900);
  };

  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-2">
      <AuroraBackground intensity="vivid" />

      <div className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md animate-rise">
          <div className="mb-8 flex justify-center lg:justify-start">
            <BrandLogo className="h-14" />
          </div>

          <div className="glass rounded-3xl p-7 shadow-elevated sm:p-9">
            <h1 className="text-2xl font-extrabold tracking-tight">Connexion au back-office</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Pilotez les API, services et simulations de plans d'architecture.
            </p>

            <form onSubmit={submit} className="mt-7 space-y-4">
              <Field
                id="email"
                label="Adresse e-mail"
                type="email"
                value={email}
                onChange={setEmail}
                icon={Mail}
                error={errors.email}
              />
              <Field
                id="password"
                label="Mot de passe"
                type={show ? "text" : "password"}
                value={password}
                onChange={setPassword}
                icon={Lock}
                error={errors.password}
              >
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </Field>

              <div className="flex items-center justify-between pt-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
                  Se souvenir de moi
                </label>
                <button
                  type="button"
                  onClick={() => toast.info("Un lien de réinitialisation vous a été envoyé.")}
                  className="text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <Button type="submit" variant="hero" size="lg" loading={loading} className="mt-2 w-full">
                {loading ? "Connexion en cours…" : "Se connecter"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-border bg-muted/50 p-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <p className="text-xs text-muted-foreground">
                Mode démonstration : les identifiants sont pré-remplis pour tester l'application immédiatement.
              </p>
            </div>
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Accès sécurisé HTTPS · Données hébergées au Maroc & Azure
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden lg:block">
        <img
          src={loginVisual}
          alt="Plan d'architecture isométrique généré par ArchbyAI"
          width={1024}
          height={1280}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/20 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-primary-foreground">
          <h2 className="text-3xl font-extrabold leading-tight drop-shadow">
            Des plans d'architecture générés par l'IA, conformes aux normes marocaines.
          </h2>
          <p className="mt-3 max-w-md text-sm opacity-90">
            Supervision des API, pilotage des services et suivi des simulations 2D / 3D en un seul endroit.
          </p>
        </div>
      </div>
    </div>
  );
}
