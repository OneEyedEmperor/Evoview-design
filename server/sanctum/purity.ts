/* Purity of the map's tongue: words of machines, programs and networks never
   enter a text of the map. Matched on word boundaries with their inflections,
   after folding what would hide them (look-alike letters, accents, hidden
   marks, split or hyphenated words). Shared by the server (authority) and
   the client mirror. */

const WORDS = [
  "login", "logon", "logout", "signin", "signup", "password", "passcode", "passkey", "username", "user",
  "account", "upload", "download", "save", "settings", "config", "configure", "configuration", "error", "bug",
  "debug", "loading", "loaded", "loader", "spinner", "data", "database", "dataset",
  "metadata", "node", "edge", "link", "hyperlink", "url", "http", "https", "www", "website", "webpage", "web",
  "online", "offline", "internet", "network", "server", "browser", "cookie", "session", "api", "json",
  "html", "css", "javascript", "typescript", "program", "programming", "programmer", "software", "hardware",
  "computer", "computing", "computational", "digital", "cyber", "algorithm", "variable", "script", "byte",
  "megabyte", "gigabyte", "pixel", "click", "toggle", "button", "checkbox", "dropdown", "popup", "modal",
  "widget", "dashboard", "swipe", "keyboard", "version", "versioning", "file", "folder", "directory", "sync",
  "backup", "agent", "admin", "administrator", "bot", "robot", "chatbot", "ai", "llm", "gpt", "system", "app",
  "input", "output", "delete", "paste", "email", "inbox", "notification", "wifi", "bluetooth", "smartphone",
  "laptop", "desktop", "query", "hashtag", "emoji", "avatar", "id", "ui", "ux", "graph", "vertex", "vertices",
  "pdf", "png", "jpg", "jpeg", "webp", "avif", "gif", "svg", "repository", "endpoint",
  /* the same, in the neighbouring tongues where it costs nothing */
  "passwort", "kennwort", "contrasena", "contrasenya", "motdepasse", "telecharger", "telechargement",
  "herunterladen", "hochladen", "usuario", "utilisateur", "benutzer", "fichier", "datei", "archivo",
  "cliquer", "klicken", "enregistrer", "speichern", "descargar", "connexion", "anmelden",
];

/** Compounds also caught when written apart ("pass word", "down load"); none whose
    parts read as plain speech apart ("drop down", "end point", "sign in"). */
const COMPOUNDS = new Set([
  "password", "passcode", "passkey", "username", "download", "upload", "database", "dataset", "metadata",
  "website", "webpage", "dashboard", "checkbox", "hashtag", "keyboard", "smartphone", "chatbot", "hyperlink",
  "javascript", "typescript", "login", "logout", "signup", "inbox", "email", "wifi", "motdepasse",
]);

const PHRASES = ["log in", "log out", "sign up", "click here", "web site", "e mail", "sealed word", "mot de passe"];

/** Classical senses kept by decision, never refused. */
const ALLOW = new Set<string>([]);

const FORBIDDEN = new Set(WORDS);

/* Common Cyrillic and Greek letters that pass for Latin ones. */
const CONFUSABLE: Record<string, string> = {
  а: "a", е: "e", о: "o", р: "p", с: "c", у: "y", х: "x", і: "i", ј: "j", ѕ: "s", ԁ: "d", ɡ: "g", һ: "h",
  ӏ: "l", ո: "n", ս: "u", ԝ: "w", α: "a", ε: "e", ο: "o", ρ: "p", τ: "t", υ: "u", ν: "v", κ: "k", ι: "i",
  η: "n", А: "a", В: "b", Е: "e", К: "k", М: "m", Н: "h", О: "o", Р: "p", С: "c", Т: "t", Х: "x", У: "y",
  Α: "a", Β: "b", Ε: "e", Ζ: "z", Η: "h", Ι: "i", Κ: "k", Μ: "m", Ν: "n", Ο: "o", Ρ: "p", Τ: "t", Υ: "y", Χ: "x",
};

/** Marks that render as nothing (zero-width, bidi, soft hyphen). */
export const hasHiddenMarks = (text: string) => /\p{Cf}/u.test(text);

/** The text as the eye reads it: compatibility forms and look-alike letters folded, accents and hidden marks stripped. */
export function fold(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/\p{Cf}/gu, "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/./gu, (ch) => CONFUSABLE[ch] ?? ch)
    .toLowerCase();
}

function stems(word: string): string[] {
  const w = word.replace(/['’]s?$/u, "");
  const out = new Set([word, w]);
  const add = (s: string, min = 2) => {
    if (s.length >= min) out.add(s);
  };
  if (w.endsWith("ies")) add(w.slice(0, -3) + "y");
  if (w.endsWith("es")) add(w.slice(0, -2));
  if (w.endsWith("s")) add(w.slice(0, -1));
  for (const suffix of ["ings", "ing", "ers", "er", "ed"]) {
    if (!w.endsWith(suffix)) continue;
    const base = w.slice(0, -suffix.length);
    if (base.length < 3) continue;
    add(base);
    add(`${base}e`);
    if (/(.)\1$/u.test(base)) add(base.slice(0, -1));
    if (base.endsWith("i")) add(`${base.slice(0, -1)}y`);
  }
  if (w.endsWith("d")) add(w.slice(0, -1), 4);
  return [...out];
}

const forbidden = (word: string) => !ALLOW.has(word) && stems(word).some((s) => FORBIDDEN.has(s));

/** Forbidden words found in a text (each once, folded). */
export function impureWords(text: string): string[] {
  const found = new Set<string>();
  const f = fold(text);
  const tokens = f.match(/[\p{L}\p{N}][\p{L}\p{N}'’]*/gu) ?? [];
  for (const t of tokens) if (forbidden(t)) found.add(t);
  for (const joined of f.match(/[\p{L}\p{N}]+(?:[-‐‑–][\p{L}\p{N}]+)+/gu) ?? []) {
    const w = joined.replace(/[-‐‑–]/gu, "");
    if (forbidden(w) || COMPOUNDS.has(w)) found.add(joined);
  }
  for (const run of f.match(/(?:^|[^\p{L}])((?:\p{L}[\s.·]+){2,}\p{L})(?![\p{L}])/gu) ?? []) {
    const w = run.replace(/[^\p{L}]/gu, "");
    if (forbidden(w) || COMPOUNDS.has(w)) found.add(run.trim());
  }
  /* Words written apart join only across plain spaces, never across punctuation. */
  for (const m of f.matchAll(/([\p{L}\p{N}]+)[^\S\n]+(?=([\p{L}\p{N}]+))/gu)) {
    const pair = m[1] + m[2];
    if (COMPOUNDS.has(pair) || COMPOUNDS.has(pair.replace(/s$/u, ""))) found.add(`${m[1]} ${m[2]}`);
  }
  for (const phrase of PHRASES) {
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])${phrase.split(" ").map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[^\\S\\n]+")}(?![\\p{L}\\p{N}])`, "u");
    if (re.test(f)) found.add(phrase);
  }
  return [...found];
}

/* The sealed name: no text may write it, expand it, guess at it, count it or
   allude to its form. The silence of the name may be spoken of; its shape
   may not. Titles of the core and of the turner come from the state. */
export interface NameContext {
  core?: string;
  turner?: string;
}

const FORM = "spell\\w*|letter\\w*|initial\\w*|syllable\\w*|sounds?|sounding|rhym\\w*|begin\\w*|starts?|starting|ends? with|ending in|reads? as|written as|pronounc\\w*|acronym\\w*|anagram\\w*|cipher\\w*|decod\\w*|decrypt\\w*|encrypt\\w*|hint\\w*|clue\\w*|form";
const COUNT = "characters?|vowels?|consonants?|runes?|glyphs?|letters?|backwards?|reversed|syllables?";
const NAMING = "called|named|known as|goes by|hight|styled|titled|dubbed";

const NAME_ALLUSIONS = [
  new RegExp(`\\bnames?\\b[^.!?]{0,40}\\b(${FORM}|${COUNT})\\b`, "iu"),
  new RegExp(`\\b(${FORM}|${COUNT})\\b[^.!?]{0,40}\\bnames?\\b`, "iu"),
  new RegExp(`\\bnames?\\b[^.!?]{0,30}\\b(${NAMING})\\b`, "iu"),
  new RegExp(`^[^\\p{L}]*(${NAMING})\\b`, "iu"),
  /\b(true|real|secret|hidden|full|encrypted|first|last|given|unspoken|sealed)\s+names?\s+(is|was|reads|means|of)\b/iu,
  /\b(one['’]s|his|her|its|their)\s+names?\b/iu,
  /\bnames?\s+(is|was|reads|means)\s*[:"“'‘]/iu,
  /\bnames?\s*[:=]/iu,
  /\bname\s+of\b[^.!?]{0,40}\b(is|was|reads|means)\b/iu,
  /\b[Nn]ames?\s+(is|was)\s+[A-Z]/u,
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** A title as written, its first letter in either case ("The Gate" / "the Gate"). */
const titleRe = (title: string) => `[${title[0].toUpperCase()}${title[0].toLowerCase()}]${escape(title.slice(1))}`;

/** True when a text speaks of the form of the sealed name. */
export function alludesToName(text: string, ctx: NameContext = {}): boolean {
  const t = text.normalize("NFKC").replace(/\p{Cf}/gu, "");
  if (NAME_ALLUSIONS.some((re) => re.test(t))) return true;
  /* A lone letter run into dots or blanks ("Z...d", "Z___") beside the name traces its shape. */
  if (/\bnames?\b/iu.test(t) && /(^|[^\p{L}])\p{L}(\.{2,}|…|_{2,}|\*{2,}|-{2,})/u.test(t)) return true;
  if (ctx.core) {
    const core = titleRe(ctx.core);
    const near = [
      new RegExp(`${core}\\b[^.!?]{0,30}\\b(${NAMING})\\b`, "u"),
      new RegExp(`${core}\\b[^.!?]{0,40}\\b(${COUNT})\\b`, "u"),
      new RegExp(`\\b(${COUNT})\\b[^.!?]{0,40}${core}\\b`, "u"),
    ];
    if (near.some((re) => re.test(t))) return true;
  }
  return false;
}

/** True when a text makes the turner and the core one figure. */
export function equatesFigures(text: string, ctx: NameContext = {}): boolean {
  if (!ctx.core || !ctx.turner) return false;
  const t = text.normalize("NFKC").replace(/\p{Cf}/gu, "");
  const a = titleRe(ctx.turner);
  const b = titleRe(ctx.core);
  const copula = "is|was|becomes|became|equals|is none other than|is one with|=";
  const one = "one|the same|a single|one and the same";
  return [
    new RegExp(`${a}\\s+(${copula})\\s+${b}\\b`, "u"),
    new RegExp(`${b}\\s+(${copula})\\s+${a}\\b`, "u"),
    new RegExp(`${a}\\s*,\\s*(who|which|that)\\s+(${copula})\\s+${b}\\b`, "u"),
    new RegExp(`${b}\\s*,\\s*(who|which|that)\\s+(${copula})\\s+${a}\\b`, "u"),
    new RegExp(`${a}\\s*(,|and)\\s*${b}\\s+(are|were)\\s+(${one})\\b`, "u"),
    new RegExp(`${b}\\s*(,|and)\\s*${a}\\s+(are|were)\\s+(${one})\\b`, "u"),
  ].some((re) => re.test(t));
}
