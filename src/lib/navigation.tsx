import { createContext, useContext } from "react";

export type Page =
  | "dashboard"
  | "diary"
  | "products"
  | "recipes"
  | "stats"
  | "calculators"
  | "calorieCalculator"
  | "weightProjection"
  | "simulator"
  | "notes"
  | "mealPlanner"
  | "mealHistory"
  | "habits"
  | "backup"
  | "share"
  | "challenges"
  | "articles"
  | "profile"
  | "settings";

type NavigationContextType = {
  currentPage: Page;
  navigate: (page: Page) => void;
};

const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({
  children,
  currentPage,
  navigate,
}: {
  children: React.ReactNode;
  currentPage: Page;
  navigate: (page: Page) => void;
}) {
  return (
    <NavigationContext.Provider value={{ currentPage, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigation must be used within NavigationProvider");
  return ctx;
}
