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
  abonnementsClients as abonnementsSeed,
  clients as clientsSeed,
  moyensPaiementSeed,
  plans as plansSeed,
  transactions as transactionsSeed,
  type AbonnementClient,
  type ClientCompte,
  type MoyenPaiement,
  type PlanId,
  type PlanTarif,
  type Periodicite,
  type StatutAbonnement,
  type Transaction,
} from "@/lib/billing-data";

type BillingState = {
  plans: PlanTarif[];
  clients: ClientCompte[];
  abonnements: AbonnementClient[];
  transactions: Transaction[];
  moyensPaiement: MoyenPaiement[];
};

const STORAGE_KEY = "archbyai-billing-v1";

const initialState: BillingState = {
  plans: plansSeed,
  clients: clientsSeed,
  abonnements: abonnementsSeed,
  transactions: transactionsSeed,
  moyensPaiement: moyensPaiementSeed,
};

const patchList = <T extends { id: string }>(list: T[], id: string, patch: Partial<T>) =>
  list.map((item) => (item.id === id ? { ...item, ...patch } : item));

const dateFr = (d: Date) => new Intl.DateTimeFormat("fr-FR").format(d);
const dansNJours = (n: number) => dateFr(new Date(Date.now() + n * 86400000));

type Ctx = {
  state: BillingState;
  ready: boolean;
  // plans tarifaires
  creerPlan: (input: PlanTarif) => void;
  majPlan: (id: string, patch: Partial<PlanTarif>) => void;
  supprimerPlan: (id: string) => void;
  // abonnements
  creerAbonnement: (input: Omit<AbonnementClient, "id">) => AbonnementClient;
  majAbonnement: (id: string, patch: Partial<AbonnementClient>) => void;
  supprimerAbonnement: (id: string) => void;
  changerPlan: (id: string, plan: PlanId, periodicite: Periodicite, montant: number) => void;
  changerStatutAbonnement: (id: string, statut: StatutAbonnement) => void;
  appliquerRemise: (id: string, remise: number) => void;
  prolongerEssai: (id: string, jours: number) => void;
  // clients
  creerClient: (input: Omit<ClientCompte, "id">) => ClientCompte;
  majClient: (id: string, patch: Partial<ClientCompte>) => void;
  supprimerClient: (id: string) => void;
  // paiements
  changerStatutTransaction: (id: string, statut: Transaction["statut"]) => void;
  // moyens de paiement
  ajouterMoyen: (m: Omit<MoyenPaiement, "id">) => void;
  majMoyen: (id: string, patch: Partial<MoyenPaiement>) => void;
  definirDefaut: (id: string) => void;
  supprimerMoyen: (id: string) => void;
};

const BillingContext = createContext<Ctx | null>(null);

export function BillingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BillingState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initialState, ...(JSON.parse(raw) as BillingState) });
    } catch {
      /* stockage indisponible : état initial conservé */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota dépassé : la session reste en mémoire */
    }
  }, [state, ready]);

  const changerPlan = useCallback(
    (id: string, plan: PlanId, periodicite: Periodicite, montant: number) =>
      setState((s) => ({
        ...s,
        abonnements: patchList(s.abonnements, id, { plan, periodicite, montant, statut: "actif" }),
      })),
    [],
  );

  const value = useMemo<Ctx>(
    () => ({
      state,
      ready,
      creerPlan: (input) => setState((s) => ({ ...s, plans: [...s.plans, input] })),
      majPlan: (id, patch) => setState((s) => ({ ...s, plans: patchList(s.plans, id, patch) })),
      supprimerPlan: (id) => setState((s) => ({ ...s, plans: s.plans.filter((p) => p.id !== id) })),
      creerAbonnement: (input) => {
        const cree: AbonnementClient = { ...input, id: `SUB-${Math.floor(5000 + Math.random() * 4000)}` };
        setState((s) => ({ ...s, abonnements: [cree, ...s.abonnements] }));
        return cree;
      },
      majAbonnement: (id, patch) =>
        setState((s) => ({ ...s, abonnements: patchList(s.abonnements, id, patch) })),
      supprimerAbonnement: (id) =>
        setState((s) => ({ ...s, abonnements: s.abonnements.filter((a) => a.id !== id) })),
      changerPlan,
      changerStatutAbonnement: (id, statut) =>
        setState((s) => ({ ...s, abonnements: patchList(s.abonnements, id, { statut }) })),
      appliquerRemise: (id, remise) =>
        setState((s) => ({ ...s, abonnements: patchList(s.abonnements, id, { remise }) })),
      prolongerEssai: (id, jours) =>
        setState((s) => ({
          ...s,
          abonnements: patchList(s.abonnements, id, { statut: "essai", renouvellement: dansNJours(jours) }),
        })),
      creerClient: (input) => {
        const cree: ClientCompte = { ...input, id: `CLI-${Math.floor(100 + Math.random() * 899)}` };
        setState((s) => ({ ...s, clients: [cree, ...s.clients] }));
        return cree;
      },
      majClient: (id, patch) => setState((s) => ({ ...s, clients: patchList(s.clients, id, patch) })),
      supprimerClient: (id) =>
        setState((s) => ({
          ...s,
          clients: s.clients.filter((c) => c.id !== id),
          abonnements: s.abonnements.filter((a) => a.clientId !== id),
        })),
      changerStatutTransaction: (id, statut) =>
        setState((s) => ({ ...s, transactions: patchList(s.transactions, id, { statut }) })),
      ajouterMoyen: (m) =>
        setState((s) => {
          const cree: MoyenPaiement = { ...m, id: `PM-${Date.now()}` };
          const liste = m.defaut
            ? [...s.moyensPaiement.map((x) => ({ ...x, defaut: false })), cree]
            : [...s.moyensPaiement, cree];
          return { ...s, moyensPaiement: liste };
        }),
      majMoyen: (id, patch) =>
        setState((s) => ({ ...s, moyensPaiement: patchList(s.moyensPaiement, id, patch) })),
      definirDefaut: (id) =>
        setState((s) => ({
          ...s,
          moyensPaiement: s.moyensPaiement.map((m) => ({ ...m, defaut: m.id === id })),
        })),
      supprimerMoyen: (id) =>
        setState((s) => ({ ...s, moyensPaiement: s.moyensPaiement.filter((m) => m.id !== id) })),
    }),
    [state, ready, changerPlan],
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling() {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error("useBilling doit être utilisé à l'intérieur de <BillingProvider>");
  return ctx;
}
