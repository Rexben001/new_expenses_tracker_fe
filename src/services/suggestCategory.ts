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
  if (/salad|sandwich|coffee|tea|menu|burger|pizza|market/.test(t)) return "Food";
  return null;
}
