import { useContext } from "react";
import { ItemContext } from "../types/context";

export function useItemContext() {
  const context = useContext(ItemContext);

  if (!context) {
    throw new Error("ItemContext must be used within a ItemContextProvider");
  }

  return context;
}
