
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { Login  } from './WebComponents/AuthComponents/Login';

import Homepage from './WebComponents/Pages/Homepage';
import AddExpense from './WebComponents/Pages/AddExpense';
import ViewExpPage from './WebComponents/Pages/ViewExpPage';
import BudgetPage from './WebComponents/Pages/BudgetPage';


function App() {
  

return (
   
      <Router>
      <Routes>
      <Route path="*" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/homepage" element={<Homepage />} ></Route>
      <Route path="/manage" element={<AddExpense />} ></Route>
      <Route path="/view" element={<ViewExpPage />} ></Route>
      <Route path="/budget" element={<BudgetPage />} ></Route>
      </Routes>
    </Router>
   
  );
  

}

export default App;