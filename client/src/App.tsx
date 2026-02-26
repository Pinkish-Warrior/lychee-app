import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "@/pages/Dashboard";
import ReviewQueue from "@/pages/ReviewQueue";
import CategoryView from "@/pages/CategoryView";
import ComponentsShowcase from "@/pages/ComponentShowcase";
import Archive from "@/pages/Archive";


function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={Dashboard} />
        <Route path={"/review"} component={ReviewQueue} />
        <Route path={"/category/:category"} component={CategoryView} />
        <Route path={"/archive"} component={Archive} />
        <Route path={"/showcase"} component={ComponentsShowcase} />

        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
