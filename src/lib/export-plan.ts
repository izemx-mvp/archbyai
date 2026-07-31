/**
 * Exports de plans vers des formats lisibles par les logiciels Adobe :
 * - 2D : SVG (Illustrator / Photoshop / InDesign) et PNG haute résolution
 * - 3D : OBJ (Dimension, Substance, Aero) et GLB / glTF binaire (Dimension, Aero)
 */

export function telecharger(blob: Blob, nom: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const PROPS_SVG = [
  "fill",
  "fill-opacity",
  "fill-rule",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-dasharray",
  "opacity",
  "font-family",
  "font-size",
  "font-weight",
  "letter-spacing",
  "text-anchor",
] as const;

/** Clone le SVG en figeant toutes les couleurs/typos calculées (les variables CSS ne survivent pas à l'export). */
function svgAutonome(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const originaux = [svg, ...Array.from(svg.querySelectorAll<SVGElement>("*"))];
  const copies = [clone, ...Array.from(clone.querySelectorAll<SVGElement>("*"))];

  copies.forEach((el, i) => {
    const src = originaux[i];
    if (!src) return;
    const cs = window.getComputedStyle(src);
    const decl: string[] = [];
    for (const p of PROPS_SVG) {
      const v = cs.getPropertyValue(p);
      if (v && v !== "none" && v !== "normal") decl.push(`${p}:${v}`);
      else if (v === "none" && (p === "fill" || p === "stroke")) decl.push(`${p}:none`);
    }
    el.removeAttribute("class");
    el.setAttribute("style", decl.join(";"));
  });

  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  const vb = clone.getAttribute("viewBox")?.split(/[\s,]+/).map(Number);
  if (vb && vb.length === 4) {
    clone.setAttribute("width", String(Math.round(vb[2])));
    clone.setAttribute("height", String(Math.round(vb[3])));
  }
  clone.removeAttribute("style");
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
}

export function exporterSVG(svg: SVGSVGElement, nom: string) {
  telecharger(new Blob([svgAutonome(svg)], { type: "image/svg+xml;charset=utf-8" }), `${nom}.svg`);
}

/** PNG haute définition (x3) rasterisé depuis le SVG autonome. */
export async function exporterPNG(svg: SVGSVGElement, nom: string, echelle = 3) {
  const source = svgAutonome(svg);
  const vb = (svg.getAttribute("viewBox") ?? "0 0 1000 1000").split(/[\s,]+/).map(Number);
  const w = Math.round(vb[2] * echelle);
  const h = Math.round(vb[3] * echelle);
  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = new Image();
    img.decoding = "sync";
    await new Promise<void>((ok, ko) => {
      img.onload = () => ok();
      img.onerror = () => ko(new Error("rendu SVG impossible"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas indisponible");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
    if (blob) telecharger(blob, `${nom}.png`);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Export OBJ (géométrie + repère), ouvrable dans Adobe Dimension / Substance 3D / Aero. */
export async function exporterOBJ(scene: object, nom: string) {
  const { OBJExporter } = await import("three-stdlib");
  const texte = new OBJExporter().parse(scene as never);
  telecharger(new Blob([texte], { type: "model/obj" }), `${nom}.obj`);
}

/** Export GLB (glTF binaire) : matériaux et couleurs conservés, lisible par Adobe Dimension / Aero. */
export async function exporterGLB(scene: object, nom: string) {
  const { GLTFExporter } = await import("three-stdlib");
  const exporter = new GLTFExporter();
  const resultat = await new Promise<ArrayBuffer>((ok, ko) => {
    exporter.parse(
      scene as never,
      (res) => ok(res as ArrayBuffer),
      (err) => ko(err),
      { binary: true, onlyVisible: true, truncateDrawRange: true },
    );
  });
  telecharger(new Blob([resultat], { type: "model/gltf-binary" }), `${nom}.glb`);
}
