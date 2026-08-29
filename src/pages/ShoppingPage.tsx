import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCheck, FiEdit2, FiPlus, FiRefreshCw, FiSearch, FiShoppingCart, FiTrash2, FiX } from "react-icons/fi";
import { FooterNav } from "../components/FooterNav";
import { NumberStepper } from "../components/NumberStepper";
import { HeaderComponent } from "../components/HeaderComponent";
import SwipeShell from "../components/SwipeShell";
import { useItemContext } from "../hooks/useItemContext";
import { createShoppingItem, deleteShoppingItem, getErrorMessage, getShoppingHistory, getShoppingItems, purchaseShoppingItem, readdShoppingItem, updateShoppingItem } from "../services/api";
import type { ShoppingItem, ShoppingItemInput } from "../types/shopping";

const categories = ["Household", "Personal care", "Clothing", "Electronics", "Office", "Other"];
const emptyForm: ShoppingItemInput = { name: "", quantity: 1, unit: "pieces", category: "Household", notes: "" };
const inputClass = "w-full rounded-xl border border-gray-200 bg-white p-3 outline-none focus:ring-2 focus:ring-fuchsia-500 dark:border-gray-700 dark:bg-gray-900";

export function ShoppingPage() {
  const { fetchFoodItems, getSubAccountId } = useItemContext();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [history, setHistory] = useState<ShoppingItem[]>([]);
  const [view, setView] = useState<"list" | "history">("list");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [form, setForm] = useState<ShoppingItemInput>(emptyForm);
  const [purchaseItem, setPurchaseItem] = useState<ShoppingItem>();
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const subId = await getSubAccountId(); const [active, bought] = await Promise.all([getShoppingItems(subId), getShoppingHistory(subId)]); setItems(active); setHistory(bought); }
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
  const openPurchase = (item: ShoppingItem) => { setPurchaseItem(item); setPurchaseQuantity(item.quantity || 1); setError(""); };
  const confirmPurchase = async (event: React.FormEvent) => {
    event.preventDefault(); if (!purchaseItem) return; setPending("purchase"); setError("");
    try { const subId = await getSubAccountId(); const result = await purchaseShoppingItem(purchaseItem.id, purchaseQuantity, subId); setItems((current) => result.remaining ? current.map((item) => item.id === purchaseItem.id ? result.remaining! : item) : current.filter((item) => item.id !== purchaseItem.id)); setHistory((current) => [result.item, ...current]); if (purchaseItem.source === "foodTracker") await fetchFoodItems(subId); setPurchaseItem(undefined); }
    catch (value) { setError(getErrorMessage(value, "Could not record purchase.")); }
    finally { setPending(""); }
  };
  const buyAgain = async (item: ShoppingItem) => {
    setPending(item.id); setError("");
    try { const subId = await getSubAccountId(); const result = await readdShoppingItem(item.id, subId); setItems((current) => [...current.filter((value) => value.id !== result.item.id), result.item]); if (item.source === "foodTracker") await fetchFoodItems(subId); }
    catch (value) { setError(getErrorMessage(value, "Could not re-add shopping item.")); }
    finally { setPending(""); }
  };

  return <SwipeShell refresh={load}>
    <HeaderComponent title="Shopping List"><div className="flex items-center justify-between pb-2"><div><h1 className="text-xl font-bold">Shopping list</h1><p className="text-sm text-gray-500">Food and everything else</p></div><button onClick={openNew} className="flex items-center gap-2 rounded-xl bg-fuchsia-600 px-3 py-2 font-semibold text-white"><FiPlus /> Item</button></div></HeaderComponent>
    <main className="mx-auto min-h-screen max-w-md space-y-3 px-4 pb-32 pt-[calc(var(--app-header-height,6rem)+1rem)] dark:text-white">
      {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">{error}</div>}
      <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1 dark:bg-gray-900"><button onClick={() => setView("list")} className={`rounded-lg py-2 text-sm font-semibold ${view === "list" ? "bg-white shadow-sm dark:bg-gray-800" : "text-gray-500"}`}>To buy ({items.length})</button><button onClick={() => setView("history")} className={`rounded-lg py-2 text-sm font-semibold ${view === "history" ? "bg-white shadow-sm dark:bg-gray-800" : "text-gray-500"}`}>Bought ({history.length})</button></div>
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 dark:border-gray-800 dark:bg-gray-900"><FiSearch className="text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search shopping list" className="w-full bg-transparent py-3 outline-none" />{query && <button onClick={() => setQuery("")} aria-label="Clear"><FiX /></button>}</div>
      {view === "list" && <><div className="flex items-center justify-between rounded-xl bg-fuchsia-50 px-3 py-2 text-sm text-fuchsia-800 dark:bg-fuchsia-950/30 dark:text-fuchsia-200"><span><strong>{items.length}</strong> items to buy</span><span className="flex items-center gap-1 text-xs"><FiShoppingCart /> Food Tracker sync on</span></div>{loading ? <div className="py-12 text-center text-gray-500">Loading…</div> : !shown.length ? <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center"><FiShoppingCart className="mx-auto mb-2 h-8 w-8 text-fuchsia-500" /><p className="font-semibold">Shopping list empty</p></div> : groups.map(([category, group]) => <section key={category}><h2 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">{category}</h2><div className="space-y-1.5">{group.map((item) => <article key={item.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"><button disabled={pending === item.id} onClick={() => openPurchase(item)} aria-label={`Mark ${item.name} purchased`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-fuchsia-300 text-transparent hover:bg-fuchsia-600 hover:text-white"><FiCheck /></button><button onClick={() => openEdit(item)} className="min-w-0 flex-1 text-left"><span className="block truncate font-semibold">{item.name}</span><span className="text-xs text-gray-500">Need {item.quantity} {item.unit}{item.source === "foodTracker" ? " · Food Tracker" : ""}</span></button>{item.source === "custom" && <button onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`} className="p-2 text-fuchsia-600"><FiEdit2 /></button>}<button onClick={() => void remove(item)} aria-label={`Remove ${item.name}`} className="p-2 text-red-500"><FiTrash2 /></button></article>)}</div></section>)}</>}
      {view === "history" && (loading ? <div className="py-12 text-center text-gray-500">Loading…</div> : !history.length ? <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">No purchases recorded yet</div> : <div className="space-y-2">{history.map((item) => <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{item.name}</p><p className="text-xs text-gray-500">Bought {item.purchasedQuantity} {item.unit}{item.source === "foodTracker" ? " · Added to Food Tracker" : ""}</p><time className="text-xs text-gray-400">{item.purchasedAt ? new Date(item.purchasedAt).toLocaleDateString() : ""}</time></div><button disabled={pending === item.id} onClick={() => void buyAgain(item)} className="flex shrink-0 items-center gap-1 rounded-lg bg-fuchsia-50 px-3 py-2 text-xs font-semibold text-fuchsia-700 disabled:opacity-50 dark:bg-fuchsia-950/40 dark:text-fuchsia-200"><FiRefreshCw /> Buy again</button></div></article>)}</div>)}
    </main><FooterNav />
    {formOpen && <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 sm:items-center"><form onSubmit={save} className="w-full max-w-md space-y-3 rounded-t-3xl bg-white p-5 dark:bg-gray-950 sm:rounded-3xl"><div className="flex justify-between"><h2 className="text-xl font-bold">{editingId ? "Edit item" : "Add shopping item"}</h2><button type="button" onClick={() => setFormOpen(false)} aria-label="Close"><FiX /></button></div><label className="block text-sm font-medium">Name<input required className={`${inputClass} mt-1`} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Quantity<NumberStepper value={form.quantity} min={0.01} step={1} ariaLabel="Quantity" onChange={(quantity) => setForm({ ...form, quantity })} className="mt-1" /></label><label className="text-sm font-medium">Unit<input required className={`${inputClass} mt-1`} value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} /></label></div><label className="block text-sm font-medium">Category<select className={`${inputClass} mt-1`} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="block text-sm font-medium">Notes<textarea className={`${inputClass} mt-1`} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label><button disabled={pending === "save"} className="w-full rounded-xl bg-fuchsia-600 p-3 font-semibold text-white">{pending === "save" ? "Saving…" : "Save item"}</button></form></div>}
    {purchaseItem && <div className="fixed inset-0 z-[210] flex items-end justify-center bg-black/50 sm:items-center"><form onSubmit={confirmPurchase} className="w-full max-w-md space-y-4 rounded-t-3xl bg-white p-5 dark:bg-gray-950 sm:rounded-3xl"><div className="flex justify-between"><div><h2 className="text-xl font-bold">Quantity bought</h2><p className="text-sm text-gray-500">{purchaseItem.name}</p></div><button type="button" onClick={() => setPurchaseItem(undefined)} aria-label="Close"><FiX /></button></div><label className="block text-sm font-medium">Bought quantity<NumberStepper value={purchaseQuantity} min={0.01} step={1} ariaLabel="Bought quantity" onChange={setPurchaseQuantity} className="mt-1" /></label><p className="text-sm text-gray-500">Unit: {purchaseItem.unit}</p>{purchaseItem.source === "foodTracker" && <p className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">This quantity will be added to Food Tracker inventory.</p>}<button disabled={pending === "purchase"} className="w-full rounded-xl bg-fuchsia-600 p-3 font-semibold text-white">{pending === "purchase" ? "Saving…" : "Confirm purchase"}</button></form></div>}
  </SwipeShell>;
}
