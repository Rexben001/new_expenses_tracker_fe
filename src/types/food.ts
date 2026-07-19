export type FoodCategory =
  | "food"
  | "fruit"
  | "vegetable"
  | "drink"
  | "spice"
  | "ingredient"
  | "soup"
  | "cooked"
  | "other";
export type FoodLifecycleStatus = "active" | "finished" | "wasted";

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
};
