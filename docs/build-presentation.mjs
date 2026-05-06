// Generate the Pulse final-presentation deck.
// Run: node docs/build-presentation.mjs
// Output: docs/pulse-presentation.pptx
import pptxgen from "./node_modules/pptxgenjs/dist/pptxgen.es.js";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 × 7.5
pres.author = "Vincent Granouillit";
pres.title = "Pulse — Présentation finale";

// ─── Palette (Pulse: charcoal/gray/white) ──────────────────────────────
const C = {
  ink: "1A1A1A",
  inkSoft: "404040",
  muted: "5A5A5A",
  mutedLight: "8A8A8A",
  border: "D8D8D5",
  borderLight: "E8E8E5",
  bgSoft: "F7F7F5",
  bgPaper: "FFFFFF",
  accent: "1A1A1A", // monochrome — accent = pure black/charcoal
};

const FONT_HEAD = "Helvetica Neue";
const FONT_BODY = "Helvetica Neue";

const W = 13.3;
const H = 7.5;
const MARGIN = 0.7;

// Reusable element helpers ──────────────────────────────────────────────
function pageNumber(slide, n, total) {
  slide.addText(`${String(n).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, {
    x: W - MARGIN - 1.0,
    y: H - 0.5,
    w: 1.0,
    h: 0.3,
    fontSize: 9,
    fontFace: FONT_BODY,
    color: C.mutedLight,
    align: "right",
    margin: 0,
  });
}

function tinyHeader(slide, label) {
  slide.addText(label, {
    x: MARGIN,
    y: 0.45,
    w: 8,
    h: 0.3,
    fontSize: 9,
    fontFace: FONT_BODY,
    color: C.mutedLight,
    bold: false,
    charSpacing: 4,
    margin: 0,
  });
}

function titleH1(slide, title) {
  slide.addText(title, {
    x: MARGIN,
    y: 1.1,
    w: W - 2 * MARGIN,
    h: 1.0,
    fontSize: 36,
    fontFace: FONT_HEAD,
    color: C.ink,
    bold: true,
    margin: 0,
  });
  // thin underline accent
  slide.addShape(pres.shapes.LINE, {
    x: MARGIN,
    y: 2.05,
    w: 0.6,
    h: 0,
    line: { color: C.ink, width: 1.5 },
  });
}

const TOTAL = 15;

// ─── Slide 1 — Title ────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bgPaper };

  // tiny brand mark
  s.addText("PULSE", {
    x: MARGIN,
    y: MARGIN,
    w: 4,
    h: 0.4,
    fontSize: 11,
    fontFace: FONT_BODY,
    color: C.mutedLight,
    bold: true,
    charSpacing: 8,
    margin: 0,
  });

  s.addText("Centraliser et prioriser le feedback produit", {
    x: MARGIN,
    y: 2.6,
    w: W - 2 * MARGIN,
    h: 1.4,
    fontSize: 48,
    fontFace: FONT_HEAD,
    color: C.ink,
    bold: true,
    margin: 0,
  });

  s.addText("Présentation finale · La Capsule · Mai 2026", {
    x: MARGIN,
    y: 4.2,
    w: W - 2 * MARGIN,
    h: 0.5,
    fontSize: 16,
    fontFace: FONT_BODY,
    color: C.muted,
    margin: 0,
  });

  // bottom-left signature
  s.addText("Vincent Granouillit", {
    x: MARGIN,
    y: H - 1.1,
    w: 6,
    h: 0.4,
    fontSize: 13,
    fontFace: FONT_BODY,
    color: C.ink,
    bold: true,
    margin: 0,
  });
  s.addText("Programme Web Development", {
    x: MARGIN,
    y: H - 0.7,
    w: 6,
    h: 0.3,
    fontSize: 11,
    fontFace: FONT_BODY,
    color: C.mutedLight,
    margin: 0,
  });
}

// ─── Slide 2 — Le problème ──────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bgPaper };
  tinyHeader(s, "LE POINT DE DÉPART");
  titleH1(s, "Comment votre PM décide-t-il quoi build cette semaine ?");

  const items = [
    "Sondage Slack rapide ?",
    "La mémoire (sélective) du PM ?",
    "Une roadmap qui bouge tous les jours ?",
    "Le client qui crie le plus fort ?",
  ];
  const startY = 3.3;
  items.forEach((txt, i) => {
    const y = startY + i * 0.7;
    s.addShape(pres.shapes.OVAL, {
      x: MARGIN + 0.05,
      y: y + 0.18,
      w: 0.18,
      h: 0.18,
      fill: { color: C.ink },
      line: { color: C.ink, width: 0 },
    });
    s.addText(txt, {
      x: MARGIN + 0.5,
      y,
      w: W - 2 * MARGIN - 0.5,
      h: 0.5,
      fontSize: 22,
      fontFace: FONT_BODY,
      color: C.inkSoft,
      margin: 0,
    });
  });

  s.addText("Pulse remplace les heuristiques par des votes utilisateurs.", {
    x: MARGIN,
    y: H - 1.4,
    w: W - 2 * MARGIN,
    h: 0.5,
    fontSize: 18,
    fontFace: FONT_BODY,
    color: C.ink,
    italic: true,
    margin: 0,
  });

  pageNumber(s, 2, TOTAL);
}

// ─── Slide 3 — Section break: Partie 1 ──────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.ink };

  s.addText("PARTIE 1", {
    x: MARGIN,
    y: 2.4,
    w: 6,
    h: 0.4,
    fontSize: 11,
    fontFace: FONT_BODY,
    color: C.mutedLight,
    bold: true,
    charSpacing: 8,
    margin: 0,
  });

  s.addText("La stack expliquée", {
    x: MARGIN,
    y: 3.0,
    w: W - 2 * MARGIN,
    h: 1.4,
    fontSize: 56,
    fontFace: FONT_HEAD,
    color: "FFFFFF",
    bold: true,
    margin: 0,
  });

  s.addText("Comment c'est construit, expliqué pour des non-tech.", {
    x: MARGIN,
    y: 4.5,
    w: W - 2 * MARGIN,
    h: 0.5,
    fontSize: 18,
    fontFace: FONT_BODY,
    color: "C8C8C8",
    margin: 0,
  });

  s.addText("9 minutes · 5 blocs", {
    x: MARGIN,
    y: H - 1.1,
    w: 6,
    h: 0.3,
    fontSize: 11,
    fontFace: FONT_BODY,
    color: C.mutedLight,
    bold: true,
    charSpacing: 4,
    margin: 0,
  });
}

// ─── Slide 4 — Architecture diagram ─────────────────────────────────────
// Layout: Vercel is the hub (centered, dark). Inputs feed in from
// above (Browser) and from the left (GitHub → GitHub Actions). Vercel
// fans out below to the 4 satellite services.
{
  const s = pres.addSlide();
  s.background = { color: C.bgPaper };
  tinyHeader(s, "VUE D'ENSEMBLE");
  titleH1(s, "Comment tout s'emboîte");

  // Helper: 2-line labelled box (used for every node except Vercel)
  function nodeBox(x, y, w, h, top, sub, opts = {}) {
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y,
      w,
      h,
      fill: { color: opts.fill ?? C.bgSoft },
      line: { color: opts.borderColor ?? C.border, width: 1 },
    });
    s.addText(top, {
      x,
      y: y + 0.1,
      w,
      h: h * 0.45,
      fontSize: 13,
      fontFace: FONT_BODY,
      color: C.ink,
      bold: true,
      align: "center",
      valign: "bottom",
      margin: 0,
    });
    s.addText(sub, {
      x,
      y: y + h * 0.5,
      w,
      h: h * 0.45,
      fontSize: 10,
      fontFace: FONT_BODY,
      color: C.muted,
      align: "center",
      valign: "top",
      margin: 0,
    });
  }

  // ── Top: Browser ──
  const browserW = 3.4;
  const browserX = (W - browserW) / 2;
  const browserY = 2.6;
  const browserH = 0.85;
  nodeBox(browserX, browserY, browserW, browserH, "Navigateur", "Bob · Alice · Yasmine");

  // Arrow Browser ↓ Vercel
  s.addShape(pres.shapes.LINE, {
    x: W / 2,
    y: browserY + browserH,
    w: 0,
    h: 0.45,
    line: { color: C.muted, width: 1 },
  });

  // ── Middle row: GitHub → Actions → Vercel (Vercel = hub, dark) ──
  const midY = 3.95;
  const vercelW = 3.4;
  const vercelH = 1.1;
  const vercelX = (W - vercelW) / 2;
  const flowH = 0.85;
  // Vertical center of the row, used to align horizontal arrows
  const flowCenterY = midY + flowH / 2 + 0.075; // slight nudge to align with Vercel center
  // GitHub box: x=0.7
  const ghX = 0.7;
  const ghW = 1.65;
  // Actions box: between GitHub and Vercel
  const actX = 2.7;
  const actW = 1.85;

  // GitHub
  nodeBox(ghX, midY + 0.075, ghW, flowH, "GitHub", "Code + historique");

  // Arrow GitHub → Actions
  s.addShape(pres.shapes.LINE, {
    x: ghX + ghW,
    y: flowCenterY,
    w: actX - (ghX + ghW),
    h: 0,
    line: { color: C.muted, width: 1 },
  });

  // GitHub Actions
  nodeBox(actX, midY + 0.075, actW, flowH, "GitHub Actions", "Vérifications auto");

  // Arrow Actions → Vercel
  s.addShape(pres.shapes.LINE, {
    x: actX + actW,
    y: flowCenterY,
    w: vercelX - (actX + actW),
    h: 0,
    line: { color: C.muted, width: 1 },
  });

  // Vercel (the hub) — dark, taller
  s.addShape(pres.shapes.RECTANGLE, {
    x: vercelX,
    y: midY,
    w: vercelW,
    h: vercelH,
    fill: { color: C.ink },
    line: { color: C.ink, width: 0 },
  });
  s.addText("Vercel", {
    x: vercelX,
    y: midY + 0.18,
    w: vercelW,
    h: 0.4,
    fontSize: 17,
    fontFace: FONT_BODY,
    color: "FFFFFF",
    bold: true,
    align: "center",
    valign: "bottom",
    margin: 0,
  });
  s.addText("Site en ligne · Next.js + TypeScript", {
    x: vercelX,
    y: midY + 0.6,
    w: vercelW,
    h: 0.4,
    fontSize: 11,
    fontFace: FONT_BODY,
    color: "C8C8C8",
    align: "center",
    valign: "top",
    margin: 0,
  });

  // Arrow Vercel ↓ services
  const arrowDownY = midY + vercelH;
  s.addShape(pres.shapes.LINE, {
    x: W / 2,
    y: arrowDownY,
    w: 0,
    h: 0.45,
    line: { color: C.muted, width: 1 },
  });

  // ── Bottom: 4 satellite services ──
  const servicesY = arrowDownY + 0.55;
  const services = [
    { t: "Airtable", s: "Données" },
    { t: "Resend", s: "Emails" },
    { t: "Redis", s: "Anti-spam" },
    { t: "Sentry", s: "Erreurs" },
  ];
  const boxW = 2.4;
  const gap = 0.18;
  const totalW = services.length * boxW + (services.length - 1) * gap;
  const startX = (W - totalW) / 2;
  services.forEach((srv, i) => {
    const x = startX + i * (boxW + gap);
    nodeBox(x, servicesY, boxW, 0.85, srv.t, srv.s);
  });

  pageNumber(s, 4, TOTAL);
}

// ─── Helper: tool slide layout ──────────────────────────────────────────
function toolSlide(num, title, intro, bullets, footer) {
  const s = pres.addSlide();
  s.background = { color: C.bgPaper };
  tinyHeader(s, `BLOC ${num} / 5`);
  titleH1(s, title);

  // Intro
  s.addText(intro, {
    x: MARGIN,
    y: 2.5,
    w: W - 2 * MARGIN,
    h: 0.7,
    fontSize: 17,
    fontFace: FONT_BODY,
    color: C.muted,
    italic: true,
    margin: 0,
  });

  // Bullets — 3-up grid feel
  bullets.forEach((b, i) => {
    const y = 3.7 + i * 0.85;
    s.addShape(pres.shapes.RECTANGLE, {
      x: MARGIN,
      y,
      w: 0.04,
      h: 0.55,
      fill: { color: C.ink },
      line: { color: C.ink, width: 0 },
    });
    s.addText(
      [
        { text: b.label + " — ", options: { bold: true, color: C.ink } },
        { text: b.body, options: { color: C.inkSoft } },
      ],
      {
        x: MARGIN + 0.25,
        y,
        w: W - 2 * MARGIN - 0.25,
        h: 0.6,
        fontSize: 14,
        fontFace: FONT_BODY,
        valign: "middle",
        margin: 0,
      },
    );
  });

  // Footer
  s.addText(footer, {
    x: MARGIN,
    y: H - 1.0,
    w: W - 2 * MARGIN,
    h: 0.4,
    fontSize: 12,
    fontFace: FONT_BODY,
    color: C.mutedLight,
    italic: true,
    margin: 0,
  });

  return s;
}

// ─── Slide 5 — Code de l'app ────────────────────────────────────────────
pageNumber(
  toolSlide(
    1,
    "Le code de l'app",
    "Next.js + TypeScript + Tailwind — la matière première de l'app.",
    [
      { label: "Next.js", body: "le squelette qui gère URLs, pages, communication base de données" },
      { label: "TypeScript", body: "un correcteur orthographique pour les bugs avant qu'ils partent en prod" },
      { label: "Tailwind", body: "le style écrit directement dans le code, plus rapide et plus cohérent" },
    ],
    "Sans ces 3 outils : framework maison, code sans filet, ~2 jours perdus sur des bugs visuels.",
  ),
  5,
  TOTAL,
);

// ─── Slide 6 — GitHub ───────────────────────────────────────────────────
pageNumber(
  toolSlide(
    2,
    "GitHub",
    "Une Google Docs pour le code, avec une mémoire infinie.",
    [
      { label: "Sauvegarde", body: "chaque modification est datée, signée, retrouvable en 2 clics" },
      { label: "Historique", body: "l'évolution du projet jour après jour, 60+ commits scopés" },
      { label: "GitHub Actions", body: "un robot qui vérifie chaque commit (compile + lint + build)" },
    ],
    "Vert ou rouge en 1 minute. Filet de sécurité avant toute mise en ligne.",
  ),
  6,
  TOTAL,
);

// ─── Slide 7 — Vercel ───────────────────────────────────────────────────
pageNumber(
  toolSlide(
    3,
    "Vercel",
    "L'endroit où l'app est en ligne — sans configurer de serveur.",
    [
      { label: "Hébergement", body: "pas de serveur à louer, pas de HTTPS à gérer, pas de mise en prod manuelle" },
      { label: "Connecté à GitHub", body: "git push → 30 secondes → site mis à jour en ligne automatiquement" },
      { label: "Preview URLs", body: "chaque branche a sa propre URL pour tester avant de merger" },
    ],
    "Sans ça : un week-end de plomberie pour déployer un simple site.",
  ),
  7,
  TOTAL,
);

// ─── Slide 8 — Airtable ─────────────────────────────────────────────────
pageNumber(
  toolSlide(
    4,
    "Airtable",
    "La base de données — un Excel collaboratif en ligne, branché à mon app.",
    [
      { label: "5 tables", body: "Users · Feedbacks · Votes · Notifications · Comments" },
      { label: "Debug rapide", body: "j'ouvre Airtable directement pour voir, corriger ou supprimer une donnée" },
      { label: "Free tier", body: "suffisant pour 10-20 users, limites assumées et documentées" },
    ],
    "Plan de migration vers Postgres documenté dans le README pour la V3.",
  ),
  8,
  TOTAL,
);

// ─── Slide 9 — Services satellites ──────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bgPaper };
  tinyHeader(s, "BLOC 5 / 5");
  titleH1(s, "Services satellites");

  s.addText(
    "Trois services qui font chacun une chose mieux que je ne saurais le faire.",
    {
      x: MARGIN,
      y: 2.5,
      w: W - 2 * MARGIN,
      h: 0.5,
      fontSize: 17,
      fontFace: FONT_BODY,
      color: C.muted,
      italic: true,
      margin: 0,
    },
  );

  const cols = [
    {
      name: "Resend",
      role: "Envoi d'emails",
      detail:
        "Vérification compte + reset password. Gère délivrabilité, spam folder, serveurs SMTP à ma place.",
    },
    {
      name: "Upstash Redis",
      role: "Anti-spam",
      detail:
        "Bloque après 5 tentatives de login en moins d'une minute. Invisible pour les vrais users, brutal pour les attaquants.",
    },
    {
      name: "Sentry",
      role: "Détecteur d'erreurs",
      detail:
        "Si une page plante chez un vrai utilisateur, je reçois un email avec la cause exacte et la ligne de code.",
    },
  ];
  const colW = 3.7;
  const colGap = 0.3;
  const totalW = cols.length * colW + (cols.length - 1) * colGap;
  const startX = (W - totalW) / 2;
  cols.forEach((c, i) => {
    const x = startX + i * (colW + colGap);
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y: 3.55,
      w: colW,
      h: 2.7,
      fill: { color: C.bgSoft },
      line: { color: C.border, width: 1 },
    });
    // accent stripe
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y: 3.55,
      w: colW,
      h: 0.06,
      fill: { color: C.ink },
      line: { color: C.ink, width: 0 },
    });
    s.addText(c.name, {
      x: x + 0.25,
      y: 3.75,
      w: colW - 0.5,
      h: 0.45,
      fontSize: 18,
      fontFace: FONT_HEAD,
      color: C.ink,
      bold: true,
      margin: 0,
    });
    s.addText(c.role, {
      x: x + 0.25,
      y: 4.2,
      w: colW - 0.5,
      h: 0.4,
      fontSize: 11,
      fontFace: FONT_BODY,
      color: C.mutedLight,
      bold: true,
      charSpacing: 3,
      margin: 0,
    });
    s.addText(c.detail, {
      x: x + 0.25,
      y: 4.7,
      w: colW - 0.5,
      h: 1.5,
      fontSize: 12,
      fontFace: FONT_BODY,
      color: C.inkSoft,
      margin: 0,
    });
  });

  s.addText(
    "Tous gracieusement dégradés — sans clés d'API, l'app continue de tourner.",
    {
      x: MARGIN,
      y: H - 1.0,
      w: W - 2 * MARGIN,
      h: 0.4,
      fontSize: 12,
      fontFace: FONT_BODY,
      color: C.mutedLight,
      italic: true,
      margin: 0,
    },
  );

  pageNumber(s, 9, TOTAL);
}

// ─── Slide 10 — Sécurité ────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bgPaper };
  tinyHeader(s, "SÉCURITÉ");
  titleH1(s, "Ce qui protège l'app");

  s.addText(
    "Avec des comptes utilisateurs et des données privées en jeu, plusieurs couches sont indispensables.",
    {
      x: MARGIN,
      y: 2.5,
      w: W - 2 * MARGIN,
      h: 0.7,
      fontSize: 17,
      fontFace: FONT_BODY,
      color: C.muted,
      italic: true,
      margin: 0,
    },
  );

  // 4 bullets, slightly tighter spacing than tool slides (0.7 vs 0.85)
  const bullets = [
    {
      label: "Mots de passe protégés",
      body: "chiffrés avec bcrypt, jamais stockés en clair, illisibles même pour moi.",
    },
    {
      label: "Sessions sécurisées",
      body: "cookie signé par le serveur, transmis en HTTPS, inaccessible au code de la page.",
    },
    {
      label: "Anti-bombardement",
      body: "login bloqué après 5 essais en 1 minute. Vote, signup et reset password aussi limités.",
    },
    {
      label: "Vérification + reset par email",
      body: "pas d'inscription avec une adresse fictive. Liens à expiration courte, à usage unique.",
    },
  ];
  bullets.forEach((b, i) => {
    const y = 3.55 + i * 0.7;
    s.addShape(pres.shapes.RECTANGLE, {
      x: MARGIN,
      y,
      w: 0.04,
      h: 0.55,
      fill: { color: C.ink },
      line: { color: C.ink, width: 0 },
    });
    s.addText(
      [
        { text: b.label + " — ", options: { bold: true, color: C.ink } },
        { text: b.body, options: { color: C.inkSoft } },
      ],
      {
        x: MARGIN + 0.25,
        y,
        w: W - 2 * MARGIN - 0.25,
        h: 0.6,
        fontSize: 14,
        fontFace: FONT_BODY,
        valign: "middle",
        margin: 0,
      },
    );
  });

  s.addText(
    "Audit complet du code documenté dans le README — items identifiés, traités, justifiés.",
    {
      x: MARGIN,
      y: H - 1.0,
      w: W - 2 * MARGIN,
      h: 0.4,
      fontSize: 12,
      fontFace: FONT_BODY,
      color: C.mutedLight,
      italic: true,
      margin: 0,
    },
  );

  pageNumber(s, 10, TOTAL);
}

// ─── Slide 11 — Récap stack ─────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bgPaper };
  tinyHeader(s, "RÉCAPITULATIF");
  titleH1(s, "Pour résumer en une phrase");

  s.addText(
    [
      { text: "GitHub ", options: { bold: true, color: C.ink } },
      { text: "stocke le code,\n", options: { color: C.inkSoft } },
      { text: "Vercel ", options: { bold: true, color: C.ink } },
      { text: "le met en ligne,\n", options: { color: C.inkSoft } },
      { text: "Next.js ", options: { bold: true, color: C.ink } },
      { text: "fait tourner les pages,\n", options: { color: C.inkSoft } },
      { text: "Airtable ", options: { bold: true, color: C.ink } },
      { text: "stocke les données,\n", options: { color: C.inkSoft } },
      { text: "Resend / Redis / Sentry ", options: { bold: true, color: C.ink } },
      { text: "s'occupent des cas tordus.", options: { color: C.inkSoft } },
    ],
    {
      x: MARGIN,
      y: 2.8,
      w: W - 2 * MARGIN,
      h: 3.5,
      fontSize: 26,
      fontFace: FONT_HEAD,
      paraSpaceAfter: 6,
      margin: 0,
    },
  );

  s.addText("Tout ça gratuit, moderne, interconnecté avec quelques clics.", {
    x: MARGIN,
    y: H - 1.0,
    w: W - 2 * MARGIN,
    h: 0.4,
    fontSize: 12,
    fontFace: FONT_BODY,
    color: C.mutedLight,
    italic: true,
    margin: 0,
  });

  pageNumber(s, 11, TOTAL);
}

// ─── Slide 12 — Section break: Partie 2 ─────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.ink };

  s.addText("PARTIE 2", {
    x: MARGIN,
    y: 2.4,
    w: 6,
    h: 0.4,
    fontSize: 11,
    fontFace: FONT_BODY,
    color: C.mutedLight,
    bold: true,
    charSpacing: 8,
    margin: 0,
  });

  s.addText("Démo live", {
    x: MARGIN,
    y: 3.0,
    w: W - 2 * MARGIN,
    h: 1.4,
    fontSize: 56,
    fontFace: FONT_HEAD,
    color: "FFFFFF",
    bold: true,
    margin: 0,
  });

  s.addText("10 minutes · 3 personas · 1 boucle complète.", {
    x: MARGIN,
    y: 4.5,
    w: W - 2 * MARGIN,
    h: 0.5,
    fontSize: 18,
    fontFace: FONT_BODY,
    color: "C8C8C8",
    margin: 0,
  });

  s.addText("Bob · Alice · Yasmine", {
    x: MARGIN,
    y: H - 1.1,
    w: 6,
    h: 0.3,
    fontSize: 11,
    fontFace: FONT_BODY,
    color: C.mutedLight,
    bold: true,
    charSpacing: 4,
    margin: 0,
  });
}

// ─── Slide 12 — Setup démo ──────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bgPaper };
  tinyHeader(s, "DÉMO · CASTING");
  titleH1(s, "3 personas, 3 onglets");

  const personas = [
    {
      name: "Bob",
      role: "Utilisateur",
      acts: ["Soumet une idée : “mode sombre”", "Vote sur un autre feedback", "Reçoit la notification de livraison"],
    },
    {
      name: "Alice",
      role: "Admin produit",
      acts: ["Voit le tableau de bord (KPIs, charts)", "Identifie le top des votes", "Envoie l'idée au backlog dev"],
    },
    {
      name: "Yasmine",
      role: "Développeuse",
      acts: ["Prend le ticket dans le kanban", "Le déplace : à faire → en cours → review → livré", "🎉 Confetti quand c'est livré"],
    },
  ];

  const colW = 3.7;
  const colGap = 0.3;
  const totalW = personas.length * colW + (personas.length - 1) * colGap;
  const startX = (W - totalW) / 2;
  const cardY = 3.0;

  personas.forEach((p, i) => {
    const x = startX + i * (colW + colGap);
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y: cardY,
      w: colW,
      h: 3.2,
      fill: { color: C.bgPaper },
      line: { color: C.border, width: 1 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y: cardY,
      w: colW,
      h: 0.06,
      fill: { color: C.ink },
      line: { color: C.ink, width: 0 },
    });
    s.addText(p.name, {
      x: x + 0.25,
      y: cardY + 0.22,
      w: colW - 0.5,
      h: 0.5,
      fontSize: 22,
      fontFace: FONT_HEAD,
      color: C.ink,
      bold: true,
      margin: 0,
    });
    s.addText(p.role, {
      x: x + 0.25,
      y: cardY + 0.7,
      w: colW - 0.5,
      h: 0.35,
      fontSize: 11,
      fontFace: FONT_BODY,
      color: C.mutedLight,
      bold: true,
      charSpacing: 3,
      margin: 0,
    });
    p.acts.forEach((a, j) => {
      const ay = cardY + 1.2 + j * 0.55;
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.25,
        y: ay + 0.12,
        w: 0.12,
        h: 0.12,
        fill: { color: C.ink },
        line: { color: C.ink, width: 0 },
      });
      s.addText(a, {
        x: x + 0.5,
        y: ay,
        w: colW - 0.75,
        h: 0.5,
        fontSize: 12,
        fontFace: FONT_BODY,
        color: C.inkSoft,
        margin: 0,
      });
    });
  });

  s.addText(
    "Boucle complète : feedback → vote → priorisation → dev → notification.",
    {
      x: MARGIN,
      y: H - 1.0,
      w: W - 2 * MARGIN,
      h: 0.4,
      fontSize: 13,
      fontFace: FONT_BODY,
      color: C.ink,
      italic: true,
      bold: true,
      margin: 0,
    },
  );

  pageNumber(s, 13, TOTAL);
}

// ─── Slide 14 — Closing : ce que j'ai appris ────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bgPaper };
  tinyHeader(s, "RETOUR D'EXPÉRIENCE");
  titleH1(s, "Coder en direct vs Bubble — ce que j'ai appris");

  // Two columns
  const colW = 5.6;
  const colGap = 0.3;
  const totalW = colW * 2 + colGap;
  const startX = (W - totalW) / 2;
  const cardY = 2.7;
  const cardH = 3.3;

  const cols = [
    {
      title: "Avec le code direct",
      points: [
        "Vrai git workflow : commits, PRs, CI",
        "Sécurité serveur : cookies, JWT, rate limit",
        "Déploiement et monitoring prod",
        "Décisions d'architecture documentées",
      ],
    },
    {
      title: "Mais Bubble m'aurait épargné",
      points: [
        "L'authentification à la main",
        "La configuration du CI/CD",
        "Le debug à l'aveugle quand ça plante",
        "Le maintien d'un schéma de base à jour",
      ],
    },
  ];

  cols.forEach((c, i) => {
    const x = startX + i * (colW + colGap);
    s.addShape(pres.shapes.RECTANGLE, {
      x,
      y: cardY,
      w: colW,
      h: cardH,
      fill: { color: i === 0 ? C.ink : C.bgSoft },
      line: { color: i === 0 ? C.ink : C.border, width: 1 },
    });
    s.addText(c.title, {
      x: x + 0.35,
      y: cardY + 0.3,
      w: colW - 0.7,
      h: 0.5,
      fontSize: 18,
      fontFace: FONT_HEAD,
      color: i === 0 ? "FFFFFF" : C.ink,
      bold: true,
      margin: 0,
    });
    c.points.forEach((p, j) => {
      const py = cardY + 0.95 + j * 0.5;
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.35,
        y: py + 0.13,
        w: 0.12,
        h: 0.12,
        fill: { color: i === 0 ? "FFFFFF" : C.ink },
        line: { color: i === 0 ? "FFFFFF" : C.ink, width: 0 },
      });
      s.addText(p, {
        x: x + 0.6,
        y: py,
        w: colW - 0.95,
        h: 0.5,
        fontSize: 13,
        fontFace: FONT_BODY,
        color: i === 0 ? "F0F0F0" : C.inkSoft,
        margin: 0,
      });
    });
  });

  s.addText("Le bon outil dépend du contexte.", {
    x: MARGIN,
    y: H - 1.0,
    w: W - 2 * MARGIN,
    h: 0.4,
    fontSize: 14,
    fontFace: FONT_BODY,
    color: C.ink,
    bold: true,
    italic: true,
    align: "center",
    margin: 0,
  });

  pageNumber(s, 14, TOTAL);
}

// ─── Slide 15 — Q&A ─────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.bgPaper };

  s.addText("Questions ?", {
    x: 0,
    y: 2.6,
    w: W,
    h: 1.6,
    fontSize: 80,
    fontFace: FONT_HEAD,
    color: C.ink,
    bold: true,
    align: "center",
    margin: 0,
  });

  s.addShape(pres.shapes.LINE, {
    x: W / 2 - 0.4,
    y: 4.4,
    w: 0.8,
    h: 0,
    line: { color: C.ink, width: 1.5 },
  });

  s.addText("github.com/VincentG32/pulse", {
    x: 0,
    y: 4.8,
    w: W,
    h: 0.4,
    fontSize: 14,
    fontFace: FONT_BODY,
    color: C.muted,
    align: "center",
    margin: 0,
  });

  s.addText("Vincent Granouillit · La Capsule · Mai 2026", {
    x: 0,
    y: H - 1.1,
    w: W,
    h: 0.3,
    fontSize: 11,
    fontFace: FONT_BODY,
    color: C.mutedLight,
    align: "center",
    charSpacing: 3,
    margin: 0,
  });
}

// ─── Write file ──────────────────────────────────────────────────────────
const outPath = new URL("./pulse-presentation.pptx", import.meta.url).pathname;
await pres.writeFile({ fileName: outPath });
console.log("✓ Wrote", outPath);
