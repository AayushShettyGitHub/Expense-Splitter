import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { Login } from './WebComponents/AuthComponents/Login';
import Homepage from './WebComponents/Pages/Homepage';
import AddExpense from './WebComponents/Pages/AddExpense';
import ViewExpPage from './WebComponents/Pages/ViewExpPage';
import BudgetPage from './WebComponents/Pages/BudgetPage';
import GroupPage from './WebComponents/Pages/GroupPage';
import Groups from './WebComponents/Pages/Groups';
import ViewGroupPage from './WebComponents/Pages/ViewGroupPage';
import InvitePage from './WebComponents/Pages/InvitePage';

import { Toaster } from '@/components/ui/toaster';
import { ToastProviderWrapper } from '@/components/use-toast';
import { SelectedGroupProvider } from './context/SelectedGroupContext';


function App() {
  return (
    <ToastProviderWrapper>
      <Router>
        <SelectedGroupProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/homepage" element={<Homepage />} />
            <Route path="/manage" element={<AddExpense />} />
            <Route path="/view" element={<ViewExpPage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/group" element={<GroupPage />} />
            <Route path="/viewgroup" element={<Groups />} />
            <Route path="/groupview" element={<ViewGroupPage />} />
            <Route path="/invites" element={<InvitePage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </SelectedGroupProvider>
      </Router>
      <Toaster />
    </ToastProviderWrapper>
  );
}

export default App;
