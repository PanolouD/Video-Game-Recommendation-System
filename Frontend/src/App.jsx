import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Questionnaire from "./pages/Questionnaire";
import Recommendations from "./pages/Recommendations";
import Library from "./pages/Library";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Footer from "./components/Footer";

import NavBar from "./components/NavBar";




function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">  
        <NavBar />

        <div className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/questionnaire" element={<Questionnaire />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/library" element={<Library />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile/>} />
          </Routes>
        </div>

        <Footer />  
      </div>  
    </BrowserRouter>
    
      
  );

}

export default App;




