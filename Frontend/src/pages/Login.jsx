import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {loginUser, saveQuestionnaire} from "../services/api";
import PasswordInputIcon from "../components/PasswordInputIcon";

import "../css/auth.css"

//Κρατάμε τις πληροφορίες του χρήστη
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const navigate = useNavigate(); //μπορούμε να αλλάζουμε σελίδα

  const location = useLocation();

  const loginMessage = location.state?.message || "";

  async function handleSubmit(e) {
    e.preventDefault(); //Σταματάει το refresh της σελίδας
    setError("");

    try{

      const data = await loginUser(email, password);


      localStorage.setItem("accessToken", data.access_token); //Αποθηκευση του JWT access token  

      const pendingQuestionnaire = sessionStorage.getItem("pendingQuestionnaire");

      if(pendingQuestionnaire){
        const answers = JSON.parse(pendingQuestionnaire);

        await saveQuestionnaire(answers);

        sessionStorage.removeItem("pendingQuestionnaire");

        navigate("/recommendations");
        return;
      }

      // Redirect στο Questionnaire
      navigate("/questionnaire");
    } catch(error){
        console.log(error);
        if (error.status === 401) {
        setError("Λάθος email ή κωδικός.");
        } else if (error.status) {
          setError(error.message);
        } else {
          setError("Could not connect to the server.");
        }   
      }    
  }

  return (
    <main className="auth-page">
        <div className="auth-card">

          <h1>Welcome Back</h1>
          <p className="auth-subtitle"> Log in to continue discovering games.</p>

          {loginMessage && (<p className="auth-info">{loginMessage}</p>)}

          <form className="auth-form" onSubmit={handleSubmit}>

            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                placeholder="Enter your Email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>

                <PasswordInputIcon
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                />
            </div>

            <div className="auth-forgot-password">
              <Link to="/forgot-password">
                Forgot Password?
              </Link>
            </div>

            {/* Εμφάνιση error αν υπάρχει */}
            {error && <p className="auth-error">{error}</p>}

            <button type="submit"  className="auth-button">Login</button>
          </form>

          <p className="auth-switch">You don't have a naccount?<Link to="/signup"> Sign up </Link></p>
        </div>  
    </main>
  );
}

export default Login; 