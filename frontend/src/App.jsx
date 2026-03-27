import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';

import { Login } from './WebComponents/AuthComponents/Login';
import Homepage from './WebComponents/Pages/Homepage';
import AddExpense from './WebComponents/Pages/AddExpense';
import ViewExpPage from './WebComponents/Pages/ViewExpPage';
import BudgetPage from './WebComponents/Pages/BudgetPage';
import GroupPage from './WebComponents/Pages/GroupPage';
import Groups from './WebComponents/Pages/Groups';
import ViewGroupPage from './WebComponents/Pages/ViewGroupPage';
import InvitePage from './WebComponents/Pages/InvitePage';
import ProfilePage from './WebComponents/Pages/ProfilePage';
import ActiveEventPage from './WebComponents/Pages/ActiveEventPage';
import { Toaster } from '@/components/ui/toaster';
import { ToastProviderWrapper } from '@/components/use-toast';
import { SelectedGroupProvider } from './context/SelectedGroupContext';
import AssistantPage from './WebComponents/Pages/AssistantPage';
import AssistantWidget from './WebComponents/SideBarComponents/AssistantWidget';

const ProtectedRoutes = () => {
  const token = localStorage.getItem("isAuthenticated");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

function Layout() {
  const location = useLocation();

  const hideAssistantOn = ["/login", "/assistant"];

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        {}
        <Route element={<ProtectedRoutes />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/homepage" element={<Homepage />} />
          <Route path="/manage" element={<AddExpense />} />
          <Route path="/view" element={<ViewExpPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/group" element={<GroupPage />} />
          <Route path="/viewgroup" element={<Groups />} />
          <Route path="/groupview" element={<ViewGroupPage />} />
          <Route path="/invites" element={<InvitePage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/active-events" element={<ActiveEventPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>


      {!hideAssistantOn.includes(location.pathname) && <AssistantWidget />}
    </>
  );
}

function App() {
  return (
    <ToastProviderWrapper>
      <Router>
        <SelectedGroupProvider>
          <Layout />
        </SelectedGroupProvider>
      </Router>
      <Toaster />
    </ToastProviderWrapper>
  );
}

export default App;
