import { useEffect, useState } from "react";

import {
    addGameToLibrary,
    getLibraryGameStatus,
    removeGameFromLibrary,
} from "../services/api";

import "../css/LibraryButton.css";


function LibraryButton({ gameId }) {
    const [isSaved, setIsSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {
        let cancelled = false;

        async function loadLibraryStatus() {
            if (!gameId) {
                setLoading(false);
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
    }, [gameId]);


    async function handleLibraryClick() {
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
                disabled={loading || !gameId}
            >
                {loading
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