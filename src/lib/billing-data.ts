/** Données de démonstration pour la facturation ArchbyAI (front-only, aucune API réelle). */

export type PlanId = "decouverte" | "pro" | "entreprise";

export type PlanTarif = {
  id: PlanId;
  nom: string;
  accroche: string;
  prixMensuel: number;
  prixAnnuel: number;
  simulations: string;
  populaire?: boolean;
  fonctionnalites: string[];
};

export type StatutAbonnement = "actif" | "essai" | "annule" | "expire";
export type Periodicite = "mensuel" | "annuel";

export type AbonnementClient = {
  id: string;
  clientId: string;
  client: string;
  email: string;
  plan: PlanId;
  periodicite: Periodicite;
  statut: StatutAbonnement;
  debut: string;
  renouvellement: string;
  montant: number;
  remise?: number;
};

export type StatutPaiement = "reussi" | "echoue" | "rembourse" | "en_attente";

export type Transaction = {
  id: string;
  date: string;
  clientId: string;
  client: string;
  abonnementId: string;
  montant: number;
  methode: string;
  statut: StatutPaiement;
  facture: string;
};

export type ClientCompte = {
  id: string;
  nom: string;
  email: string;
  societe: string;
  role: "Administrateur" | "Architecte" | "Utilisateur";
  statut: "actif" | "suspendu" | "invite";
  /** Espace d'appartenance : membre du back-office ou client du front-office. */
  espace: "back-office" | "client";
  inscription: string;
  derniereActivite: string;
};

export type MoyenPaiement = {
  id: string;
  marque: "Visa" | "Mastercard" | "CMI";
  fin: string;
  titulaire: string;
  expiration: string;
  defaut: boolean;
};

export const plans: PlanTarif[] = [
  {
    id: "decouverte",
    nom: "Découverte",
    accroche: "Pour tester la génération de plans 2D sur un premier projet.",
    prixMensuel: 490,
    prixAnnuel: 4900,
    simulations: "10 simulations / mois",
    fonctionnalites: [
      "Génération de plans 2D",
      "Aperçu 3D standard",
      "1 utilisateur",
      "Export PDF",
      "Support par e-mail",
    ],
  },
  {
    id: "pro",
    nom: "Pro",
    accroche: "Pour les cabinets d'architecture et promoteurs en croissance.",
    prixMensuel: 1890,
    prixAnnuel: 18900,
    simulations: "150 simulations / mois",
    populaire: true,
    fonctionnalites: [
      "Tout le plan Découverte",
      "Rendu 3D temps réel haute qualité",
      "Personnalisation matériaux (zellige, parquet…)",
      "Contrôle des normes marocaines",
      "10 utilisateurs",
      "Export DWG / IFC",
      "Support prioritaire",
    ],
  },
  {
    id: "entreprise",
    nom: "Entreprise",
    accroche: "Pour les grands comptes et collectivités avec volumes élevés.",
    prixMensuel: 5400,
    prixAnnuel: 54000,
    simulations: "Simulations illimitées",
    fonctionnalites: [
      "Tout le plan Pro",
      "API RESTful dédiée & quotas sur mesure",
      "Utilisateurs illimités",
      "SSO & journal d'audit",
      "Environnement dédié (SLA 99,9 %)",
      "Accompagnement dédié",
    ],
  },
];

export const planParId = (id: PlanId) => plans.find((p) => p.id === id)!;

export const clients: ClientCompte[] = [
  { id: "CLI-001", nom: "Mohamed Toufella", email: "mohamed.toufella@laposte.net", societe: "ArchbyAI", role: "Administrateur", statut: "actif", espace: "back-office", inscription: "04/01/2026", derniereActivite: "29/07/2026 14:40" },
  { id: "CLI-002", nom: "Salma El Amrani", email: "s.elamrani@atlas-immo.ma", societe: "Atlas Immobilier", role: "Architecte", statut: "actif", espace: "client", inscription: "12/01/2026", derniereActivite: "29/07/2026 09:18" },
  { id: "CLI-003", nom: "Youssef Bennani", email: "y.bennani@cabinet-bennani.ma", societe: "Cabinet Bennani", role: "Architecte", statut: "actif", espace: "client", inscription: "23/01/2026", derniereActivite: "28/07/2026 17:45" },
  { id: "CLI-004", nom: "Nadia Tazi", email: "n.tazi@residences-anfa.ma", societe: "Résidences Anfa", role: "Utilisateur", statut: "invite", espace: "client", inscription: "02/02/2026", derniereActivite: "—" },
  { id: "CLI-005", nom: "Hamza Idrissi", email: "h.idrissi@sahara-build.ma", societe: "Sahara Build", role: "Utilisateur", statut: "suspendu", espace: "client", inscription: "17/02/2026", derniereActivite: "12/07/2026 08:30" },
  { id: "CLI-006", nom: "Imane Cherkaoui", email: "i.cherkaoui@ville-casablanca.ma", societe: "Ville de Casablanca", role: "Architecte", statut: "actif", espace: "client", inscription: "05/03/2026", derniereActivite: "29/07/2026 08:05" },
  { id: "CLI-007", nom: "Karim Belhaj", email: "k.belhaj@studio-medina.ma", societe: "Studio Medina", role: "Utilisateur", statut: "actif", espace: "client", inscription: "21/03/2026", derniereActivite: "28/07/2026 19:22" },
  { id: "CLI-008", nom: "Omar Sbai", email: "o.sbai@sahara-build.ma", societe: "Sahara Build", role: "Architecte", statut: "actif", espace: "client", inscription: "09/04/2026", derniereActivite: "27/07/2026 15:47" },
  { id: "CLI-009", nom: "Leila Fassi", email: "l.fassi@residences-anfa.ma", societe: "Résidences Anfa", role: "Utilisateur", statut: "suspendu", espace: "client", inscription: "28/04/2026", derniereActivite: "02/07/2026 10:11" },
  { id: "CLI-010", nom: "Fatima Zahra Ouali", email: "fz.ouali@atlas-immo.ma", societe: "Atlas Immobilier", role: "Utilisateur", statut: "actif", espace: "client", inscription: "11/05/2026", derniereActivite: "26/07/2026 12:03" },
  { id: "CLI-011", nom: "Taha Toufella", email: "taha.toufella@archbyai.ma", societe: "ArchbyAI", role: "Administrateur", statut: "actif", espace: "back-office", inscription: "04/01/2026", derniereActivite: "29/07/2026 11:02" },
  { id: "CLI-012", nom: "Rachid Amrani", email: "r.amrani@medina-dev.ma", societe: "Medina Développement", role: "Architecte", statut: "actif", espace: "client", inscription: "02/06/2026", derniereActivite: "25/07/2026 16:31" },
  { id: "CLI-013", nom: "Sofia Berrada", email: "s.berrada@ville-rabat.ma", societe: "Ville de Rabat", role: "Utilisateur", statut: "actif", espace: "client", inscription: "19/06/2026", derniereActivite: "24/07/2026 10:47" },
  { id: "CLI-014", nom: "Anas Moukhliss", email: "a.moukhliss@atlantic-build.ma", societe: "Atlantic Build", role: "Architecte", statut: "invite", espace: "client", inscription: "07/07/2026", derniereActivite: "—" },
  { id: "CLI-015", nom: "Yasmine Alaoui", email: "y.alaoui@archbyai.ma", societe: "ArchbyAI", role: "Administrateur", statut: "actif", espace: "back-office", inscription: "15/01/2026", derniereActivite: "30/07/2026 09:12" },
  { id: "CLI-016", nom: "Mehdi Ouazzani", email: "m.ouazzani@archbyai.ma", societe: "ArchbyAI", role: "Utilisateur", statut: "actif", espace: "back-office", inscription: "03/03/2026", derniereActivite: "29/07/2026 18:40" },
];

export const abonnementsClients: AbonnementClient[] = [
  { id: "SUB-4001", clientId: "CLI-002", client: "Atlas Immobilier", email: "s.elamrani@atlas-immo.ma", plan: "entreprise", periodicite: "annuel", statut: "actif", debut: "12/01/2026", renouvellement: "12/01/2027", montant: 54000 },
  { id: "SUB-4002", clientId: "CLI-003", client: "Cabinet Bennani", email: "y.bennani@cabinet-bennani.ma", plan: "pro", periodicite: "mensuel", statut: "actif", debut: "23/01/2026", renouvellement: "23/08/2026", montant: 1890 },
  { id: "SUB-4003", clientId: "CLI-004", client: "Résidences Anfa", email: "n.tazi@residences-anfa.ma", plan: "pro", periodicite: "mensuel", statut: "essai", debut: "18/07/2026", renouvellement: "01/08/2026", montant: 0 },
  { id: "SUB-4004", clientId: "CLI-005", client: "Sahara Build", email: "h.idrissi@sahara-build.ma", plan: "decouverte", periodicite: "mensuel", statut: "annule", debut: "17/02/2026", renouvellement: "17/08/2026", montant: 490 },
  { id: "SUB-4005", clientId: "CLI-006", client: "Ville de Casablanca", email: "i.cherkaoui@ville-casablanca.ma", plan: "entreprise", periodicite: "annuel", statut: "actif", debut: "05/03/2026", renouvellement: "05/03/2027", montant: 54000, remise: 10 },
  { id: "SUB-4006", clientId: "CLI-007", client: "Studio Medina", email: "k.belhaj@studio-medina.ma", plan: "pro", periodicite: "annuel", statut: "actif", debut: "21/03/2026", renouvellement: "21/03/2027", montant: 18900 },
  { id: "SUB-4007", clientId: "CLI-009", client: "Résidences Anfa", email: "l.fassi@residences-anfa.ma", plan: "decouverte", periodicite: "mensuel", statut: "expire", debut: "28/04/2026", renouvellement: "28/06/2026", montant: 490 },
  { id: "SUB-4008", clientId: "CLI-010", client: "Atlas Immobilier", email: "fz.ouali@atlas-immo.ma", plan: "pro", periodicite: "mensuel", statut: "actif", debut: "11/05/2026", renouvellement: "11/08/2026", montant: 1890 },
  { id: "SUB-4009", clientId: "CLI-012", client: "Medina Développement", email: "r.amrani@medina-dev.ma", plan: "pro", periodicite: "mensuel", statut: "actif", debut: "02/06/2026", renouvellement: "02/08/2026", montant: 1890, remise: 15 },
  { id: "SUB-4010", clientId: "CLI-013", client: "Ville de Rabat", email: "s.berrada@ville-rabat.ma", plan: "entreprise", periodicite: "mensuel", statut: "actif", debut: "19/06/2026", renouvellement: "19/08/2026", montant: 5400 },
  { id: "SUB-4011", clientId: "CLI-014", client: "Atlantic Build", email: "a.moukhliss@atlantic-build.ma", plan: "decouverte", periodicite: "mensuel", statut: "essai", debut: "07/07/2026", renouvellement: "06/08/2026", montant: 0 },
  { id: "SUB-4012", clientId: "CLI-008", client: "Sahara Build", email: "o.sbai@sahara-build.ma", plan: "pro", periodicite: "annuel", statut: "annule", debut: "09/04/2026", renouvellement: "09/04/2027", montant: 18900 },
];

export const transactions: Transaction[] = [
  { id: "TRX-88120", date: "29/07/2026", clientId: "CLI-003", client: "Cabinet Bennani", abonnementId: "SUB-4002", montant: 1890, methode: "Visa •••• 4242", statut: "reussi", facture: "FA-2026-0412" },
  { id: "TRX-88119", date: "28/07/2026", clientId: "CLI-010", client: "Atlas Immobilier", abonnementId: "SUB-4008", montant: 1890, methode: "Mastercard •••• 8814", statut: "reussi", facture: "FA-2026-0411" },
  { id: "TRX-88118", date: "27/07/2026", clientId: "CLI-005", client: "Sahara Build", abonnementId: "SUB-4004", montant: 490, methode: "Visa •••• 1157", statut: "echoue", facture: "FA-2026-0410" },
  { id: "TRX-88117", date: "26/07/2026", clientId: "CLI-013", client: "Ville de Rabat", abonnementId: "SUB-4010", montant: 5400, methode: "Virement CMI", statut: "en_attente", facture: "FA-2026-0409" },
  { id: "TRX-88116", date: "24/07/2026", clientId: "CLI-012", client: "Medina Développement", abonnementId: "SUB-4009", montant: 1606, methode: "Visa •••• 9021", statut: "reussi", facture: "FA-2026-0408" },
  { id: "TRX-88115", date: "22/07/2026", clientId: "CLI-007", client: "Studio Medina", abonnementId: "SUB-4006", montant: 18900, methode: "Mastercard •••• 3390", statut: "reussi", facture: "FA-2026-0407" },
  { id: "TRX-88114", date: "20/07/2026", clientId: "CLI-009", client: "Résidences Anfa", abonnementId: "SUB-4007", montant: 490, methode: "Visa •••• 7712", statut: "rembourse", facture: "FA-2026-0406" },
  { id: "TRX-88113", date: "18/07/2026", clientId: "CLI-002", client: "Atlas Immobilier", abonnementId: "SUB-4001", montant: 54000, methode: "Virement CMI", statut: "reussi", facture: "FA-2026-0405" },
  { id: "TRX-88112", date: "15/07/2026", clientId: "CLI-006", client: "Ville de Casablanca", abonnementId: "SUB-4005", montant: 48600, methode: "Virement CMI", statut: "reussi", facture: "FA-2026-0404" },
  { id: "TRX-88111", date: "12/07/2026", clientId: "CLI-008", client: "Sahara Build", abonnementId: "SUB-4012", montant: 18900, methode: "Visa •••• 1157", statut: "echoue", facture: "FA-2026-0403" },
  { id: "TRX-88110", date: "09/07/2026", clientId: "CLI-003", client: "Cabinet Bennani", abonnementId: "SUB-4002", montant: 1890, methode: "Visa •••• 4242", statut: "reussi", facture: "FA-2026-0402" },
  { id: "TRX-88109", date: "05/07/2026", clientId: "CLI-010", client: "Atlas Immobilier", abonnementId: "SUB-4008", montant: 1890, methode: "Mastercard •••• 8814", statut: "reussi", facture: "FA-2026-0401" },
  { id: "TRX-88108", date: "28/06/2026", clientId: "CLI-012", client: "Medina Développement", abonnementId: "SUB-4009", montant: 1606, methode: "Visa •••• 9021", statut: "reussi", facture: "FA-2026-0398" },
  { id: "TRX-88107", date: "23/06/2026", clientId: "CLI-013", client: "Ville de Rabat", abonnementId: "SUB-4010", montant: 5400, methode: "Virement CMI", statut: "reussi", facture: "FA-2026-0397" },
  { id: "TRX-88106", date: "19/06/2026", clientId: "CLI-007", client: "Studio Medina", abonnementId: "SUB-4006", montant: 1890, methode: "Mastercard •••• 3390", statut: "rembourse", facture: "FA-2026-0396" },
  { id: "TRX-88105", date: "11/06/2026", clientId: "CLI-005", client: "Sahara Build", abonnementId: "SUB-4004", montant: 490, methode: "Visa •••• 1157", statut: "reussi", facture: "FA-2026-0395" },
];

/** Compte connecté simulé côté utilisateur final. */
export const compteCourant = {
  clientId: "CLI-003",
  abonnementId: "SUB-4002",
};

export const moyensPaiementSeed: MoyenPaiement[] = [
  { id: "PM-01", marque: "Visa", fin: "4242", titulaire: "Youssef Bennani", expiration: "09/2028", defaut: true },
  { id: "PM-02", marque: "Mastercard", fin: "8814", titulaire: "Cabinet Bennani SARL", expiration: "03/2027", defaut: false },
];

export const revenusSeries = [
  { mois: "Fév", revenus: 42800, mrr: 21400 },
  { mois: "Mar", revenus: 61200, mrr: 24900 },
  { mois: "Avr", revenus: 58400, mrr: 26100 },
  { mois: "Mai", revenus: 74300, mrr: 29800 },
  { mois: "Jui", revenus: 88100, mrr: 33500 },
  { mois: "Jul", revenus: 96700, mrr: 37200 },
];

export const inscriptionsSeries = [
  { semaine: "S26", inscriptions: 8, churn: 1 },
  { semaine: "S27", inscriptions: 12, churn: 2 },
  { semaine: "S28", inscriptions: 9, churn: 1 },
  { semaine: "S29", inscriptions: 15, churn: 3 },
  { semaine: "S30", inscriptions: 18, churn: 2 },
  { semaine: "S31", inscriptions: 14, churn: 1 },
];

export const formatMAD = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "MAD", maximumFractionDigits: 0 }).format(n);
