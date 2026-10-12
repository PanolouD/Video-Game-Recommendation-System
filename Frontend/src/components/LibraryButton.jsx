import { useEffect, useState } from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";

import { addGameToLibrary, getLibraryGameStatus, removeGameFromLibrary,} from "../services/api";

import "../css/LibraryButton.css";


function LibraryButton({ gameId, initialIsSaved = null, variant = "default", onSaveChange, }) {

    const navigate = useNavigate();
    const location = useLocation();

    const token = localStorage.getItem("accessToken");
    const isLoggedIn = Boolean(token);

    const [isSaved, setIsSaved] = useState(initialIsSaved === true);
    const [loading, setLoading] = useState(initialIsSaved === null);
    const [error, setError] = useState("");


    useEffect(() => {
        let cancelled = false;

        async function loadLibraryStatus() {
            if (!gameId || !isLoggedIn) {
                setIsSaved(false);
                setLoading(false);
                setError("");
                return;
            }
            // Στην Libraryξερουμε οτι το παιχνιδι ειναι αποθηκευμενο και δεν χρειαζεται επιπλεον request για το status του.
            if(typeof initialIsSaved === "boolean"){
                setIsSaved(initialIsSaved);
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
            } catch (requestError) {
                if (!cancelled) {
                    setError( requestError.message || "Could not check library status.");}
            } finally {
                if (!cancelled) 
                    {setLoading(false);}
            }
        }

        loadLibraryStatus();

        return () => {
            cancelled = true;
        };
    }, [gameId, isLoggedIn, initialIsSaved]);


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
                onSaveChange?.(false);
            } else {
                await addGameToLibrary(gameId);

                setIsSaved(true);
                onSaveChange?.(true);
            }
        } catch (requestError) {

            if (requestError.status === 409) {
                setIsSaved(true);
                onSaveChange?.(true);
                return;
            }

            if (requestError.status === 404 && isSaved && isSaved) {
                setIsSaved(false);
                onSaveChange?.(false);
                return;
            }

            if(requestError.status === 401) {
                localStorage.removeItem("accessToken");

                navigate("/login", {
                    state: {
                        from: location.pathname,
                        message: "Your session has expired. Log in again."
                    },
                });
                return;
            }

            setError(requestError.message || "Could not update your library.");
        } finally {
            setLoading(false);
        }
    }

    const isHeartVariant = variant === "heart";

    return (
        <div className={isHeartVariant ? "library-button-container heart-container" : "library-button-container"}>
            <button
                type="button"
                className={[ "library-button", isSaved ? "saved" : "",
                    isHeartVariant
                        ? "library-heart-button"
                        : "",
                ].filter(Boolean).join(" ")}        
            
                onClick={handleLibraryClick}
                disabled={(isLoggedIn && loading) || !gameId}

                aria-label={
                    isSaved ? "Remove from Library" : "Add to Library"
                }

                title={
                    isSaved ? "Remove from Library" : "Add to Library"
                }
            >    

                {isHeartVariant ? (isSaved ? (
                        <FaHeart aria-hidden="true" />
                    ) : (
                        <FaRegHeart aria-hidden="true" />
                    )
                ) : loading ? (
                    "Checking..."
                ) : isSaved ? (
                    "✓ In Library"
                ) : (
                    "+ Add to Library"
                )}
                
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