import { Suspense, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Grid, Html, OrbitControls, Sky } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";

import { genererPieces } from "@/components/plan-2d";
import type { Simulation } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const HAUTEUR_ETAGE = 3;
const EP_MUR_INT = 0.12;
const EP_MUR_EXT = 0.28;
const H_PORTE = 2.1;
const L_PORTE = 0.95;
const H_FENETRE = 1.3;
const L_FENETRE = 1.4;
const ALLEGE = 0.95;

const COULEURS_SOL: Record<string, { couleur: string; rugosite: number; damier?: [string, string]; pas: number }> = {
  Carrelage: { couleur: "#e8e4dc", rugosite: 0.25, damier: ["#efece6", "#d6d1c8"], pas: 0.6 },
  Parquet: { couleur: "#a9713f", rugosite: 0.55, damier: ["#b07a45", "#95602f"], pas: 0.22 },
  "Béton ciré": { couleur: "#a8a5a0", rugosite: 0.7, pas: 1 },
  Zellige: { couleur: "#1f6f8b", rugosite: 0.2, damier: ["#1f6f8b", "#e9e2d0"], pas: 0.3 },
};

const ECLAIRAGES: Record<string, { teinte: string; intensite: number; ciel: number; azimut: number; hauteur: number }> = {
  Chaud: { teinte: "#ffb46a", intensite: 2.6, ciel: 0.45, azimut: 150, hauteur: 18 },
  Neutre: { teinte: "#ffffff", intensite: 2.2, ciel: 0.7, azimut: 200, hauteur: 55 },
  Froid: { teinte: "#cfe4ff", intensite: 2.0, ciel: 0.9, azimut: 250, hauteur: 40 },
};

/** Texture procédurale (damier / lames) générée en canvas pour les revêtements de sol. */
function useTextureSol(sol: string) {
  return useMemo(() => {
    const cfg = COULEURS_SOL[sol] ?? COULEURS_SOL.Carrelage;
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = cfg.damier?.[0] ?? cfg.couleur;
    ctx.fillRect(0, 0, 256, 256);
    if (sol === "Parquet") {
      for (let y = 0; y < 256; y += 32) {
        for (let x = 0; x < 256; x += 128) {
          const dx = (y / 32) % 2 === 0 ? 0 : 64;
          ctx.fillStyle = (x / 128 + y / 32) % 2 === 0 ? "#b07a45" : "#a06c3b";
          ctx.fillRect(x + dx - 128, y, 126, 30);
        }
      }
    } else if (cfg.damier) {
      const t = sol === "Zellige" ? 32 : 64;
      for (let y = 0; y < 256; y += t) {
        for (let x = 0; x < 256; x += t) {
          ctx.fillStyle = ((x / t + y / t) % 2 === 0 ? cfg.damier[0] : cfg.damier[1]) as string;
          ctx.fillRect(x, y, t, t);
        }
      }
      ctx.strokeStyle = "rgba(0,0,0,.12)";
      for (let i = 0; i <= 256; i += t) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 256);
        ctx.moveTo(0, i);
        ctx.lineTo(256, i);
        ctx.stroke();
      }
    } else {
      const g = ctx.createLinearGradient(0, 0, 256, 256);
      g.addColorStop(0, "#b4b1ac");
      g.addColorStop(1, "#97948f");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    return tex;
  }, [sol]);
}

const STYLES: Record<string, { mur: string; toit: string; accent: string; sol: string }> = {
  Moderne: { mur: "#f1efe9", toit: "#4b5563", accent: "#1f2937", sol: "#c9c5bc" },
  "Traditionnel marocain": { mur: "#e8d4b0", toit: "#8c5a3c", accent: "#1f6f8b", sol: "#cbb894" },
  Minimaliste: { mur: "#fafafa", toit: "#9ca3af", accent: "#111827", sol: "#d8d6d1" },
  Méditerranéen: { mur: "#fdf6e8", toit: "#c05a3a", accent: "#2563a8", sol: "#d6cbb2" },
};

/** Arbre / palmier procédural pour le jardin. */
function Arbre({ position, palmier }: { position: [number, number, number]; palmier: boolean }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, palmier ? 2.4 : 1.1, 0]}>
        <cylinderGeometry args={[palmier ? 0.16 : 0.22, palmier ? 0.22 : 0.3, palmier ? 4.8 : 2.2, 8]} />
        <meshStandardMaterial color={palmier ? "#9b7b4f" : "#6b4b32"} roughness={1} />
      </mesh>
      {palmier ? (
        Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} castShadow position={[0, 4.7, 0]} rotation={[0.6, (i / 7) * Math.PI * 2, 0]}>
            <coneGeometry args={[0.35, 2.6, 4]} />
            <meshStandardMaterial color="#3f7d40" roughness={0.9} />
          </mesh>
        ))
      ) : (
        <mesh castShadow position={[0, 2.6, 0]}>
          <sphereGeometry args={[1.25, 16, 12]} />
          <meshStandardMaterial color="#3f7d40" roughness={1} />
        </mesh>
      )}
    </group>
  );
}

/** Aménagements extérieurs pilotés par la configuration de la simulation. */
function Exterieurs({
  sim,
  largeur,
  profondeur,
  style,
  hauteurTotale,
}: {
  sim: Simulation;
  largeur: number;
  profondeur: number;
  style: { mur: string; toit: string; accent: string; sol: string };
  hauteurTotale: number;
}) {
  const terrainX = largeur * 2.4;
  const terrainZ = profondeur * 2.6;
  const arbres = useMemo(() => {
    const n = Math.max(0, Math.min(24, sim.arbres ?? 0));
    return Array.from({ length: n }).map((_, i) => {
      const angle = (i / Math.max(1, n)) * Math.PI * 2 + 0.6;
      const r = Math.min(terrainX, terrainZ) * (0.34 + ((i * 7) % 5) * 0.035);
      return {
        pos: [Math.cos(angle) * r, 0, Math.sin(angle) * r] as [number, number, number],
        palmier: i % 3 !== 0,
      };
    });
  }, [sim.arbres, terrainX, terrainZ]);

  const px = largeur * 0.78;
  const pz = profondeur * 0.55;

  return (
    <group>
      {/* jardin engazonné */}
      {sim.jardin && (
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <planeGeometry args={[terrainX * 0.96, terrainZ * 0.96]} />
          <meshStandardMaterial color="#6f9e5b" roughness={1} />
        </mesh>
      )}

      {/* piscine : bassin creusé + margelle */}
      {sim.piscine && (
        <group position={[px, 0, pz]}>
          <mesh receiveShadow position={[0, 0.02, 0]}>
            <boxGeometry args={[largeur * 0.52, 0.08, profondeur * 0.42]} />
            <meshStandardMaterial color="#efe9dc" roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.35, 0]}>
            <boxGeometry args={[largeur * 0.42, 0.8, profondeur * 0.32]} />
            <meshStandardMaterial color="#1f6f8b" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <boxGeometry args={[largeur * 0.42, 0.02, profondeur * 0.32]} />
            <meshPhysicalMaterial color="#39b4dd" roughness={0.05} metalness={0.1} transmission={0.6} thickness={1.2} transparent opacity={0.85} />
          </mesh>
          <mesh castShadow position={[largeur * 0.28, 0.5, 0]}>
            <boxGeometry args={[0.7, 0.12, 1.9]} />
            <meshStandardMaterial color="#c9b18a" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* terrasse + pergola */}
      {sim.terrasse && (
        <group position={[-largeur * 0.72, 0, profondeur * 0.3]}>
          <mesh receiveShadow position={[0, 0.06, 0]}>
            <boxGeometry args={[largeur * 0.5, 0.12, profondeur * 0.5]} />
            <meshStandardMaterial color="#cbb193" roughness={0.85} />
          </mesh>
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
            <mesh key={i} castShadow position={[(sx * largeur * 0.5) / 2.3, 1.3, (sz * profondeur * 0.5) / 2.3]}>
              <boxGeometry args={[0.14, 2.6, 0.14]} />
              <meshStandardMaterial color={style.accent} roughness={0.8} />
            </mesh>
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={`p${i}`} castShadow position={[0, 2.62, -profondeur * 0.2 + (i * profondeur * 0.4) / 5]}>
              <boxGeometry args={[largeur * 0.5, 0.08, 0.1]} />
              <meshStandardMaterial color={style.accent} roughness={0.8} />
            </mesh>
          ))}
        </group>
      )}

      {/* garage */}
      {sim.garage && (
        <group position={[-largeur * 0.85, 0, -profondeur * 0.75]}>
          <mesh castShadow receiveShadow position={[0, 1.35, 0]}>
            <boxGeometry args={[5.2, 2.7, 5.4]} />
            <meshStandardMaterial color={style.mur} roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.15, 2.75]}>
            <boxGeometry args={[3.6, 2.2, 0.1]} />
            <meshStandardMaterial color={style.accent} roughness={0.5} metalness={0.3} />
          </mesh>
          <mesh castShadow position={[0, 2.78, 0]}>
            <boxGeometry args={[5.6, 0.16, 5.8]} />
            <meshStandardMaterial color={style.toit} roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* clôture + portail */}
      {sim.cloture && (
        <group>
          {[
            { p: [0, 0.9, -terrainZ / 2] as [number, number, number], a: [terrainX, 1.8, 0.18] as [number, number, number] },
            { p: [-terrainX / 2, 0.9, 0] as [number, number, number], a: [0.18, 1.8, terrainZ] as [number, number, number] },
            { p: [terrainX / 2, 0.9, 0] as [number, number, number], a: [0.18, 1.8, terrainZ] as [number, number, number] },
            { p: [-terrainX * 0.3, 0.9, terrainZ / 2] as [number, number, number], a: [terrainX * 0.4, 1.8, 0.18] as [number, number, number] },
            { p: [terrainX * 0.3, 0.9, terrainZ / 2] as [number, number, number], a: [terrainX * 0.4, 1.8, 0.18] as [number, number, number] },
          ].map((m, i) => (
            <mesh key={i} castShadow receiveShadow position={m.p}>
              <boxGeometry args={m.a} />
              <meshStandardMaterial color={style.mur} roughness={0.95} />
            </mesh>
          ))}
          <mesh position={[0, 0.85, terrainZ / 2]}>
            <boxGeometry args={[terrainX * 0.2, 1.7, 0.08]} />
            <meshStandardMaterial color={style.accent} metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      )}

      {/* allée d'accès */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, terrainZ * 0.34]}>
        <planeGeometry args={[3.2, terrainZ * 0.3]} />
        <meshStandardMaterial color="#b9b2a5" roughness={1} />
      </mesh>

      {/* panneaux solaires en toiture */}
      {sim.panneauxSolaires && (
        <group position={[0, hauteurTotale + 0.35, 0]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} castShadow rotation={[-0.35, 0, 0]} position={[-largeur * 0.28 + (i % 3) * largeur * 0.28, 0.2, i < 3 ? -profondeur * 0.18 : profondeur * 0.18]}>
              <boxGeometry args={[largeur * 0.24, 0.06, profondeur * 0.2]} />
              <meshStandardMaterial color="#12233d" metalness={0.6} roughness={0.25} />
            </mesh>
          ))}
        </group>
      )}

      {arbres.map((a, i) => (
        <Arbre key={i} position={a.pos} palmier={a.palmier} />
      ))}
    </group>
  );
}

type Segment = { x: number; z: number; l: number; vertical: boolean };

/** Découpe un mur en tronçons de part et d'autre d'une ouverture centrale. */
function tronconsAvecPorte(seg: Segment, ouverture: number): Segment[] {
  if (seg.l <= ouverture + 0.6) return [seg];
  const reste = (seg.l - ouverture) / 2;
  const d = ouverture / 2 + reste / 2;
  return [
    { ...seg, l: reste, x: seg.vertical ? seg.x : seg.x - d, z: seg.vertical ? seg.z - d : seg.z },
    { ...seg, l: reste, x: seg.vertical ? seg.x : seg.x + d, z: seg.vertical ? seg.z + d : seg.z },
  ];
}

function Mur({
  seg,
  hauteur,
  epaisseur,
  couleur,
  y,
}: {
  seg: Segment;
  hauteur: number;
  epaisseur: number;
  couleur: string;
  y: number;
}) {
  return (
    <mesh
      castShadow
      receiveShadow
      position={[seg.x, y + hauteur / 2, seg.z]}
      geometry={undefined}
    >
      <boxGeometry args={seg.vertical ? [epaisseur, hauteur, seg.l] : [seg.l, hauteur, epaisseur]} />
      <meshStandardMaterial color={couleur} roughness={0.85} metalness={0.02} />
    </mesh>
  );
}

function Vitrage({
  position,
  taille,
  vertical,
  teinte,
}: {
  position: [number, number, number];
  taille: [number, number];
  vertical: boolean;
  teinte: string;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={vertical ? [0.06, taille[1], taille[0]] : [taille[0], taille[1], 0.06]} />
      <meshPhysicalMaterial
        color="#bcd8ee"
        transmission={0.85}
        thickness={0.4}
        roughness={0.06}
        metalness={0}
        emissive={teinte}
        emissiveIntensity={0.22}
        transparent
        opacity={0.55}
      />
    </mesh>
  );
}

/** Façade percée de baies : allège, linteau et trumeaux calculés. */
function Facade({
  longueur,
  hauteur,
  y,
  centre,
  vertical,
  couleur,
  baies,
  teinte,
}: {
  longueur: number;
  hauteur: number;
  y: number;
  centre: [number, number];
  vertical: boolean;
  couleur: string;
  baies: number;
  teinte: string;
}) {
  const pas = longueur / (baies + 1);
  const elements: ReactElement[] = [];

  // trumeaux
  const bords: number[] = [];
  for (let i = 0; i < baies; i += 1) bords.push(-longueur / 2 + pas * (i + 1));
  let curseur = -longueur / 2;
  bords.forEach((c, i) => {
    const debut = c - L_FENETRE / 2;
    const l = debut - curseur;
    if (l > 0.02) elements.push(<Bloc key={`t${i}`} l={l} h={hauteur} off={curseur + l / 2} yy={y + hauteur / 2} vertical={vertical} centre={centre} couleur={couleur} />);
    curseur = c + L_FENETRE / 2;
  });
  if (longueur / 2 - curseur > 0.02) {
    const l = longueur / 2 - curseur;
    elements.push(<Bloc key="tf" l={l} h={hauteur} off={curseur + l / 2} yy={y + hauteur / 2} vertical={vertical} centre={centre} couleur={couleur} />);
  }

  bords.forEach((c, i) => {
    elements.push(
      <Bloc key={`a${i}`} l={L_FENETRE} h={ALLEGE} off={c} yy={y + ALLEGE / 2} vertical={vertical} centre={centre} couleur={couleur} />,
    );
    const hLint = hauteur - ALLEGE - H_FENETRE;
    if (hLint > 0.02)
      elements.push(
        <Bloc key={`l${i}`} l={L_FENETRE} h={hLint} off={c} yy={y + hauteur - hLint / 2} vertical={vertical} centre={centre} couleur={couleur} />,
      );
    const px = vertical ? centre[0] : centre[0] + c;
    const pz = vertical ? centre[1] + c : centre[1];
    elements.push(
      <Vitrage
        key={`v${i}`}
        position={[px, y + ALLEGE + H_FENETRE / 2, pz]}
        taille={[L_FENETRE, H_FENETRE]}
        vertical={vertical}
        teinte={teinte}
      />,
    );
  });

  return <group>{elements}</group>;
}

function Bloc({
  l,
  h,
  off,
  yy,
  vertical,
  centre,
  couleur,
}: {
  l: number;
  h: number;
  off: number;
  yy: number;
  vertical: boolean;
  centre: [number, number];
  couleur: string;
}) {
  const x = vertical ? centre[0] : centre[0] + off;
  const z = vertical ? centre[1] + off : centre[1];
  return (
    <mesh castShadow receiveShadow position={[x, yy, z]}>
      <boxGeometry args={vertical ? [EP_MUR_EXT, h, l] : [l, h, EP_MUR_EXT]} />
      <meshStandardMaterial color={couleur} roughness={0.9} metalness={0.02} />
    </mesh>
  );
}

function Etage({
  sim,
  index,
  peinture,
  textureSol,
  teinte,
  largeur,
  profondeur,
  etiquettes,
  opacite,
}: {
  sim: Simulation;
  index: number;
  peinture: string;
  textureSol: THREE.Texture | null;
  teinte: string;
  largeur: number;
  profondeur: number;
  etiquettes: boolean;
  opacite: number;
}) {
  const pieces = useMemo(() => genererPieces(sim, index), [sim, index]);
  const sx = largeur / 12;
  const sz = profondeur / 8;
  const y = index * HAUTEUR_ETAGE;
  const baies = Math.max(2, Math.min(6, sim.facades ?? 3));

  const cloisons = useMemo(() => {
    const list: Segment[] = [];
    pieces.forEach((p) => {
      const x0 = p.x * sx - largeur / 2;
      const z0 = p.y * sz - profondeur / 2;
      const w = p.w * sx;
      const d = p.h * sz;
      // mur haut (z0) et mur gauche (x0) : évite les doublons entre pièces adjacentes
      if (z0 > -profondeur / 2 + 0.05) list.push(...tronconsAvecPorte({ x: x0 + w / 2, z: z0, l: w, vertical: false }, L_PORTE));
      if (x0 > -largeur / 2 + 0.05) list.push(...tronconsAvecPorte({ x: x0, z: z0 + d / 2, l: d, vertical: true }, L_PORTE));
    });
    return list;
  }, [pieces, sx, sz, largeur, profondeur]);

  return (
    <group>
      {/* dalle + revêtement */}
      <mesh receiveShadow position={[0, y + 0.05, 0]}>
        <boxGeometry args={[largeur, 0.1, profondeur]} />
        <meshStandardMaterial
          map={textureSol ?? undefined}
          color={textureSol ? "#ffffff" : "#ddd"}
          roughness={0.5}
          transparent={opacite < 1}
          opacity={opacite}
        />
      </mesh>

      {/* cloisons intérieures */}
      {cloisons.map((s, i) => (
        <Mur key={i} seg={s} hauteur={HAUTEUR_ETAGE - 0.3} epaisseur={EP_MUR_INT} couleur={peinture} y={y + 0.1} />
      ))}

      {/* façades percées */}
      <Facade longueur={largeur} hauteur={HAUTEUR_ETAGE - 0.1} y={y + 0.1} centre={[0, -profondeur / 2]} vertical={false} couleur={peinture} baies={baies} teinte={teinte} />
      <Facade longueur={largeur} hauteur={HAUTEUR_ETAGE - 0.1} y={y + 0.1} centre={[0, profondeur / 2]} vertical={false} couleur={peinture} baies={baies} teinte={teinte} />
      <Facade longueur={profondeur} hauteur={HAUTEUR_ETAGE - 0.1} y={y + 0.1} centre={[-largeur / 2, 0]} vertical couleur={peinture} baies={Math.max(2, baies - 1)} teinte={teinte} />
      <Facade longueur={profondeur} hauteur={HAUTEUR_ETAGE - 0.1} y={y + 0.1} centre={[largeur / 2, 0]} vertical couleur={peinture} baies={Math.max(2, baies - 1)} teinte={teinte} />

      {/* étiquettes de pièces */}
      {etiquettes &&
        pieces
          .filter((p) => p.w * sx * p.h * sz > 7)
          .map((p, i) => (
          <Html
            key={i}
            position={[p.x * sx - largeur / 2 + (p.w * sx) / 2, y + 1.4, p.y * sz - profondeur / 2 + (p.h * sz) / 2]}
            center
            distanceFactor={22}
            occlude={false}
          >
            <div className="whitespace-nowrap rounded-md bg-background/85 px-2 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur">
              {p.nom}
              <span className="ml-1 font-normal text-muted-foreground">
                {Math.round(p.w * sx * p.h * sz)} m²
              </span>
            </div>
          </Html>
          ))}
    </group>
  );
}

function Batiment({
  sim,
  peinture,
  sol,
  eclairage,
  etagesVisibles,
  toit,
  etiquettes,
}: {
  sim: Simulation;
  peinture: string;
  sol: string;
  eclairage: string;
  etagesVisibles: number;
  toit: boolean;
  etiquettes: boolean;
}) {
  const textureSol = useTextureSol(sol);
  const styleCfg = STYLES[sim.style ?? "Moderne"] ?? STYLES.Moderne;
  const lum = ECLAIRAGES[eclairage] ?? ECLAIRAGES.Neutre;
  const etages = Math.max(1, Math.min(8, sim.etages));
  const surfaceEtage = Math.max(40, sim.superficie / etages);
  const largeur = Math.sqrt(surfaceEtage * 1.5);
  const profondeur = surfaceEtage / largeur;

  useEffect(() => {
    if (textureSol) textureSol.repeat.set(largeur / 3, profondeur / 3);
  }, [textureSol, largeur, profondeur]);

  return (
    <group>
      {/* terrain */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[largeur * 2.4, profondeur * 2.6]} />
        <meshStandardMaterial color={styleCfg.sol} roughness={1} />
      </mesh>

      <Exterieurs sim={sim} largeur={largeur} profondeur={profondeur} style={styleCfg} hauteurTotale={etages * HAUTEUR_ETAGE} />

      {sim.sousSol && (
        <mesh position={[0, -HAUTEUR_ETAGE / 2, 0]}>
          <boxGeometry args={[largeur, HAUTEUR_ETAGE, profondeur]} />
          <meshStandardMaterial color="#6b7280" roughness={1} transparent opacity={0.35} />
        </mesh>
      )}

      {Array.from({ length: Math.min(etagesVisibles, etages) }).map((_, i) => (
        <Etage
          key={i}
          sim={sim}
          index={i}
          peinture={peinture}
          textureSol={textureSol}
          teinte={lum.teinte}
          largeur={largeur}
          profondeur={profondeur}
          etiquettes={etiquettes && i === Math.min(etagesVisibles, etages) - 1}
          opacite={1}
        />
      ))}

      {toit && etagesVisibles >= etages && (
        <group position={[0, etages * HAUTEUR_ETAGE + 0.1, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[largeur + 0.6, 0.22, profondeur + 0.6]} />
            <meshStandardMaterial color={styleCfg.toit} roughness={0.95} />
          </mesh>

          {(sim.toiture ?? "Plate") === "Tuiles" ? (
            <mesh castShadow position={[0, (Math.min(largeur, profondeur) * 0.28) / 2 + 0.2, 0]} rotation={[0, Math.PI / 4, 0]}>
              <coneGeometry args={[Math.max(largeur, profondeur) * 0.72, Math.min(largeur, profondeur) * 0.28, 4]} />
              <meshStandardMaterial color="#a8492c" roughness={0.85} />
            </mesh>
          ) : (
            <>
              {[
                { p: [0, 0.55, (profondeur + 0.6) / 2] as [number, number, number], a: [largeur + 0.6, 0.9, 0.18] as [number, number, number] },
                { p: [0, 0.55, -(profondeur + 0.6) / 2] as [number, number, number], a: [largeur + 0.6, 0.9, 0.18] as [number, number, number] },
                { p: [(largeur + 0.6) / 2, 0.55, 0] as [number, number, number], a: [0.18, 0.9, profondeur + 0.6] as [number, number, number] },
                { p: [-(largeur + 0.6) / 2, 0.55, 0] as [number, number, number], a: [0.18, 0.9, profondeur + 0.6] as [number, number, number] },
              ].map((m, i) => (
                <mesh key={i} castShadow position={m.p}>
                  <boxGeometry args={m.a} />
                  <meshStandardMaterial color={peinture} roughness={0.9} />
                </mesh>
              ))}
              {(sim.toiture ?? "Plate") === "Terrasse accessible" && (
                <mesh receiveShadow position={[0, 0.18, 0]}>
                  <boxGeometry args={[largeur, 0.06, profondeur]} />
                  <meshStandardMaterial color="#cbb193" roughness={0.9} />
                </mesh>
              )}
            </>
          )}
        </group>
      )}
    </group>
  );
}

function Camera({
  vue,
  rayon,
  controls,
}: {
  vue: string;
  rayon: number;
  controls: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const cible = useRef(new THREE.Vector3(rayon * 1.1, rayon * 0.8, rayon * 1.3));
  const focus = useRef(new THREE.Vector3(0, rayon * 0.25, 0));

  useEffect(() => {
    const presets: Record<string, [THREE.Vector3, THREE.Vector3]> = {
      perspective: [new THREE.Vector3(rayon * 1.1, rayon * 0.85, rayon * 1.3), new THREE.Vector3(0, rayon * 0.25, 0)],
      dessus: [new THREE.Vector3(0.01, rayon * 2.1, 0.01), new THREE.Vector3(0, 0, 0)],
      facade: [new THREE.Vector3(0, rayon * 0.45, rayon * 2.1), new THREE.Vector3(0, rayon * 0.35, 0)],
      interieur: [new THREE.Vector3(0, 1.65, rayon * 0.12), new THREE.Vector3(0, 1.6, -rayon)],
    };
    const p = presets[vue] ?? presets.perspective;
    cible.current.copy(p[0]);
    focus.current.copy(p[1]);
  }, [vue, rayon]);

  useFrame(() => {
    camera.position.lerp(cible.current, 0.08);
    const c = controls.current;
    if (c) {
      c.target.lerp(focus.current, 0.08);
      c.update();
    }
  });
  return null;
}

export default function Plan3DScene({
  simulation,
  peinture,
  sol,
  eclairage,
}: {
  simulation: Simulation;
  peinture: string;
  sol: string;
  eclairage: string;
}) {
  const etages = Math.max(1, Math.min(8, simulation.etages));
  const [etagesVisibles, setEtagesVisibles] = useState(etages);
  const [toit, setToit] = useState(true);
  const [etiquettes, setEtiquettes] = useState(true);
  const [ombres, setOmbres] = useState(true);
  const [vue, setVue] = useState("perspective");
  const controls = useRef<OrbitControlsImpl | null>(null);
  const lum = ECLAIRAGES[eclairage] ?? ECLAIRAGES.Neutre;
  const rayon = Math.max(14, Math.sqrt(simulation.superficie) * 1.1 + etages * 2);

  useEffect(() => setEtagesVisibles(etages), [etages]);

  const soleil = useMemo<[number, number, number]>(() => {
    const az = (lum.azimut * Math.PI) / 180;
    const el = (lum.hauteur * Math.PI) / 180;
    const r = rayon * 2.2;
    return [Math.cos(az) * Math.cos(el) * r, Math.sin(el) * r + 6, Math.sin(az) * Math.cos(el) * r];
  }, [lum, rayon]);

  return (
    <div className="relative h-[560px] overflow-hidden rounded-2xl border border-border bg-gradient-brand-soft">
      <Canvas
        shadows={ombres}
        dpr={[1, 2]}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        camera={{ fov: 45, near: 0.1, far: 2000, position: [rayon, rayon * 0.8, rayon * 1.2] }}
      >
        <Suspense fallback={null}>
          <hemisphereLight intensity={lum.ciel} groundColor="#b9b2a5" />
          <directionalLight
            position={soleil}
            intensity={lum.intensite}
            color={lum.teinte}
            castShadow={ombres}
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-rayon * 1.6}
            shadow-camera-right={rayon * 1.6}
            shadow-camera-top={rayon * 1.6}
            shadow-camera-bottom={-rayon * 1.6}
            shadow-normalBias={0.04}
            shadow-bias={-0.0005}
          />
          <Sky sunPosition={soleil} turbidity={6} rayleigh={eclairage === "Chaud" ? 3 : 1.2} />
          <Environment preset="city" />

          <Batiment
            sim={simulation}
            peinture={peinture}
            sol={sol}
            eclairage={eclairage}
            etagesVisibles={etagesVisibles}
            toit={toit}
            etiquettes={etiquettes}
          />

          <Grid
            position={[0, 0.01, 0]}
            args={[rayon * 4, rayon * 4]}
            cellSize={1}
            cellColor="#9aa4b2"
            sectionSize={5}
            sectionColor="#5b6c85"
            fadeDistance={rayon * 3}
            infiniteGrid
          />
          <ContactShadows position={[0, 0.02, 0]} opacity={0.45} scale={rayon * 3} blur={2.4} far={20} />

          <OrbitControls
            ref={controls}
            makeDefault
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.8}
            zoomSpeed={0.9}
            panSpeed={0.8}
            minDistance={2}
            maxDistance={rayon * 4}
            maxPolarAngle={Math.PI / 2.02}
          />
          <Camera vue={vue} rayon={rayon} controls={controls} />
        </Suspense>
      </Canvas>

      {/* HUD de contrôle */}
      <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2">
        <div className="pointer-events-auto flex flex-wrap gap-1 rounded-xl border border-border bg-background/80 p-1 backdrop-blur">
          {[
            { id: "perspective", label: "Perspective" },
            { id: "dessus", label: "Vue du dessus" },
            { id: "facade", label: "Façade" },
            { id: "interieur", label: "Intérieur" },
          ].map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVue(v.id)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
                vue === v.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center gap-1 rounded-xl border border-border bg-background/80 p-1 backdrop-blur">
          <button
            type="button"
            onClick={() => setToit((t) => !t)}
            className={cn("rounded-lg px-2.5 py-1.5 text-[11px] font-semibold", toit ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
          >
            Toiture
          </button>
          <button
            type="button"
            onClick={() => setEtiquettes((t) => !t)}
            className={cn("rounded-lg px-2.5 py-1.5 text-[11px] font-semibold", etiquettes ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
          >
            Étiquettes
          </button>
          <button
            type="button"
            onClick={() => setOmbres((t) => !t)}
            className={cn("rounded-lg px-2.5 py-1.5 text-[11px] font-semibold", ombres ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
          >
            Ombres
          </button>
        </div>
      </div>

      <div className="pointer-events-auto absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/80 px-3 py-2 text-[11px] font-semibold text-muted-foreground backdrop-blur">
        <label className="flex items-center gap-2">
          Coupe · niveaux {etagesVisibles}/{etages}
          <input
            type="range"
            min={1}
            max={etages}
            value={etagesVisibles}
            onChange={(e) => setEtagesVisibles(Number(e.target.value))}
            className="h-1 w-36 cursor-pointer accent-[var(--color-primary)]"
          />
        </label>
        <span>
          {simulation.superficie} m² · {etages} niveau(x) · glisser = orbite · molette = zoom · clic droit = déplacer
        </span>
      </div>
    </div>
  );
}
