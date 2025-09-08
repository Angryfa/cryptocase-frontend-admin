import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import RequireAdmin from "./components/RequireAdmin";
import LoginPage from "./pages/LoginPage";
import UsersPage from "./pages/UsersPage";
import CasesPage from "./pages/CasesPage";
import CaseTypesPage from "./pages/CaseTypesPage";
import CaseEditPage from "./pages/CaseEditPage";
import CaseTypeEditPage from "./pages/CaseTypeEditPage";
import TicketsListPage from "./pages/TicketsListPage";
import TicketAdminPage from "./pages/TicketAdminPage";
import ReferralLevelsPage from "./pages/ReferralLevelsPage";
import LayoutDefault from "./layouts/LayoutDefault";
import root from "./assets/styles/Root.module.css";

function App() {
  return (
    <div className={root.app}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<LayoutDefault />}> 
              <Route path="/users" element={<RequireAdmin><UsersPage /></RequireAdmin>} />
              <Route path="/cases" element={<RequireAdmin><CasesPage /></RequireAdmin>} />
              <Route path="/cases/:id" element={<RequireAdmin><CaseEditPage /></RequireAdmin>} />
              <Route path="/case-types" element={<RequireAdmin><CaseTypesPage /></RequireAdmin>} />
              <Route path="/case-types/:id" element={<RequireAdmin><CaseTypeEditPage /></RequireAdmin>} />
              <Route path="/tickets" element={<RequireAdmin><TicketsListPage /></RequireAdmin>} />
              <Route path="/tickets/:id" element={<RequireAdmin><TicketAdminPage /></RequireAdmin>} />
              <Route path="/ref-levels" element={<RequireAdmin><ReferralLevelsPage /></RequireAdmin>} />
              <Route path="/" element={<div className={root.container}>Добро пожаловать в админку</div>} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
