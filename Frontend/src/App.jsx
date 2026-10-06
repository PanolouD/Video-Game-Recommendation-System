import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Questionnaire from "./pages/Questionnaire";
import Recommendations from "./pages/Recommendations";
import Library from "./pages/Library";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import NavBar from "./components/NavBar";




function App() {
  return (
    <BrowserRouter>
      <NavBar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/questionnaire" element={<Questionnaire />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/library" element={<Library />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
    
      
  );

}

export default App;




