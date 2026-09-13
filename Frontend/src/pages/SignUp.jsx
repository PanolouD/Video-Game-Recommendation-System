import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {FaEye, FaEyeSlash} from "react-icons/fa";
import {registerUser} from "../services/api";
import "../css/auth.css"

function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try{
        await registerUser({
          username: username,
          email: email,
          password: password,
        });
      
        navigate("/login");
    } catch (error) {
      console.log(error);

      if (error.status === 400) {
        setError(error.message);
      } else {
        setError("Could not connect to the server.");
      }
    }
  }

  return (
    <main className="auth-page">

      <div className="auth-card">

          <h1>Create Account</h1>

                <p className="auth-subtitle"> Create your profile and get personalized game recommendations.</p>
                {error && <p className="auth-error">{error}</p>} {/* Αν υπαρχει error εμφανιζεται το error */}
          <form className="auth-form" onSubmit={handleSubmit}>

            <div className="auth-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                required
                placeholder="Choose a username"
                value={username}
                autoComplete="username"
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                placeholder="Email"
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
                    minLength={8}
                    placeholder="Password"
                    value={password}
                    autoComplete="new-password"
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

            <button type="submit" className="auth-button">Create Account</button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login">Login</Link>
          </p>
          
      </div>    
    </main>
  );
}

export default SignUp;