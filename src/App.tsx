import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from '@/contexts/ThemeContext';
import { XPProvider } from '@/contexts/XPContext';
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Quiz from "./pages/Quiz";
import DoubtsChat from "./pages/DoubtsChat";
import Notes from "./pages/Notes";
import VisualMaker from "./pages/VisualMaker";
import Battle from "./pages/Battle";
import Lectures from "./pages/Lectures";
import Coding from "./pages/Coding";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import About from "./pages/About";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <XPProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/doubts-chat" element={<DoubtsChat />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/visual-maker" element={<VisualMaker />} />
              <Route path="/battle" element={<Battle />} />
              <Route path="/lectures" element={<Lectures />} />
              <Route path="/coding" element={<Coding />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/achievements" element={<Profile />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </XPProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
