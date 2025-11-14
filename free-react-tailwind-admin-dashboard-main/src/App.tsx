import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/CreateNewUser";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import UserDataCheck from "./pages/UserDataCheck";
import CreateNewProject from "./layout/CreateNewProject";
import AllProjects from "./pages/AllProjects";
import ProjectDetail from "./pages/ProjectDetail";
import Issues from "./pages/Issues";
import UsersList from "./pages/UsersList";
import EvaluateTool from "./pages/evaluate-tool.tsx";
import ProcurementNew from "./pages/procurement-new.tsx";
import ProcurementRenewal from "./pages/procurement-renewal.tsx";
import Request from "./pages/Request";
import Reports from "./pages/Reports";
import AllOpen from "./pages/request-management/AllOpen.tsx";
import AssignedToMe from "./pages/request-management/AssignedToMe";
import Unassigned from "./pages/request-management/Unassigned";
import Resolved from "./pages/request-management/Resolved";
import IssueDetail from "./pages/IssueDetail";
import IssuesSplitView from "./pages/IssueSplitView";
import VendorList from "./pages/VendorManagement/VendorList";
import VendorContracts from "./pages/VendorManagement/VendorContracts";
import VendorPerformance from "./pages/VendorManagement/VendorPerformance";
import RequestSplitView from "./pages/RequestSplitView";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Redirect root path to sign-in for unauthenticated users */}
          <Route path="/" element={<Navigate to="/signin" replace />} />
          
          {/* Dashboard Layout - Protected Routes */}
          <Route element={<AppLayout />}>
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } 
            />

            {/* Others Page */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <UserProfiles />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/calendar" 
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/blank" 
              element={
                <ProtectedRoute>
                  <Blank />
                </ProtectedRoute>
              } 
            />

            {/* Forms */}
            <Route 
              path="/form-elements" 
              element={
                <ProtectedRoute>
                  <FormElements />
                </ProtectedRoute>
              } 
            />

            {/* Tables */}
            <Route 
              path="/basic-tables" 
              element={
                <ProtectedRoute>
                  <BasicTables />
                </ProtectedRoute>
              } 
            />

            {/* Ui Elements */}
            <Route 
              path="/alerts" 
              element={
                <ProtectedRoute>
                  <Alerts />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/avatars" 
              element={
                <ProtectedRoute>
                  <Avatars />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/badge" 
              element={
                <ProtectedRoute>
                  <Badges />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/buttons" 
              element={
                <ProtectedRoute>
                  <Buttons />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/images" 
              element={
                <ProtectedRoute>
                  <Images />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/videos" 
              element={
                <ProtectedRoute>
                  <Videos />
                </ProtectedRoute>
              } 
            />

            {/* Charts */}
            <Route 
              path="/line-chart" 
              element={
                <ProtectedRoute>
                  <LineChart />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bar-chart" 
              element={
                <ProtectedRoute>
                  <BarChart />
                </ProtectedRoute>
              } 
            />
            
            {/* User Data Check */}
            <Route 
              path="/user-data-check" 
              element={
                <ProtectedRoute>
                  <UserDataCheck />
                </ProtectedRoute>
              } 
            />
            
            {/* Create New Project */}
            <Route 
              path="/create-new-project" 
              element={
                <ProtectedRoute>
                  <CreateNewProject />
                </ProtectedRoute>
              } 
            />
            
            {/* All Projects */}
            <Route 
              path="/all-projects" 
              element={
                <ProtectedRoute>
                  <AllProjects />
                </ProtectedRoute>
              } 
            />
            
            {/* Individual Project Detail */}
            <Route 
              path="/project/:projectId" 
              element={
                <ProtectedRoute>
                  <ProjectDetail />
                </ProtectedRoute>
              } 
            />
            
            {/* Issues Page */}
            <Route 
              path="/issues" 
              element={
                <ProtectedRoute>
                  <Issues />
                </ProtectedRoute>
              } 
            />
            
            {/* Individual Issue Detail */}
            <Route 
              path="/issues/:issueKey" 
              element={
                <ProtectedRoute>
                  <IssueDetail />
                </ProtectedRoute>
              } 
            />
            
            {/* Issues Split View */}
            <Route 
              path="/issues-split" 
              element={
                <ProtectedRoute>
                  <IssuesSplitView />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/issues-split/:issueKey" 
              element={
                <ProtectedRoute>
                  <IssuesSplitView />
                </ProtectedRoute>
              } 
            />
            
            {/* Users List Page */}
            <Route 
              path="/users" 
              element={
                <ProtectedRoute>
                  <UsersList />
                </ProtectedRoute>
              } 
            />
            
            {/* New routes for the additional pages */}
            <Route 
              path="/evaluate-new" 
              element={
                <ProtectedRoute>
                  <EvaluateTool />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/procurement/new" 
              element={
                <ProtectedRoute>
                  <ProcurementNew />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/procurement/renewal" 
              element={
                <ProtectedRoute>
                  <ProcurementRenewal />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/requests" 
              element={
                <ProtectedRoute>
                  <Request />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/request-management/all-open" 
              element={
                <ProtectedRoute>
                  <AllOpen />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/request-management/assigned-to-me" 
              element={
                <ProtectedRoute>
                  <AssignedToMe />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/request-management/unassigned" 
              element={
                <ProtectedRoute>
                  <Unassigned />
                </ProtectedRoute>
              } 
            />
            
            <Route
              path="/request-management/resolved"
              element={
                <ProtectedRoute>
                  <Resolved />
                </ProtectedRoute>
              }
            />

            {/* Request Management Detail View */}
            <Route
              path="/request-management/:issueKey"
              element={
                <ProtectedRoute>
                  <RequestSplitView />
                </ProtectedRoute>
              }
            />
            
            {/* Vendor Management Routes */}
            <Route 
              path="/vendor-management/list" 
              element={
                <ProtectedRoute>
                  <VendorList />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/vendor-management/contracts" 
              element={
                <ProtectedRoute>
                  <VendorContracts />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/vendor-management/performance" 
              element={
                <ProtectedRoute>
                  <VendorPerformance />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}