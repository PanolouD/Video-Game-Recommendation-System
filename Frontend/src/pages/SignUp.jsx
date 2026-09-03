import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/auth.css"

function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try{
        const response = await fetch("http://localhost:8000/api/users",{
          
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username: username,
            email: email,
            password: password,
          }),

        });

        const data = await response.json();

        if(!response.ok){
          console.log(data);
          setError("Could not create account.");
          return;
        }
      
        navigate("/login");
    } catch (error){
      console.log(error);
      setError("Could not connect to the server.");
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
              <input
                id="password"
                type="password"
                required
                minLength={8}
                placeholder="Password"
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
              />
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