import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  apis as apisSeed,
  historique as historiqueSeed,
  services as servicesSeed,
  simulations as simulationsSeed,
  utilisateurs as utilisateursSeed,
  activites as activitesSeed,
  type ApiSubscription,
  type HistoriqueEntry,
  type ServiceItem,
  type Simulation,
  type Utilisateur,
} from "@/lib/mock-data";

export type Notification = {
  id: string;
  titre: string;
  detail: string;
  temps: string;
  type: "success" | "warning" | "error" | "info";
  to: string;
  lue: boolean;
};

type State = {
  apis: ApiSubscription[];
  services: ServiceItem[];
  utilisateurs: Utilisateur[];
  simulations: Simulation[];
  historique: HistoriqueEntry[];
  notifications: Notification[];
};

const STORAGE_KEY = "archbyai-data-v1";

const seedNotifications: Notification[] = activitesSeed.map((a, i) => ({
  id: `NTF-${a.id}`,
  titre: a.titre,
  detail: a.detail,
  temps: a.temps,
  type: a.type,
  to: ["/simulations", "/abonnements", "/services", "/abonnements", "/utilisateurs"][i] ?? "/",
  lue: false,
}));

const initialState: State = {
  apis: apisSeed,
  services: servicesSeed,
  utilisateurs: utilisateursSeed,
  simulations: simulationsSeed,
  historique: historiqueSeed,
  notifications: seedNotifications,
};

const horodatage = () =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

type Ctx = {
  state: State;
  ready: boolean;
  creerAbonnement: (input: Omit<ApiSubscription, "id">) => ApiSubscription;
  majAbonnement: (id: string, patch: Partial<ApiSubscription>) => void;
  supprimerAbonnement: (id: string) => void;
  basculerService: (id: string) => "en_cours" | "arrete";
  inviterUtilisateur: (input: Omit<Utilisateur, "id" | "derniereConnexion">) => Utilisateur;
  majUtilisateur: (id: string, patch: Partial<Utilisateur>) => void;
  supprimerUtilisateur: (id: string) => void;
  majSimulation: (id: string, patch: Partial<Simulation>) => void;
  supprimerSimulation: (id: string) => void;
  journaliser: (entry: Omit<HistoriqueEntry, "id" | "date">) => void;
  notifier: (n: Omit<Notification, "id" | "temps" | "lue">) => void;
  marquerLues: () => void;
  marquerLue: (id: string) => void;
  reinitialiser: () => void;
};

const DataContext = createContext<Ctx | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initialState, ...(JSON.parse(raw) as State) });
    } catch {
      /* stockage indisponible : on garde l'état initial */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota dépassé : la session reste fonctionnelle en mémoire */
    }
  }, [state, ready]);

  const journaliser = useCallback((entry: Omit<HistoriqueEntry, "id" | "date">) => {
    setState((s) => ({
      ...s,
      historique: [
        { ...entry, id: `LOG-${Date.now()}`, date: horodatage() },
        ...s.historique,
      ],
    }));
  }, []);

  const notifier = useCallback((n: Omit<Notification, "id" | "temps" | "lue">) => {
    setState((s) => ({
      ...s,
      notifications: [
        { ...n, id: `NTF-${Date.now()}`, temps: "à l'instant", lue: false },
        ...s.notifications,
      ],
    }));
  }, []);

  const value = useMemo<Ctx>(() => {
    const patchList = <T extends { id: string }>(list: T[], id: string, patch: Partial<T>) =>
      list.map((item) => (item.id === id ? { ...item, ...patch } : item));

    return {
      state,
      ready,
      journaliser,
      notifier,
      creerAbonnement: (input) => {
        const cree: ApiSubscription = { ...input, id: `API-${Math.floor(1100 + Math.random() * 8900)}` };
        setState((s) => ({ ...s, apis: [cree, ...s.apis] }));
        return cree;
      },
      majAbonnement: (id, patch) => setState((s) => ({ ...s, apis: patchList(s.apis, id, patch) })),
      supprimerAbonnement: (id) => setState((s) => ({ ...s, apis: s.apis.filter((a) => a.id !== id) })),
      basculerService: (id) => {
        const svc = state.services.find((s) => s.id === id);
        const suivant: "en_cours" | "arrete" = svc?.statut === "arrete" ? "en_cours" : "arrete";
        setState((s) => ({ ...s, services: patchList(s.services, id, { statut: suivant }) }));
        return suivant;
      },
      inviterUtilisateur: (input) => {
        const cree: Utilisateur = {
          ...input,
          id: `USR-${Math.floor(10 + Math.random() * 890)}`,
          derniereConnexion: "—",
        };
        setState((s) => ({ ...s, utilisateurs: [cree, ...s.utilisateurs] }));
        return cree;
      },
      majUtilisateur: (id, patch) =>
        setState((s) => ({ ...s, utilisateurs: patchList(s.utilisateurs, id, patch) })),
      supprimerUtilisateur: (id) =>
        setState((s) => ({ ...s, utilisateurs: s.utilisateurs.filter((u) => u.id !== id) })),
      majSimulation: (id, patch) =>
        setState((s) => ({ ...s, simulations: patchList(s.simulations, id, patch) })),
      supprimerSimulation: (id) =>
        setState((s) => ({ ...s, simulations: s.simulations.filter((x) => x.id !== id) })),
      marquerLues: () =>
        setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, lue: true })) })),
      marquerLue: (id) =>
        setState((s) => ({ ...s, notifications: patchList(s.notifications, id, { lue: true }) })),
      reinitialiser: () => setState(initialState),
    };
  }, [state, ready, journaliser, notifier]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData doit être utilisé à l'intérieur de <DataProvider>");
  return ctx;
}
