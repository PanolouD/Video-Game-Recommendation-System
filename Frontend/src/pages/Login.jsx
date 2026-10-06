import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {FaEye, FaEyeSlash} from "react-icons/fa";
import {loginUser} from "../services/api";
import "../css/auth.css"

//Κρατάμε τις πληροφορίες του χρήστη
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate(); //μπορούμε να αλλάζουμε σελίδα

  async function handleSubmit(e) {
    e.preventDefault(); //Σταματάει το refresh της σελίδας
    setError("");

    try{

      const data = await loginUser(email, password);


      localStorage.setItem("accessToken", data.access_token); //Αποθηκευση του JWT access token  

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

          <h1>Welcome Backk</h1>
          <p className="auth-subtitle"> Log in to continue discovering games.</p>

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
                <div className="password-input-container">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}  
                    required
                    placeholder="Password"
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <button 
                    type="button"  
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEye /> : <FaEyeSlash />}  {/* Αλλαζουμε το icon απο κλειστο σε ανοιχτο */}
                  </button>
                </div>
            </div>

            <div className="auth-forgot-password">
              <Link to="/forgot-password">
                Forgot Password?
              </Link>
            </div>

            {/* Εμφάνιση error αν υπάρχει */}
            {error && <p className="auth-error">{error}</p>}

            <button type="submit"  className="auth-button">Σύνδεση</button>
          </form>

          <p className="auth-switch">Δεν έχεις λογαριασμό; <Link to="/signup"> Εγγραφή </Link></p>
        </div>  
    </main>
  );
}

export default Login; 