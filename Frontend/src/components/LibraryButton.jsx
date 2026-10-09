import { useEffect, useState } from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";

import { addGameToLibrary, getLibraryGameStatus, removeGameFromLibrary,} from "../services/api";

import "../css/LibraryButton.css";


function LibraryButton({ gameId }) {

    const navigate = useNavigate();
    const location = useLocation();

    const token = localStorage.getItem("accessToken");
    const isLoggedIn = Boolean(token);

    const [isSaved, setIsSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {
        let cancelled = false;

        async function loadLibraryStatus() {
            if (!gameId || isLoggedIn) {
                setIsSaved(false);
                setLoading(false);
                setError("");
                return;
            }

            try {
                setLoading(true);
                setError("");

                const data = await getLibraryGameStatus(gameId);

                if (!cancelled) {
                    setIsSaved(data.is_saved);
                }
            } catch (error) {
                if (!cancelled) {
                    setError(
                        error.message ||
                        "Could not check library status."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadLibraryStatus();

        return () => {
            cancelled = true;
        };
    }, [gameId, isLoggedIn]);


    async function handleLibraryClick() {
        if (!isLoggedIn) {
            navigate("/login", {
                state: {
                    from: location.pathname,
                    message:
                        "Log in to add games to your Library.",
                },
            });

            return;
        }
        if (!gameId || loading) {
            return;
        }

        try {
            setLoading(true);
            setError("");

            if (isSaved) {
                await removeGameFromLibrary(gameId);
                setIsSaved(false);
            } else {
                await addGameToLibrary(gameId);
                setIsSaved(true);
            }
        } catch (error) {
            /*
             * Αν το frontend είχε παλιά κατάσταση και το παιχνίδι
             * υπάρχει ήδη, συγχρονίζουμε το κουμπί με το backend.
             */
            if (error.status === 409) {
                setIsSaved(true);
                return;
            }

            /*
             * Αν επιχειρήσουμε αφαίρεση αλλά το παιχνίδι
             * έχει ήδη διαγραφεί, το θεωρούμε μη αποθηκευμένο.
             */
            if (error.status === 404 && isSaved) {
                setIsSaved(false);
                return;
            }

            setError(
                error.message ||
                "Could not update your library."
            );
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="library-button-container">
            <button
                type="button"
                className={
                    isSaved
                        ? "library-button saved"
                        : "library-button"
                }
                onClick={handleLibraryClick}
                disabled={(isLoggedIn && loading) || !gameId}
            >
                {isLoggedIn
                    ? "Add to Library"
                    : loading
                        ? "Checking..."
                        : isSaved
                            ? "✓ In Library"
                            : "+ Add to Library"}
            </button>

            {error && (
                <p className="library-button-error">
                    {error}
                </p>
            )}
        </div>
    );
}


export default LibraryButton;