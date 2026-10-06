import { useState } from "react";
import { Link } from "react-router-dom";

import { requestPasswordReset } from "../services/api";

import "../css/auth.css";


function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");


    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setLoading(true);
            setError("");
            setMessage("");

            const data = await requestPasswordReset(email);

            setMessage(
                data.message ||
                "If an account exists with this email, reset instructions have been sent."
            );
        } catch (error) {
            setError(
                error.message ||
                "Could not request a password reset."
            );
        } finally {
            setLoading(false);
        }
    }


    return (
        <main className="auth-page">
            <div className="auth-card">
                <h1>Forgot Password?</h1>

                <p className="auth-subtitle">
                    Enter your email and we will send you
                    instructions to reset your password.
                </p>

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >
                    <div className="auth-field">
                        <label htmlFor="reset-email">
                            Email
                        </label>

                        <input
                            id="reset-email"
                            type="email"
                            required
                            autoComplete="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                        />
                    </div>

                    {error && (
                        <p className="auth-error">
                            {error}
                        </p>
                    )}

                    {message && (
                        <p className="auth-success">
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Sending..."
                            : "Send reset link"}
                    </button>
                </form>

                <p className="auth-switch">
                    <Link to="/login">
                        Back to Login
                    </Link>
                </p>
            </div>
        </main>
    );
}


export default ForgotPassword;