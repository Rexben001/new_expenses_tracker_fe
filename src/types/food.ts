export type FoodCategory = string;
export type FoodLifecycleStatus = "active" | "finished" | "wasted";
export type FoodPreparationState = "raw" | "cooked";

export type FoodItemInput = {
  name: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  minimumQuantity: number;
  expiryDate?: string;
  boughtDate?: string;
  cookedDate?: string;
  location?: string;
  notes?: string;
  buy: boolean;
  opened: boolean;
  preparationState?: FoodPreparationState;
  freezable?: boolean;
  freezeExtensionDays?: number;
  estimatedValue?: number;
  estimatedWeightKg?: number;
};

export type FoodItem = FoodItemInput & {
  id: string;
  lifecycleStatus?: FoodLifecycleStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type FoodStats = {
  period: string;
  finishedCount: number;
  wastedCount: number;
  savedWeightKg: number;
  wastedWeightKg: number;
  estimatedSavings: number;
  consumption?: {
    day: FoodConsumptionPeriod;
    week: FoodConsumptionPeriod;
    month: FoodConsumptionPeriod;
    byCategory: Array<{ category: string; count: number }>;
  };
};

export type FoodConsumptionPeriod = {
  records: number;
  totalQuantity: number;
  quantitiesByUnit: Record<string, number>;
};

export type Weekday = "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";
export type MealType = "lunch" | "dinner";

export type MealIngredient = {
  name: string;
  quantity: number;
  unit: string;
  foodItemId?: string;
};

export type Meal = {
  id: string;
  name: string;
  description?: string;
  ingredients: MealIngredient[];
  recordType?: "meal";
  createdAt?: string;
  updatedAt?: string;
};

export type IngredientWarning = {
  ingredient: string;
  severity: "missing" | "insufficient" | "low";
  message: string;
};

export type MealScheduleEntry = {
  id: string;
  day: Weekday;
  date: string;
  mealType: MealType;
  mealId: string;
  mealName: string;
  warnings: IngredientWarning[];
  cooked: boolean;
  cookedAt?: string;
  updatedAt: string;
};

export type MealPlan = { meals: Meal[]; schedule: MealScheduleEntry[] };
