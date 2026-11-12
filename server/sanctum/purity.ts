/* Purity of the map's tongue: words of machines, programs and networks never
   enter a text of the map. Matched on word boundaries, with plurals. Shared
   by the server (authority) and the client mirror. */

const WORDS = [
  "login", "logon", "logout", "signin", "signup", "password", "passcode", "passkey", "username", "user",
  "account", "upload", "download", "save", "settings", "config", "configuration", "error", "bug", "debug",
  "crash", "exception", "loading", "loader", "spinner", "data", "database", "dataset", "metadata", "node",
  "edge", "link", "hyperlink", "url", "http", "https", "www", "website", "webpage", "web", "online",
  "offline", "internet", "network", "server", "browser", "cookie", "session", "token", "api", "json",
  "html", "css", "javascript", "typescript", "program", "programming", "programmer", "software", "hardware",
  "computer", "computing", "computational", "digital", "cyber", "algorithm", "variable", "script", "byte",
  "megabyte", "gigabyte", "pixel", "click", "clicking", "toggle", "button", "checkbox", "dropdown", "popup",
  "modal", "widget", "dashboard", "scroll", "swipe", "hover", "keyboard", "version", "versioning", "file",
  "folder", "directory", "install", "sync", "cache", "backup", "agent", "admin", "administrator", "bot",
  "robot", "chatbot", "ai", "llm", "gpt", "system", "app", "input", "output", "submit", "delete", "paste",
  "email", "inbox", "notification", "wifi", "bluetooth", "smartphone", "laptop", "desktop", "query",
  "hashtag", "emoji", "avatar", "id", "ui", "ux", "graph", "vertex", "vertices", "pdf", "png", "jpg",
  "jpeg", "webp", "avif", "gif", "svg", "repository", "commit", "deploy", "endpoint",
];

const PHRASES = ["log in", "log out", "sign in", "sign up", "click here", "web site", "e mail", "e-mail", "sealed word"];

const FORBIDDEN = new Set(WORDS);

function stems(word: string): string[] {
  const out = [word];
  if (word.endsWith("ies") && word.length > 4) out.push(word.slice(0, -3) + "y");
  if (word.endsWith("es") && word.length > 3) out.push(word.slice(0, -2));
  if (word.endsWith("s") && word.length > 2) out.push(word.slice(0, -1));
  if (word.endsWith("'s") || word.endsWith("’s")) out.push(word.slice(0, -2));
  return out;
}

/** Forbidden words found in a text (each once, as written). */
export function impureWords(text: string): string[] {
  const found = new Set<string>();
  const lower = text.toLowerCase();
  for (const raw of lower.match(/[\p{L}\p{N}][\p{L}\p{N}'’]*/gu) ?? []) {
    if (stems(raw).some((s) => FORBIDDEN.has(s))) found.add(raw);
  }
  const spaced = ` ${lower.replace(/[^\p{L}\p{N}'’-]+/gu, " ")} `;
  for (const phrase of PHRASES) if (spaced.includes(` ${phrase} `)) found.add(phrase);
  return [...found];
}

/* The sealed name: no text may write it, expand it, guess at it or allude
   to its form. The silence of the name may be spoken of; its shape may not. */
const FORM = "spell\\w*|letter\\w*|initial\\w*|syllable\\w*|sounds?|sounding|rhym\\w*|begin\\w*|starts?|starting|ends? with|ending in|reads? as|written as|pronounc\\w*|acronym\\w*|anagram\\w*|cipher\\w*|decod\\w*|decrypt\\w*|encrypt\\w*|hint\\w*|clue\\w*|form";
const NAME_ALLUSIONS = [
  new RegExp(`\\bnames?\\b[^.!?]{0,40}\\b(${FORM})\\b`, "iu"),
  new RegExp(`\\b(${FORM})\\b[^.!?]{0,40}\\bnames?\\b`, "iu"),
  /\b(true|real|secret|hidden|full|encrypted|first|last|given|unspoken|sealed)\s+names?\s+(is|was|reads|means|of)\b/iu,
  /\b(one['’]s|his|her|its|their)\s+names?\b/iu,
  /\bnames?\s+(is|was|reads|means)\s*[:"“'‘]/iu,
  /\b[Nn]ames?\s+(is|was)\s+[A-Z]/u,
];

/** True when a text speaks of the form of the sealed name. */
export function alludesToName(text: string): boolean {
  return NAME_ALLUSIONS.some((re) => re.test(text));
}
