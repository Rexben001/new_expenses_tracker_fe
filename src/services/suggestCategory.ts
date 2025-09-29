import { CATEGORY_OPTIONS } from "./item";

export function suggestCategory(
  merchant?: string,
  text?: string
): string | null {
  const m = (merchant || "").toLowerCase();
  const t = (text || "").toLowerCase();

  const map: Array<[string | RegExp, string]> = [
    [/^albert ?heijn|^ah(\s|$)|ah to go/, "Food"],
    [/^jumbo|^lidl|^aldi|^dirk|^coop|^plus|^restaurant|^market/, "Food"],
    [/^kruidvat|^etos/, "Health"],
    [/^hema|^holland & barrett/, "Health"],
    [/^ikea/, "Others"],
    [/^bol\.?com|^coolblue|^action|^mediamarkt/, "Utilities"],
    [/^ns(\s|$)|^g[vt]b|^ret|^arriva/, "Transport"],
    [/^shell|^total(?:energies)?|^bp|^tinQ|^esso/, "Fuel"],
    [/^gall ?& ?gall|^dirk wijn|^slijterij|alcohol/, "Food"],
    [/^thuisbezorgd|^ubereats|^deliveroo/, "Food"],
    [/^mcdonald|^burger king|^kfc|^subway|^starbucks/, "Food"],
    [/^h&m|^zara|^primark/, "Shopping"],
  ];

  for (const [k, cat] of map) {
    if (typeof k === "string") {
      if (m.includes(k) || t.includes(k)) return cat;
    } else if (k.test(m) || k.test(t)) return cat;
  }
  if (/train|tram|bus/.test(t)) return "Transport";
  if (/diesel|benzine|e95|e10/.test(t)) return "Fuel";
  if (/salad|sandwich|coffee|tea|menu|burger|pizza|market/.test(t))
    return "Food";
  return null;
}
// ---- Config & helpers (module scope; compiled once) -------------------------

type Cat = string;

const FALLBACK_ORDER: Cat[] = [
  "Food",
  "Transport",
  "Shopping",
  "Utilities",
  "Health",
  "Entertainment",
  "Holiday",
  "Toiletries",
  "Insurance",
  "Miscellaneous",
  "Others",
];

// Strong signals (brands/phrases/obvious tokens)
const KEYWORDS: Record<Cat, string[]> = {
  Food: [
    "grocery",
    "supermarket",
    "aldi",
    "lidl",
    "ah",
    "tesco",
    "coop",
    "jumbo",
    "food",
    "snack",
    "restaurant",
    "cafe",
    "coffee",
    "takeaway",
    "starbucks",
    "kfc",
    "mcdonald",
    "meal",
    "lunch",
    "dinner",
  ],
  Transport: [
    "bus",
    "train",
    "tram",
    "metro",
    "uber",
    "bolt",
    "taxi",
    "fuel",
    "gas",
    "diesel",
    "petrol",
    "parking",
    "toll",
    "ns",
    "ov",
    "transport",
  ],
  Shopping: [
    "shopping",
    "purchase",
    "store",
    "retail",
    "zara",
    "h&m",
    "primark",
    "ikea",
    "electronics",
    "clothing",
    "fashion",
    "apple",
    "media markt",
    "coolblue",
    "samsung",
    "shoes",
    "aliexpress",
    "amazon",
    "bol.com",
    "decathlon",
  ],
  Health: [
    "pharmacy",
    "doctor",
    "dentist",
    "hospital",
    "clinic",
    "medication",
    "medicine",
    "optician",
    "checkup",
    "gp",
  ],
  Insurance: ["insurance", "premium", "aon", "aegon", "allianz", "policy"],
  Entertainment: [
    "movie",
    "cinema",
    "concert",
    "netflix",
    "spotify",
    "theatre",
    "game",
    "steam",
    "playstation",
    "xbox",
    "youtube",
    "apple tv",
  ],
  Utilities: [
    "utility",
    "gas bill",
    "water bill",
    "electricity",
    "energy",
    "heating",
    "wifi",
    "internet",
    "broadband",
    "provider",
    "eneco",
    "voda",
  ],
  Toiletries: [
    "toiletries",
    "toilet paper",
    "shampoo",
    "soap",
    "toothpaste",
    "hygiene",
    "body wash",
    "deodorant",
  ],
  Holiday: [
    "flight",
    "hotel",
    "trip",
    "holiday",
    "travel",
    "airbnb",
    "expedia",
    "booking.com",
    "tripadvisor",
  ],
  Miscellaneous: ["misc", "uncategorized", "general", "random"],
  Others: ["other"],
};

// Optional: redirect ambiguous tokens (disambiguation/normalization)
const ALIASES: Record<string, Cat> = {
  ikea: "Shopping",
  coolblue: "Shopping",
  "media markt": "Shopping",
  "bol.com": "Shopping",
  ns: "Transport",
  ov: "Transport",
  eneco: "Utilities",
  voda: "Utilities", // vodafone shorthand
  ah: "Food", // Albert Heijn
};

// Weighting knobs
const WEIGHTS = {
  keyword: 3,
  categoryMention: 2, // if the category name itself appears in the title
  recentBoost: 0.75, // each recent category occurrence
  exactMerchantBoost: 1.5, // if an alias/brand appears exactly
};

const normalizeText = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD") // strip accents
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\u2019’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const escapeRE = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Build regex index once
type CompiledIndex = {
  keywordREs: Map<Cat, RegExp[]>;
  aliasREs: Map<string, { cat: Cat; re: RegExp }>;
  catNameREs: Map<Cat, RegExp>;
};

let _compiled: CompiledIndex | null = null;

function compileIndex(categories: Cat[]): CompiledIndex {
  const keywordREs = new Map<Cat, RegExp[]>();
  const aliasREs = new Map<string, { cat: Cat; re: RegExp }>();
  const catNameREs = new Map<Cat, RegExp>();

  const makeWordRE = (phrase: string) =>
    new RegExp(
      `(?<![\\p{L}\\p{N}])${escapeRE(normalizeText(phrase))}(?![\\p{L}\\p{N}])`,
      "iu"
    );

  // Keywords
  for (const [cat, list] of Object.entries(KEYWORDS)) {
    keywordREs.set(cat, list.map(makeWordRE));
  }

  // Aliases/brands
  for (const [alias, cat] of Object.entries(ALIASES)) {
    aliasREs.set(alias, { cat, re: makeWordRE(alias) });
  }

  // Category name literal matches
  for (const cat of categories) {
    catNameREs.set(cat, makeWordRE(cat));
  }

  return { keywordREs, aliasREs, catNameREs };
}

// Ensure stable order based on FALLBACK_ORDER
function stableByFallback(a: Cat, b: Cat): number {
  const ia = FALLBACK_ORDER.indexOf(a);
  const ib = FALLBACK_ORDER.indexOf(b);
  if (ia === -1 && ib === -1) return a.localeCompare(b);
  if (ia === -1) return 1;
  if (ib === -1) return -1;
  return ia - ib;
}

// ---- Main API ---------------------------------------------------------------

/**
 * Suggest up to 3 likely categories for a transaction title.
 * - Uses precompiled regexes for speed
 * - Scores by keyword, alias (brand), literal category mention, and recency
 */
export function suggestCategories(
  rawTitle: string,
  recentCategories: string[] = [],
  opts?: {
    categoryOptions?: string[]; // defaults to CATEGORY_OPTIONS if present
    topN?: number; // defaults to 3
    normalize?: (s: string) => string;
  }
): string[] {
  if (!rawTitle?.trim()) return [];

  const norm =
    opts?.normalize ??
    (typeof normalize === "function" ? normalize : normalizeText);

  // Prefer provided categories, else global CATEGORY_OPTIONS, else FALLBACK_ORDER as a safe default
  const categoryOptions: string[] =
    opts?.categoryOptions ??
    (typeof CATEGORY_OPTIONS !== "undefined"
      ? CATEGORY_OPTIONS
      : FALLBACK_ORDER);

  // Activate only categories the app currently supports
  const active = new Set(categoryOptions);

  if (!_compiled) _compiled = compileIndex(categoryOptions);
  const { keywordREs, aliasREs, catNameREs } = _compiled;

  const title = norm(rawTitle);
  const scores: Record<Cat, number> = {};

  const add = (cat: Cat, pts: number) => {
    if (!active.has(cat) || !isFinite(pts)) return;
    scores[cat] = (scores[cat] ?? 0) + pts;
  };

  // 1) Keywords
  for (const [cat, res] of keywordREs.entries()) {
    for (const re of res) {
      if (re.test(title)) {
        add(cat, WEIGHTS.keyword);
        break; // one keyword hit is enough; prevents over-weighting long titles
      }
    }
  }

  for (const { cat, re } of aliasREs.values()) {
    if (re.test(title)) add(cat, WEIGHTS.exactMerchantBoost);
  }

  // 3) Literal category mention (e.g., “Transport fee”)
  for (const [cat, re] of catNameREs.entries()) {
    if (re.test(title)) add(cat, WEIGHTS.categoryMention);
  }

  // 4) Recency nudges (dedup to avoid double-boosting the same recent cat)
  const recentSet = new Set(recentCategories.filter((c) => active.has(c)));
  for (const rc of recentSet) add(rc, WEIGHTS.recentBoost);

  const hasMatches = Object.keys(scores).length > 0;

  // Fallback: bias towards globally useful categories but keep to active list
  const fallback = FALLBACK_ORDER.filter((c) => active.has(c));

  // Rank: score desc, then stable fallback order for determinism
  const ranked = (
    hasMatches
      ? Object.entries(scores)
          .sort((a, b) => {
            const d = b[1] - a[1];
            if (d !== 0) return d;
            return stableByFallback(a[0], b[0]);
          })
          .map(([cat]) => cat)
      : fallback
  ).slice(0, opts?.topN ?? 3);

  return ranked;
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s&.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
