import { useState } from "react";
import { StoreProvider } from "./lib/store";
import { ToastProvider } from "./components/ui";
import { QuickAddProvider } from "./components/quickadd";
import { Shell } from "./components/Shell";
import { Reminders } from "./components/Reminders";
import { RegisterSW } from "./components/RegisterSW";
import { NavigationProvider, type Page } from "./lib/navigation";
import AppContent from "./AppContent";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  return (
    <StoreProvider>
      <NavigationProvider currentPage={currentPage} navigate={setCurrentPage}>
        <ToastProvider>
          <QuickAddProvider>
            <Shell currentPage={currentPage} onNavigate={setCurrentPage}>
              <AppContent currentPage={currentPage} />
            </Shell>
            <Reminders />
          </QuickAddProvider>
        </ToastProvider>
      </NavigationProvider>
      <RegisterSW />
    </StoreProvider>
  );
}

export default App;
