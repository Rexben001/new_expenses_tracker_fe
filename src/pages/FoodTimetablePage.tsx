import { useCallback, useEffect, useMemo, useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiChevronLeft, FiChevronRight, FiEdit2, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";
import { FooterNav } from "../components/FooterNav";
import { NumberStepper } from "../components/NumberStepper";
import { HeaderComponent } from "../components/HeaderComponent";
import SwipeShell from "../components/SwipeShell";
import { useItemContext } from "../hooks/useItemContext";
import { clearMealSchedule, createMeal, deleteMeal, getErrorMessage, getMealPlan, setMealSchedule, updateMeal } from "../services/api";
import type { Meal, MealIngredient, MealPlan, MealType, Weekday } from "../types/food";
import { findExactNamedItem } from "../services/smartDefaults";

const days: Array<{ value: Weekday; label: string }> = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" }, { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" }, { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" }, { value: "sunday", label: "Sunday" },
];
const mealTypes: MealType[] = ["lunch", "dinner"];
const inputClass = "w-full rounded-xl border border-gray-200 bg-white p-3 outline-none focus:ring-2 focus:ring-orange-500 dark:border-gray-700 dark:bg-gray-900";
const blankIngredient = (): MealIngredient => ({ name: "", quantity: 1, unit: "pieces" });
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const addDays = (date: Date, count: number) => { const next = new Date(date); next.setDate(next.getDate() + count); return next; };
const mondayOf = (date: Date) => { const next = new Date(date.getFullYear(), date.getMonth(), date.getDate()); const day = next.getDay(); next.setDate(next.getDate() - (day === 0 ? 6 : day - 1)); return next; };
const weekLabel = (monday: Date) => `${monday.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${addDays(monday, 6).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

export function FoodTimetablePage() {
  const { foodItems, fetchFoodItems, getSubAccountId } = useItemContext();
  const [plan, setPlan] = useState<MealPlan>({ meals: [], schedule: [] });
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [mealName, setMealName] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<MealIngredient[]>([blankIngredient()]);
  const [editingMealId, setEditingMealId] = useState<string>();
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setPlan(await getMealPlan(await getSubAccountId())); }
    catch (value) { setError(getErrorMessage(value, "Could not load timetable.")); }
    finally { setLoading(false); }
  }, [getSubAccountId]);
  useEffect(() => { void load(); }, [load]);

  const schedule = useMemo(() => new Map(plan.schedule.map((entry) => [`${entry.date}-${entry.mealType}`, entry])), [plan.schedule]);

  const assignMeal = async (date: string, mealType: MealType, mealId: string) => {
    const key = `${date}-${mealType}`; setPending(key); setError(""); setNotice("");
    try {
      const subId = await getSubAccountId();
      if (!mealId) { await clearMealSchedule(date, mealType, subId); setPlan((value) => ({ ...value, schedule: value.schedule.filter((entry) => entry.id !== key) })); return; }
      const result = await setMealSchedule(date, mealType, { mealId }, subId);
      setPlan((value) => ({ ...value, schedule: [...value.schedule.filter((entry) => entry.id !== result.item.id), result.item] }));
      if (result.warnings.length) setNotice(result.warnings.map((warning) => warning.message).join(" · "));
    } catch (value) { setError(getErrorMessage(value, "Could not update meal slot.")); }
    finally { setPending(""); }
  };

  const markCooked = async (entry: MealPlan["schedule"][number]) => {
    setPending(entry.id); setError("");
    try {
      const result = await setMealSchedule(entry.date, entry.mealType, { cooked: !entry.cooked }, await getSubAccountId());
      setPlan((value) => ({ ...value, schedule: value.schedule.map((item) => item.id === entry.id ? result.item : item) }));
    } catch (value) { setError(getErrorMessage(value, "Could not update cooked status.")); }
    finally { setPending(""); }
  };

  const updateIngredient = (index: number, patch: Partial<MealIngredient>) => setIngredients((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const updateIngredientName = (index: number, name: string) => {
    const food = findExactNamedItem(name, foodItems, (item) => item.name);
    updateIngredient(index, food
      ? { foodItemId: food.id, name: food.name, unit: food.unit }
      : { foodItemId: undefined, name });
  };
  const linkInventory = (index: number, foodItemId: string) => {
    const food = foodItems.find((item) => item.id === foodItemId);
    updateIngredient(index, food ? { foodItemId: food.id, name: food.name, unit: food.unit } : { foodItemId: undefined });
  };
  const saveMeal = async (event: React.FormEvent) => {
    event.preventDefault(); setPending("meal"); setError("");
    try {
      const payload = { name: mealName.trim(), description: description.trim() || undefined, ingredients: ingredients.map((item) => ({ ...item, name: item.name.trim(), unit: item.unit.trim(), quantity: Number(item.quantity) })) };
      const subId = await getSubAccountId();
      const result = editingMealId
        ? await updateMeal(editingMealId, payload, subId)
        : await createMeal(payload, subId);
      setPlan((value) => ({
        ...value,
        meals: editingMealId
          ? value.meals.map((meal) => meal.id === editingMealId ? result.item : meal)
          : [...value.meals, result.item],
      }));
      await fetchFoodItems(subId);
      setMealName(""); setDescription(""); setIngredients([blankIngredient()]); setEditingMealId(undefined); setFormOpen(false);
    } catch (value) { setError(getErrorMessage(value, "Could not save meal.")); }
    finally { setPending(""); }
  };
  const openNewMeal = () => {
    setEditingMealId(undefined); setMealName(""); setDescription(""); setIngredients([blankIngredient()]); setError(""); setFormOpen(true);
  };
  const openEditMeal = (meal: Meal) => {
    setEditingMealId(meal.id); setMealName(meal.name); setDescription(meal.description ?? "");
    setIngredients(meal.ingredients.map((ingredient) => ({ ...ingredient }))); setError(""); setFormOpen(true);
  };
  const removeMeal = async (meal: Meal) => {
    setPending(meal.id); setError("");
    try { await deleteMeal(meal.id, await getSubAccountId()); setPlan((value) => ({ meals: value.meals.filter((item) => item.id !== meal.id), schedule: value.schedule.filter((entry) => entry.mealId !== meal.id) })); }
    catch (value) { setError(getErrorMessage(value, "Could not delete meal.")); }
    finally { setPending(""); }
  };

  return (
    <SwipeShell toRight="/food" refresh={load}>
      <HeaderComponent title="Food Timetable">
        <div className="flex items-center justify-between gap-3 pb-2">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/food" aria-label="Back to food tracker" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"><FiChevronLeft /></Link>
            <div><h1 className="text-xl font-bold">Food timetable</h1><p className="text-sm text-gray-500">Monday to Sunday</p></div>
          </div>
          <button type="button" onClick={openNewMeal} className="flex shrink-0 items-center gap-2 rounded-xl bg-orange-600 px-3 py-2 font-medium text-white"><FiPlus /> Meal</button>
        </div>
      </HeaderComponent>

      <main className="mx-auto min-h-screen max-w-md space-y-3 px-4 pb-32 pt-[calc(var(--app-header-height,6rem)+1rem)] dark:text-white">
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{error}</div>}
        {notice && <div role="status" className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"><FiAlertTriangle className="mt-0.5 shrink-0" />{notice}</div>}
        <section className="rounded-xl border border-orange-100 bg-orange-50/60 px-3 py-2 text-xs text-orange-900 dark:border-orange-950 dark:bg-orange-950/20 dark:text-orange-100">
          Meal selection checks ingredient stock automatically.
        </section>
        <section className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-900">
          <button type="button" aria-label="Previous week" onClick={() => setWeekStart((date) => addDays(date, -7))} className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100 dark:bg-gray-800"><FiChevronLeft /></button>
          <button type="button" onClick={() => setWeekStart(mondayOf(new Date()))} className="text-center"><span className="block font-bold">{weekLabel(weekStart)}</span><span className="text-xs text-orange-700">Tap for current week</span></button>
          <button type="button" aria-label="Next week" onClick={() => setWeekStart((date) => addDays(date, 7))} className="grid h-10 w-10 place-items-center rounded-xl bg-gray-100 dark:bg-gray-800"><FiChevronRight /></button>
        </section>
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Days of week">
          {days.map((day, index) => {
            const date = addDays(weekStart, index);
            const hasMeal = mealTypes.some((type) => schedule.has(`${dateKey(date)}-${type}`));
            return <button key={day.value} type="button" onClick={() => setSelectedDay(index)} className={`min-w-14 rounded-lg border px-2 py-1.5 text-center ${selectedDay === index ? "border-orange-500 bg-orange-600 text-white" : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"}`}><span className="block text-[10px] font-semibold">{day.label.slice(0, 3)}</span><span className="block font-bold">{date.getDate()}</span>{hasMeal && <span className={`mx-auto block h-1 w-1 rounded-full ${selectedDay === index ? "bg-white" : "bg-orange-500"}`} />}</button>;
          })}
        </div>
        {loading ? <div className="p-8 text-center text-gray-500">Loading timetable…</div> : (() => {
          const day = days[selectedDay];
          const date = addDays(weekStart, selectedDay);
          const dateValue = dateKey(date);
          return <section className="space-y-2">
            <div><h2 className="text-lg font-bold">{day.label}</h2><p className="text-sm text-gray-500">{date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p></div>
            {mealTypes.map((mealType) => {
              const entry = schedule.get(`${dateValue}-${mealType}`);
              return <article key={mealType} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-2 flex items-center justify-between"><h3 className="font-bold capitalize">{mealType}</h3>{entry?.cooked && <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"><FiCheckCircle /> Cooked</span>}</div>
                <select aria-label={`${day.label} ${mealType}`} className={inputClass} value={entry?.mealId ?? ""} disabled={pending === `${dateValue}-${mealType}`} onChange={(event) => void assignMeal(dateValue, mealType, event.target.value)}>
                  <option value="">Choose a meal…</option>{plan.meals.map((meal) => <option key={meal.id} value={meal.id}>{meal.name}</option>)}
                </select>
                {!!entry?.warnings.length && <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"><p className="mb-1 flex items-center gap-1 font-bold"><FiAlertTriangle /> Ingredient check</p><ul className="space-y-1">{entry.warnings.map((warning) => <li key={`${warning.ingredient}-${warning.severity}`}>• {warning.message}</li>)}</ul></div>}
                {entry && <button type="button" disabled={pending === entry.id} onClick={() => void markCooked(entry)} className={`mt-3 w-full rounded-xl px-3 py-2 text-sm font-semibold ${entry.cooked ? "border border-gray-200 text-gray-600 dark:border-gray-700" : "bg-emerald-600 text-white"}`}>{entry.cooked ? "Mark as not cooked" : "Mark as cooked"}</button>}
              </article>;
            })}
          </section>;
        })()}

        <details className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"><summary className="cursor-pointer font-bold">Meal library <span className="ml-1 text-sm font-normal text-gray-500">({plan.meals.length})</span></summary><section className="mt-4 space-y-2">{plan.meals.map((meal) => (
          <div key={meal.id} className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"><div><div className="flex items-center gap-2"><p className="font-semibold">{meal.name}</p>{meal.id.startsWith("default-") && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-orange-700 dark:bg-orange-950 dark:text-orange-200">Template</span>}</div><p className="text-xs text-gray-500">{meal.ingredients.map((item) => item.name).join(", ")}</p></div><div className="flex"><button aria-label={`Edit ${meal.name}`} disabled={pending === meal.id} onClick={() => openEditMeal(meal)} className="p-2 text-orange-600"><FiEdit2 /></button>{!meal.id.startsWith("default-") && <button aria-label={`Delete ${meal.name}`} disabled={pending === meal.id} onClick={() => void removeMeal(meal)} className="p-2 text-red-600"><FiTrash2 /></button>}</div></div>
        ))}</section></details>
      </main>
      <FooterNav />

      {formOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"><form onSubmit={saveMeal} className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 dark:bg-gray-950 sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">{editingMealId ? "Edit meal" : "Add meal"}</h2><button type="button" onClick={() => setFormOpen(false)} className="p-2" aria-label="Close"><FiX /></button></div>
        <label className="mb-3 block text-sm font-medium">Meal name<input required maxLength={120} className={`${inputClass} mt-1`} value={mealName} onChange={(event) => setMealName(event.target.value)} /></label>
        <details className="mb-4 rounded-xl border border-gray-200 dark:border-gray-800"><summary className="cursor-pointer px-3 py-2 text-sm font-medium">Add description</summary><label className="block border-t border-gray-200 p-3 text-sm font-medium dark:border-gray-800">Description<textarea maxLength={500} className={`${inputClass} mt-1`} value={description} onChange={(event) => setDescription(event.target.value)} /></label></details>
        <div className="mb-2 flex items-center justify-between"><h3 className="font-bold">Ingredients</h3><Link to="/food" className="text-sm font-medium text-emerald-700">Add to tracker</Link></div>
        <div className="space-y-4">{ingredients.map((ingredient, index) => <div key={index} className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
          <label className="block text-xs font-medium">Link food tracker item<select className={`${inputClass} mt-1`} value={ingredient.foodItemId ?? ""} onChange={(event) => linkInventory(index, event.target.value)}><option value="">Custom ingredient</option>{foodItems.filter((food) => !food.hidden || food.id === ingredient.foodItemId).map((food) => <option key={food.id} value={food.id}>{food.name} ({food.quantity} {food.unit})</option>)}</select></label>
          <div className="mt-2 space-y-2"><input aria-label="Ingredient name" required placeholder="Ingredient" className={inputClass} value={ingredient.name} onChange={(event) => updateIngredientName(index, event.target.value)} /><div className="grid grid-cols-[1fr_7rem_auto] gap-2"><NumberStepper value={ingredient.quantity} min={0.01} step={1} ariaLabel={`${ingredient.name || "Ingredient"} quantity`} onChange={(quantity) => updateIngredient(index, { quantity })} /><input aria-label="Unit" required placeholder="Unit" className={inputClass} value={ingredient.unit} onChange={(event) => updateIngredient(index, { unit: event.target.value })} /><button type="button" aria-label="Remove ingredient" disabled={ingredients.length === 1} onClick={() => setIngredients((items) => items.filter((_, itemIndex) => itemIndex !== index))} className="p-2 text-red-600 disabled:opacity-30"><FiTrash2 /></button></div></div>
        </div>)}</div>
        <button type="button" onClick={() => setIngredients((items) => [...items, blankIngredient()])} className="mt-3 text-sm font-semibold text-orange-700">+ Add ingredient</button>
        <button disabled={pending === "meal"} className="mt-5 w-full rounded-xl bg-orange-600 p-3 font-semibold text-white disabled:opacity-50">{pending === "meal" ? "Saving…" : editingMealId ? "Update meal" : "Save meal"}</button>
      </form></div>}
    </SwipeShell>
  );
}
