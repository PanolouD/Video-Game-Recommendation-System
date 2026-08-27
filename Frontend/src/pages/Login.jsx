import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/auth.css"

//Κρατάμε τις πληροφορίες του χρήστη
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const navigate = useNavigate(); //μπορούμε να αλλάζουμε σελίδα

  function handleSubmit(e) {
    e.preventDefault(); //Σταματάει το refresh της σελίδας

    // Παίρνουμε τον χρήστη από το localStorage
    const storedUser = JSON.parse(localStorage.getItem("user")); //Προσωρινό όσο δεν έχουμε ακόμα το backend

      // Ελέγχουμε αν υπάρχει και αν τα στοιχεία ταιριάζουν
      if (!storedUser) {
        setError("Δεν υπάρχει λογαριασμός. Κάνε Sign Up πρώτα!");
        return;
      }

      if (storedUser.email !== email || storedUser.password !== password) {
        setError("Λάθος email ή password!");
        return;
      }

      // Αποθηκεύουμε ότι ο χρήστης είναι logged in
      localStorage.setItem("loggedIn", "true");

      // Redirect στο Questionnaire
      navigate("/questionnaire");
  }

  return (
    <main className="auth-page">
        <div className="auth-card">

          <h1>Welcome Backkk</h1>
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