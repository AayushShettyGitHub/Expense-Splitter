
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { Login  } from './WebComponents/AuthComponents/Login';

import Homepage from './WebComponents/Pages/Homepage';


function App() {
  

return (
   
      <Router>
      <Routes>
      <Route path="*" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/homepage" element={<Homepage />} ></Route>
       </Routes>
    </Router>
   
  );
  

}

export default App;