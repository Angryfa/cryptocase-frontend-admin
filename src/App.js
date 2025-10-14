import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import RequireAdmin from "./components/RequireAdmin";
import LoginPage from "./pages/LoginPage";
import UsersPage from "./pages/UsersPage";
import UserDetailPage from "./pages/UserDetailPage";
import CasesPage from "./pages/CasesPage";
import CaseTypesPage from "./pages/CaseTypesPage";
import CaseEditPage from "./pages/CaseEditPage";
import CaseTypeEditPage from "./pages/CaseTypeEditPage";
import CaseTypeCreatePage from "./pages/CaseTypeCreatePage";
import CaseCreatePage from "./pages/CaseCreatePage";
import PrizesPage from "./pages/PrizesPage";
import PrizeCreatePage from "./pages/PrizeCreatePage";
import TicketsListPage from "./pages/TicketsListPage";
import TicketAdminPage from "./pages/TicketAdminPage";
import ReferralLevelsPage from "./pages/ReferralLevelsPage";
import LayoutSidebar from "./layouts/LayoutSidebar";
import root from "./assets/styles/Root.module.css";
import DashboardPage from "./pages/DashboardPage";
import ReferralBonusesPage from "./pages/ReferralBonusesPage";
import DepositsPage from "./pages/DepositsPage";
import WithdrawalsPage from "./pages/WithdrawalsPage";
import NewUsersPage from "./pages/NewUsersPage";
import PromocodesPage from "./pages/PromocodesPage";
import PromocodeEditPage from "./pages/PromocodeEditPage";

function App() {
   return (
      <div className={root.app}>
         <AuthProvider>
            <Router>
               <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route element={<LayoutSidebar />}>
                     <Route path="/users" element={<RequireAdmin><UsersPage /></RequireAdmin>} />
                     <Route path="/users/:id" element={<RequireAdmin><UserDetailPage /></RequireAdmin>} />
                     <Route path="/cases" element={<RequireAdmin><CasesPage /></RequireAdmin>} />
                     <Route path="/cases/create" element={<RequireAdmin><CaseCreatePage /></RequireAdmin>} />
                     <Route path="/cases/:id" element={<RequireAdmin><CaseEditPage /></RequireAdmin>} />
                     <Route path="/prizes" element={<RequireAdmin><PrizesPage /></RequireAdmin>} />
                     <Route path="/prizes/create" element={<RequireAdmin><PrizeCreatePage /></RequireAdmin>} />
                     <Route path="/case-types" element={<RequireAdmin><CaseTypesPage /></RequireAdmin>} />
                     <Route path="/case-types/create" element={<RequireAdmin><CaseTypeCreatePage /></RequireAdmin>} />
                     <Route path="/case-types/:id" element={<RequireAdmin><CaseTypeEditPage /></RequireAdmin>} />
                     <Route path="/tickets" element={<RequireAdmin><TicketsListPage /></RequireAdmin>} />
                     <Route path="/tickets/:id" element={<RequireAdmin><TicketAdminPage /></RequireAdmin>} />
                     <Route path="/ref-levels" element={<RequireAdmin><ReferralLevelsPage /></RequireAdmin>} />
                     <Route path="/" element={<RequireAdmin><DashboardPage /></RequireAdmin>} />
                     <Route path="/referral-bonuses" element={<RequireAdmin><ReferralBonusesPage /></RequireAdmin>} />
                     <Route path="/deposits" element={<RequireAdmin><DepositsPage /></RequireAdmin>} />
                     <Route path="/withdrawals" element={<RequireAdmin><WithdrawalsPage /></RequireAdmin>} />
                     <Route path="/new-users" element={<RequireAdmin><NewUsersPage /></RequireAdmin>} />
                     <Route path="/promocodes" element={<RequireAdmin><PromocodesPage /></RequireAdmin>} />
                     <Route path="/promocodes/:id" element={<RequireAdmin><PromocodeEditPage /></RequireAdmin>} />
                  </Route>
               </Routes>
            </Router>
         </AuthProvider>
      </div>
   );
}

export default App;
