import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import Home from "./pages/Public/Home";
import Login from "./pages/Public/Login";
import About from "./pages/Public/About";
import Services from "./pages/Public/Services";
import PublicEvents from "./pages/Public/Events";
import Contact from "./pages/Public/Contact";
import ChurchRegister from "./pages/SaaS/ChurchRegister";
import PaymentSuccess from "./pages/SaaS/PaymentSuccess";
import PaymentCancelled from "./pages/SaaS/PaymentCancelled";
import SuperAdminDashboard from "./pages/SaaS/SuperAdminDashboard";
import AdminHome from "./pages/Admin/Home";
import DebugDashboard from "./pages/Admin/DebugDashboard"; // NEW
import Members from "./pages/Admin/Members/Members";
import Events from "./pages/Admin/Events/Events";
import Groups from "./pages/Admin/Groups/Groups";
import GroupDetails from "./pages/Admin/Groups/GroupDetails"; // NEW
import MemberHome from "./pages/Member/Home";
import ProtectedRoute from "./auth/ProtectedRoute";
import ChurchPublicHome from "./pages/Public/Church/PublicHome";
import Settings from "./pages/Admin/Settings/Settings";
import Finances from "./pages/Admin/Finances/Finances";
import SundaySchoolOverview from "./pages/Admin/SundaySchool/SundaySchoolOverview";
import SundaySchoolClasses from "./pages/Admin/SundaySchool/SundaySchoolClasses";
import SundaySchoolClassDetails from "./pages/Admin/SundaySchool/SundaySchoolClassDetails";
import SundaySchoolMonitors from "./pages/Admin/SundaySchool/SundaySchoolMonitors";
import Inventory from "./pages/Admin/Inventory/Inventory";
import Ceremonies from './pages/Admin/Ceremonies/Ceremonies';

import ChurchDetails from "./pages/SaaS/ChurchDetails";
import SuperAdminMemberProfile from "./pages/SaaS/SuperAdminMemberProfile";

// New Pages
import ContactsOverview from "./pages/Admin/Contacts/ContactsOverview";
import Visitors from "./pages/Admin/Contacts/Visitors";
import Organizations from "./pages/Admin/Contacts/Organizations";
import Expenses from "./pages/Admin/Finances/Expenses";

import Budgets from "./pages/Admin/Finances/Budgets";
import Accounts from "./pages/Admin/Finances/Accounts";
import MemberProfile from "./pages/Admin/Members/MemberProfile";
import CardTemplatesManager from './pages/Admin/Services/CardTemplatesManager';
import AdvancedSearchBuilder from './pages/Admin/Services/AdvancedSearchBuilder';
import MemberRequestsManager from './pages/Admin/Services/MemberRequestsManager';
import OrganizationProfile from "./pages/Admin/Contacts/OrganizationProfile";
import Birthdays from "./pages/Admin/Members/Birthdays";
import PublicActivityRegistration from "./pages/Public/PublicActivityRegistration";
import PublicEventRegistration from "./pages/Public/PublicEventRegistration";
import LogisticsDashboard from "./pages/Admin/Logistics/LogisticsDashboard";
import Spaces from "./pages/Admin/Logistics/Spaces";
import RoomProfile from "./pages/Admin/Logistics/RoomProfile";


import Resources from "./pages/Admin/Logistics/Resources";
import Reservations from "./pages/Admin/Logistics/Reservations";
import Maintenance from "./pages/Admin/Logistics/Maintenance";
import Assignments from "./pages/Admin/Logistics/Assignments";
import Suspended from "./pages/Public/Suspended";
import FirstPasswordChangeModal from "./components/FirstPasswordChangeModal";



function App() {
  // Subdomain detection logic
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  let subdomain = null;

  if (isLocalhost) {
    const urlParams = new URLSearchParams(window.location.search);
    subdomain = urlParams.get('tenant');

    if (!subdomain) {
      if (!subdomain) {
        // FIX: Do NOT auto-detect from localStorage.
        // localhost:3000 must ALWAYS be SaaS Landing Page unless ?tenant= is explicit.
        // The user must go to /login to access their dashboard.
      }
    }
  } else {
    if (parts.length > 2) {
      subdomain = parts[0];
    }
  }

  // Liste des sous-domaines considérés comme SaaS (système principal)
  const saasSubdomains = ['www', 'app', 'elyonsyst360', 'elyonssys360-frontend'];
  if (subdomain && saasSubdomains.includes(subdomain.toLowerCase())) {
    subdomain = null;
  }

  console.log("App Routing - Detected Subdomain:", subdomain);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <Toaster position="top-right" />
          <FirstPasswordChangeModal />
          <Routes>
            {/* Routes Publiques */}
            <Route path="/" element={subdomain ? <ChurchPublicHome subdomain={subdomain} /> : <Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/events" element={<PublicEvents />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login subdomain={subdomain} />} />
            <Route path="/register-church" element={<ChurchRegister />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancelled" element={<PaymentCancelled />} />
            <Route path="/public/register/:token" element={<PublicActivityRegistration />} />
            <Route path="/public/event/register/:token" element={<PublicEventRegistration />} />
            <Route path="/suspended" element={<Suspended />} />


            {/* Routes Protégées (Super Admin) */}
            <Route path="/super-admin" element={
              <ProtectedRoute role="super_admin">
                <SuperAdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/super-admin/church/:id" element={
              <ProtectedRoute role="super_admin">
                <ChurchDetails />
              </ProtectedRoute>
            } />
            <Route path="/super-admin/member/:id" element={
              <ProtectedRoute role="super_admin">
                <SuperAdminMemberProfile />
              </ProtectedRoute>
            } />

            {/* Routes Protégées (Admin Église) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/debug"
              element={
                <ProtectedRoute>
                  <DebugDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/contacts"
              element={
                <ProtectedRoute permission="members">
                  <ContactsOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/members"
              element={
                <ProtectedRoute permission="members">
                  <Members />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/birthdays"
              element={
                <ProtectedRoute permission="members">
                  <Birthdays />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/members/:id"
              element={
                <ProtectedRoute permission="members">
                  <MemberProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/visitors"
              element={
                <ProtectedRoute permission="members">
                  <Visitors />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/organizations"
              element={
                <ProtectedRoute permission="members">
                  <Organizations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/organizations/:id"
              element={
                <ProtectedRoute permission="members">
                  <OrganizationProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/events"
              element={
                <ProtectedRoute permission="events">
                  <Events />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/groups"
              element={
                <ProtectedRoute permission="groups">
                  <Groups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/groups/:id"
              element={
                <ProtectedRoute permission="groups">
                  <GroupDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute permission="settings">
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/services/cards"
              element={
                <ProtectedRoute permission="services">
                  <CardTemplatesManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/services/search-builder"
              element={
                <ProtectedRoute permission="services">
                  <AdvancedSearchBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/services/requests"
              element={
                <ProtectedRoute permission="services">
                  <MemberRequestsManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/finances"
              element={
                <ProtectedRoute permission="finances">
                  <Finances />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/expenses"
              element={
                <ProtectedRoute permission="finances">
                  <Expenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/budgets"
              element={
                <ProtectedRoute permission="finances">
                  <Budgets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/finances/accounts"
              element={
                <ProtectedRoute permission="finances">
                  <Accounts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sunday-school"
              element={
                <ProtectedRoute permission="sunday-school">
                  <SundaySchoolOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sunday-school/classes"
              element={
                <ProtectedRoute permission="sunday-school">
                  <SundaySchoolClasses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sunday-school/classes/:id"
              element={
                <ProtectedRoute permission="sunday-school">
                  <SundaySchoolClassDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sunday-school/monitors"
              element={
                <ProtectedRoute permission="sunday-school">
                  <SundaySchoolMonitors />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <ProtectedRoute permission="inventory">
                  <Inventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/ceremonies"
              element={
                <ProtectedRoute permission="ceremonies">
                  <Ceremonies />
                </ProtectedRoute>
              }
            />

            {/* Logistics Routes */}
            <Route
              path="/admin/logistics"
              element={
                <ProtectedRoute permission="logistics">
                  <LogisticsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logistics/spaces"
              element={
                <ProtectedRoute permission="logistics">
                  <Spaces />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logistics/rooms/:id"
              element={
                <ProtectedRoute permission="logistics">
                  <RoomProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logistics/resources"
              element={
                <ProtectedRoute permission="logistics">
                  <Resources />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logistics/reservations"
              element={
                <ProtectedRoute permission="logistics">
                  <Reservations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logistics/maintenance"
              element={
                <ProtectedRoute permission="logistics">
                  <Maintenance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logistics/assignments"
              element={
                <ProtectedRoute permission="logistics">
                  <Assignments />
                </ProtectedRoute>
              }
            />

            {/* Routes Protégées (Membre) */}
            <Route
              path="/member/*"
              element={
                <ProtectedRoute role="member">
                  <MemberHome />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;