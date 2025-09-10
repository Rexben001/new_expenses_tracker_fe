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

export function suggestCategories(
  rawTitle: string,
  recentCategories: string[] = []
): string[] {
  if (!rawTitle?.trim()) return [];

  const title = normalize(rawTitle);

  const KEYWORDS: Record<string, string[]> = {
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

  const active = new Set(CATEGORY_OPTIONS);
  const scores: Record<string, number> = {};
  const add = (cat: string, pts: number) => {
    if (!active.has(cat)) return;
    scores[cat] = (scores[cat] ?? 0) + pts;
  };

  for (const [cat, keywords] of Object.entries(KEYWORDS)) {
    for (const kw of keywords) {
      const re = new RegExp(`\\b${escapeRegExp(normalize(kw))}\\b`, "i");
      if (re.test(title)) add(cat, 3);
    }
  }

  for (const cat of CATEGORY_OPTIONS) {
    const re = new RegExp(`\\b${escapeRegExp(normalize(cat))}\\b`, "i");
    if (re.test(title)) add(cat, 2);
  }

  for (const recent of recentCategories) add(recent, 0.5);

  const hasMatches = Object.keys(scores).length > 0;

  const fallback = [
    "Food",
    "Transport",
    "Shopping",
    "Others",
    "Miscellaneous",
  ].filter((c) => active.has(c));

  const ranked = (
    hasMatches
      ? Object.entries(scores)
          .sort((a, b) => b[1] - a[1])
          .map(([cat]) => cat)
      : fallback
  ).slice(0, 3);

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

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
