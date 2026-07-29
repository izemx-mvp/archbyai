export type ApiStatus = "actif" | "suspendu" | "erreur" | "maintenance";
export type Plan = "Découverte" | "Pro" | "Entreprise";

export type ApiSubscription = {
  id: string;
  nom: string;
  client: string;
  plan: Plan;
  statut: ApiStatus;
  quota: number;
  consomme: number;
  latence: number;
  renouvellement: string;
};

export type ServiceItem = {
  id: string;
  nom: string;
  description: string;
  statut: "en_cours" | "arrete" | "degrade";
  region: string;
  uptime: number;
  version: string;
};

export type HistoriqueEntry = {
  id: string;
  date: string;
  api: string;
  action: string;
  utilisateur: string;
  code: number;
  duree: number;
};

export type Utilisateur = {
  id: string;
  nom: string;
  email: string;
  role: "Administrateur" | "Architecte" | "Utilisateur";
  statut: "actif" | "invite" | "desactive";
  derniereConnexion: string;
};

export type Simulation = {
  id: string;
  reference: string;
  type: "Non commercial" | "Commercial" | "Villa";
  ville: string;
  superficie: number;
  etages: number;
  chambres: number;
  statut: "generee" | "en_cours" | "validee" | "rejetee";
  auteur: string;
  date: string;
};

export const apis: ApiSubscription[] = [
  { id: "API-1042", nom: "Génération plan 2D", client: "Atlas Immobilier", plan: "Entreprise", statut: "actif", quota: 50000, consomme: 38420, latence: 214, renouvellement: "12/09/2026" },
  { id: "API-1043", nom: "Rendu 3D temps réel", client: "Atlas Immobilier", plan: "Entreprise", statut: "actif", quota: 20000, consomme: 17650, latence: 486, renouvellement: "12/09/2026" },
  { id: "API-1051", nom: "Conformité normes MA", client: "Cabinet Bennani", plan: "Pro", statut: "maintenance", quota: 10000, consomme: 4210, latence: 132, renouvellement: "01/08/2026" },
  { id: "API-1067", nom: "Upload plan topographique", client: "Ville de Casablanca", plan: "Entreprise", statut: "actif", quota: 30000, consomme: 9120, latence: 97, renouvellement: "30/11/2026" },
  { id: "API-1072", nom: "Partage sécurisé", client: "Résidences Anfa", plan: "Pro", statut: "suspendu", quota: 8000, consomme: 8000, latence: 158, renouvellement: "05/08/2026" },
  { id: "API-1080", nom: "Estimation coûts", client: "Sahara Build", plan: "Découverte", statut: "erreur", quota: 2000, consomme: 1870, latence: 921, renouvellement: "22/08/2026" },
  { id: "API-1091", nom: "Personnalisation matériaux", client: "Studio Medina", plan: "Pro", statut: "actif", quota: 12000, consomme: 3340, latence: 176, renouvellement: "14/10/2026" },
];

export const services: ServiceItem[] = [
  { id: "SVC-01", nom: "Moteur de génération IA", description: "Génération des plans d'architecture", statut: "en_cours", region: "Azure – France Centre", uptime: 99.98, version: "v4.2.1" },
  { id: "SVC-02", nom: "Rendu 3D", description: "Pipeline de rendu et visualisation 3D", statut: "en_cours", region: "Azure – France Centre", uptime: 99.61, version: "v3.8.0" },
  { id: "SVC-03", nom: "Validation normes marocaines", description: "Contrôle de conformité urbanistique", statut: "degrade", region: "On-premise – Rabat", uptime: 97.24, version: "v2.5.4" },
  { id: "SVC-04", nom: "Passerelle API RESTful", description: "Exposition HTTPS des API publiques", statut: "en_cours", region: "Azure – App Service", uptime: 99.99, version: "v5.0.3" },
  { id: "SVC-05", nom: "Service de partage sécurisé", description: "Liens de simulation protégés", statut: "arrete", region: "Azure – France Centre", uptime: 92.1, version: "v1.9.2" },
];

export const historique: HistoriqueEntry[] = [
  { id: "LOG-9001", date: "29/07/2026 14:32", api: "Génération plan 2D", action: "POST /v1/plans", utilisateur: "s.elamrani", code: 201, duree: 1840 },
  { id: "LOG-9002", date: "29/07/2026 14:28", api: "Rendu 3D temps réel", action: "POST /v1/render", utilisateur: "y.bennani", code: 200, duree: 3120 },
  { id: "LOG-9003", date: "29/07/2026 14:11", api: "Estimation coûts", action: "GET /v1/estimate", utilisateur: "api-sahara", code: 503, duree: 921 },
  { id: "LOG-9004", date: "29/07/2026 13:57", api: "Partage sécurisé", action: "POST /v1/share", utilisateur: "n.tazi", code: 403, duree: 88 },
  { id: "LOG-9005", date: "29/07/2026 13:40", api: "Conformité normes MA", action: "POST /v1/compliance", utilisateur: "m.toufella", code: 200, duree: 412 },
  { id: "LOG-9006", date: "29/07/2026 13:22", api: "Upload plan topographique", action: "PUT /v1/topo", utilisateur: "ville-casa", code: 201, duree: 2260 },
  { id: "LOG-9007", date: "29/07/2026 12:58", api: "Génération plan 2D", action: "POST /v1/plans", utilisateur: "h.idrissi", code: 429, duree: 61 },
  { id: "LOG-9008", date: "29/07/2026 12:31", api: "Personnalisation matériaux", action: "PATCH /v1/materials", utilisateur: "studio-medina", code: 200, duree: 305 },
];

export const utilisateurs: Utilisateur[] = [
  { id: "USR-01", nom: "Mohamed Toufella", email: "mohamed.toufella@laposte.net", role: "Administrateur", statut: "actif", derniereConnexion: "29/07/2026 14:40" },
  { id: "USR-02", nom: "Taha Toufella", email: "taha.toufella@archbyai.ma", role: "Administrateur", statut: "actif", derniereConnexion: "29/07/2026 11:02" },
  { id: "USR-03", nom: "Salma El Amrani", email: "s.elamrani@atlas-immo.ma", role: "Architecte", statut: "actif", derniereConnexion: "29/07/2026 09:18" },
  { id: "USR-04", nom: "Youssef Bennani", email: "y.bennani@cabinet-bennani.ma", role: "Architecte", statut: "actif", derniereConnexion: "28/07/2026 17:45" },
  { id: "USR-05", nom: "Nadia Tazi", email: "n.tazi@residences-anfa.ma", role: "Utilisateur", statut: "invite", derniereConnexion: "—" },
  { id: "USR-06", nom: "Hamza Idrissi", email: "h.idrissi@sahara-build.ma", role: "Utilisateur", statut: "desactive", derniereConnexion: "12/07/2026 08:30" },
];

export const simulations: Simulation[] = [
  { id: "SIM-2201", reference: "R2-CASA-0041", type: "Non commercial", ville: "Casablanca", superficie: 320, etages: 3, chambres: 9, statut: "validee", auteur: "Salma El Amrani", date: "29/07/2026" },
  { id: "SIM-2202", reference: "VL-MARR-0088", type: "Villa", ville: "Marrakech", superficie: 640, etages: 2, chambres: 5, statut: "generee", auteur: "Youssef Bennani", date: "28/07/2026" },
  { id: "SIM-2203", reference: "CM-RABA-0012", type: "Commercial", ville: "Rabat", superficie: 1250, etages: 5, chambres: 0, statut: "en_cours", auteur: "Nadia Tazi", date: "28/07/2026" },
  { id: "SIM-2204", reference: "R2-TANG-0107", type: "Non commercial", ville: "Tanger", superficie: 410, etages: 4, chambres: 12, statut: "generee", auteur: "Hamza Idrissi", date: "27/07/2026" },
  { id: "SIM-2205", reference: "VL-AGAD-0033", type: "Villa", ville: "Agadir", superficie: 780, etages: 1, chambres: 4, statut: "rejetee", auteur: "Salma El Amrani", date: "26/07/2026" },
  { id: "SIM-2206", reference: "CM-CASA-0075", type: "Commercial", ville: "Casablanca", superficie: 2100, etages: 7, chambres: 0, statut: "validee", auteur: "Youssef Bennani", date: "25/07/2026" },
];

export const trafficSeries = [
  { jour: "Lun", appels: 4200, simulations: 320 },
  { jour: "Mar", appels: 5100, simulations: 410 },
  { jour: "Mer", appels: 4780, simulations: 388 },
  { jour: "Jeu", appels: 6320, simulations: 502 },
  { jour: "Ven", appels: 7010, simulations: 561 },
  { jour: "Sam", appels: 3120, simulations: 214 },
  { jour: "Dim", appels: 2480, simulations: 168 },
];

export const repartitionTypes = [
  { name: "Non commercial", value: 46 },
  { name: "Commercial", value: 31 },
  { name: "Villa", value: 23 },
];

export const activites = [
  { id: 1, titre: "Nouvelle simulation validée", detail: "R2-CASA-0041 · Casablanca", temps: "il y a 4 min", type: "success" as const },
  { id: 2, titre: "Quota atteint", detail: "Partage sécurisé · Résidences Anfa", temps: "il y a 22 min", type: "warning" as const },
  { id: 3, titre: "Service arrêté", detail: "Service de partage sécurisé", temps: "il y a 1 h", type: "error" as const },
  { id: 4, titre: "Nouvel abonnement API", detail: "Studio Medina · Plan Pro", temps: "il y a 3 h", type: "info" as const },
  { id: 5, titre: "Utilisateur invité", detail: "n.tazi@residences-anfa.ma", temps: "hier", type: "info" as const },
];

export const DEMO_CREDENTIALS = {
  email: "admin@archbyai.ma",
  password: "ArchbyAI2026!",
};
