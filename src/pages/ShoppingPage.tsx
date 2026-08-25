import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCheck, FiEdit2, FiPlus, FiSearch, FiShoppingCart, FiX } from "react-icons/fi";
import { FooterNav } from "../components/FooterNav";
import { HeaderComponent } from "../components/HeaderComponent";
import SwipeShell from "../components/SwipeShell";
import { useItemContext } from "../hooks/useItemContext";
import { createShoppingItem, deleteShoppingItem, getErrorMessage, getShoppingItems, updateShoppingItem } from "../services/api";
import type { ShoppingItem, ShoppingItemInput } from "../types/shopping";

const categories = ["Household", "Personal care", "Clothing", "Electronics", "Office", "Other"];
const emptyForm: ShoppingItemInput = { name: "", quantity: 1, unit: "pieces", category: "Household", notes: "" };
const inputClass = "w-full rounded-xl border border-gray-200 bg-white p-3 outline-none focus:ring-2 focus:ring-fuchsia-500 dark:border-gray-700 dark:bg-gray-900";

export function ShoppingPage() {
  const { fetchFoodItems, getSubAccountId } = useItemContext();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [form, setForm] = useState<ShoppingItemInput>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setItems(await getShoppingItems(await getSubAccountId())); }
    catch (value) { setError(getErrorMessage(value, "Could not load shopping list.")); }
    finally { setLoading(false); }
  }, [getSubAccountId]);
  useEffect(() => { void load(); }, [load]);

  const shown = useMemo(() => {
    const value = query.trim().toLowerCase();
    return items.filter((item) => !value || [item.name, item.category, item.notes].some((field) => field?.toLowerCase().includes(value)));
  }, [items, query]);
  const groups = useMemo(() => Array.from(new Set(shown.map((item) => item.category))).sort().map((category) => [category, shown.filter((item) => item.category === category)] as const), [shown]);

  const openNew = () => { setEditingId(undefined); setForm({ ...emptyForm }); setError(""); setFormOpen(true); };
  const openEdit = (item: ShoppingItem) => { if (item.source === "foodTracker") return; setEditingId(item.id); setForm({ name: item.name, quantity: item.quantity, unit: item.unit, category: item.category, notes: item.notes ?? "" }); setError(""); setFormOpen(true); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setPending("save"); setError("");
    try {
      const subId = await getSubAccountId();
      const payload = { ...form, name: form.name.trim(), unit: form.unit.trim(), notes: form.notes?.trim() };
      const result = editingId ? await updateShoppingItem(editingId, payload, subId) : await createShoppingItem(payload, subId);
      setItems((current) => editingId ? current.map((item) => item.id === editingId ? result.item : item) : [...current, result.item]); setFormOpen(false);
    } catch (value) { setError(getErrorMessage(value, "Could not save shopping item.")); }
    finally { setPending(""); }
  };
  const remove = async (item: ShoppingItem) => {
    setPending(item.id); setError("");
    try { const subId = await getSubAccountId(); await deleteShoppingItem(item.id, subId); setItems((current) => current.filter((value) => value.id !== item.id)); if (item.source === "foodTracker") await fetchFoodItems(subId); }
    catch (value) { setError(getErrorMessage(value, "Could not remove shopping item.")); }
    finally { setPending(""); }
  };

  return <SwipeShell refresh={load}>
    <HeaderComponent title="Shopping List"><div className="flex items-center justify-between pb-2"><div><h1 className="text-xl font-bold">Shopping list</h1><p className="text-sm text-gray-500">Food and everything else</p></div><button onClick={openNew} className="flex items-center gap-2 rounded-xl bg-fuchsia-600 px-3 py-2 font-semibold text-white"><FiPlus /> Item</button></div></HeaderComponent>
    <main className="mx-auto min-h-screen max-w-md space-y-3 px-4 pb-32 pt-[calc(var(--app-header-height,6rem)+1rem)] dark:text-white">
      {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">{error}</div>}
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 dark:border-gray-800 dark:bg-gray-900"><FiSearch className="text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search shopping list" className="w-full bg-transparent py-3 outline-none" />{query && <button onClick={() => setQuery("")} aria-label="Clear"><FiX /></button>}</div>
      <div className="flex items-center justify-between rounded-xl bg-fuchsia-50 px-3 py-2 text-sm text-fuchsia-800 dark:bg-fuchsia-950/30 dark:text-fuchsia-200"><span><strong>{items.length}</strong> items to buy</span><span className="flex items-center gap-1 text-xs"><FiShoppingCart /> Food Tracker sync on</span></div>
      {loading ? <div className="py-12 text-center text-gray-500">Loading…</div> : !shown.length ? <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center"><FiShoppingCart className="mx-auto mb-2 h-8 w-8 text-fuchsia-500" /><p className="font-semibold">Shopping list empty</p></div> : groups.map(([category, group]) => <section key={category}><h2 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">{category}</h2><div className="space-y-1.5">{group.map((item) => <article key={item.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"><button disabled={pending === item.id} onClick={() => void remove(item)} aria-label={`Mark ${item.name} purchased`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-fuchsia-300 text-transparent hover:bg-fuchsia-600 hover:text-white"><FiCheck /></button><button onClick={() => openEdit(item)} className="min-w-0 flex-1 text-left"><span className="block truncate font-semibold">{item.name}</span><span className="text-xs text-gray-500">{item.quantity} {item.unit}{item.source === "foodTracker" ? " · Food Tracker" : ""}</span></button>{item.source === "custom" && <button onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`} className="p-2 text-fuchsia-600"><FiEdit2 /></button>}</article>)}</div></section>)}
    </main><FooterNav />
    {formOpen && <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 sm:items-center"><form onSubmit={save} className="w-full max-w-md space-y-3 rounded-t-3xl bg-white p-5 dark:bg-gray-950 sm:rounded-3xl"><div className="flex justify-between"><h2 className="text-xl font-bold">{editingId ? "Edit item" : "Add shopping item"}</h2><button type="button" onClick={() => setFormOpen(false)} aria-label="Close"><FiX /></button></div><label className="block text-sm font-medium">Name<input required className={`${inputClass} mt-1`} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Quantity<input required type="number" min="0.01" step="any" className={`${inputClass} mt-1`} value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} /></label><label className="text-sm font-medium">Unit<input required className={`${inputClass} mt-1`} value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} /></label></div><label className="block text-sm font-medium">Category<select className={`${inputClass} mt-1`} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="block text-sm font-medium">Notes<textarea className={`${inputClass} mt-1`} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label><button disabled={pending === "save"} className="w-full rounded-xl bg-fuchsia-600 p-3 font-semibold text-white">{pending === "save" ? "Saving…" : "Save item"}</button></form></div>}
  </SwipeShell>;
}
