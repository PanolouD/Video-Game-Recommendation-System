import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/auth.css"

//Κρατάμε τις πληροφορίες του χρήστη
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const navigate = useNavigate(); //μπορούμε να αλλάζουμε σελίδα

  async function handleSubmit(e) {
    e.preventDefault(); //Σταματάει το refresh της σελίδας
    setError("");

      try{

        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        //Κανουμε HTTP request στοο backend
        const response = await fetch("http://localhost:8000/api/users/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
        });

        const data = await response.json(); //παιρνουμε το body της απαντησης

        if(!response.ok){
          console.log(data);
          setError("Λάθος email ή Κωδικός");
          return;
        }

        localStorage.setItem("accessToken", data.access_token); //Αποθηκευση του JWT access token  

          // Redirect στο Questionnaire
          navigate("/questionnaire");
        } catch(error){
          console.log(error);
          setError("Could not connect to the server.")
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
              <input
                id="password"
                type="password"
                required
                placeholder="Password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
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