export type ShoppingItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  notes?: string;
  source: "custom" | "foodTracker";
  foodItemId?: string;
  createdAt: string;
  updatedAt: string;
};

export type ShoppingItemInput = Pick<ShoppingItem, "name" | "quantity" | "unit" | "category" | "notes">;
