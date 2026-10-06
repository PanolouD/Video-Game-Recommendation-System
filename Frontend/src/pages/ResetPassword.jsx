import { useState } from "react";
import {
    Link,
    useSearchParams,
} from "react-router-dom";

import { resetPassword } from "../services/api";

import "../css/auth.css";


function ResetPassword() {
    const [searchParams] = useSearchParams();

    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");


    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setMessage("");

        if (!token) {
            setError(
                "The password reset link is invalid."
            );
            return;
        }

        if (newPassword.length < 8) {
            setError(
                "Password must contain at least 8 characters."
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            const data = await resetPassword(
                token,
                newPassword
            );

            setMessage(
                data.message ||
                "Your password was reset successfully."
            );

            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            setError(
                error.message ||
                "Could not reset your password."
            );
        } finally {
            setLoading(false);
        }
    }


    return (
        <main className="auth-page">
            <div className="auth-card">
                <h1>Reset Password</h1>

                <p className="auth-subtitle">
                    Enter your new password below.
                </p>

                {!token ? (
                    <>
                        <p className="auth-error">
                            This password reset link is invalid.
                        </p>

                        <p className="auth-switch">
                            <Link to="/forgot-password">
                                Request another reset link
                            </Link>
                        </p>
                    </>
                ) : (
                    <form
                        className="auth-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="auth-field">
                            <label htmlFor="new-password">
                                New password
                            </label>

                            <input
                                id="new-password"
                                type="password"
                                required
                                minLength={8}
                                autoComplete="new-password"
                                value={newPassword}
                                onChange={(event) =>
                                    setNewPassword(
                                        event.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="confirm-password">
                                Confirm password
                            </label>

                            <input
                                id="confirm-password"
                                type="password"
                                required
                                minLength={8}
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(event) =>
                                    setConfirmPassword(
                                        event.target.value
                                    )
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

                        {!message && (
                            <button
                                type="submit"
                                className="auth-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Resetting..."
                                    : "Reset password"}
                            </button>
                        )}
                    </form>
                )}

                {message && (
                    <p className="auth-switch">
                        <Link to="/login">
                            Continue to Login
                        </Link>
                    </p>
                )}
            </div>
        </main>
    );
}


export default ResetPassword;