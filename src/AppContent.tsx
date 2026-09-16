import Dashboard from "./components/Dashboard";
import Diary from "./components/Diary";
import FoodDatabase from "./components/FoodDatabase";
import Recipes from "./components/Recipes";
import Statistics from "./components/Statistics";
import Profile from "./components/Profile";
import Calculators from "./components/Calculators";
import CalorieCalculator from "./components/CalorieCalculator";
import WeightProjection from "./components/WeightProjection";
import Simulator from "./components/Simulator";
import Notes from "./components/Notes";
import MealPlanner from "./components/MealPlanner";
import MealHistory from "./components/MealHistory";
import HabitTracker from "./components/HabitTracker";
import BackupManager from "./components/BackupManager";
import SharePage from "./components/Share/SharePage";
import Challenges from "./components/Challenges";
import Articles from "./components/Articles";
import Settings from "./components/Settings";

import type { Page } from "./lib/navigation";

interface AppContentProps {
  currentPage: Page;
}

function AppContent({ currentPage }: AppContentProps) {
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "diary":
        return <Diary />;
      case "products":
        return <FoodDatabase />;
      case "recipes":
        return <Recipes />;
      case "stats":
        return <Statistics />;
      case "calculators":
        return <Calculators />;
      case "calorieCalculator":
        return <CalorieCalculator />;
      case "weightProjection":
        return <WeightProjection />;
      case "simulator":
        return <Simulator />;
      case "notes":
        return <Notes />;
      case "mealPlanner":
        return <MealPlanner />;
      case "mealHistory":
        return <MealHistory />;
      case "habits":
        return <HabitTracker />;
      case "backup":
        return <BackupManager />;
      case "share":
        return <SharePage />;
      case "profile":
        return <Profile />;
      case "challenges":
        return <Challenges />;
      case "articles":
        return <Articles />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return renderPage();
}

export default AppContent;
