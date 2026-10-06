import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import VideoGameCard from "../components/VideoGameCard";
import { getLibrary } from "../services/api";

import "../css/Library.css"

function Library() {


  const navigate = useNavigate();

  const [libraryEntries, setLibraryEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadLibrary() {
        try {
            setLoading(true);
            setError("");

            const data = await getLibrary(); // Τα δεδομένα απο το backend

            if (!cancelled) {
                setLibraryEntries(Array.isArray(data) ? data : []);
              }
        } catch (error) {
            if (cancelled) {
                return;
            }

            if (error.status === 401) {
                navigate("/login");
                return;
            }

            setError(
                error.message ||
                "Could not load your library."
            );
         } finally {
          if (!cancelled) {
              setLoading(false);
            }
          }
      }

      loadLibrary();

      return () => {
          cancelled = true;
      };
    }, [navigate]);

    if (loading) {
        return (
            <main className="library-page">
                <p className="library-message">
                    Loading your library...
                </p>
            </main>
        );
    }


    if (error) {
        return (
            <main className="library-page">
                <p className="library-error">
                    {error}
                </p>
            </main>
        );
    }

  return(
    <main className="library-page">

      <section className="library-header">
        <h1>My Library</h1>
        <p>Games you have saved to your personal library</p>
      </section>

      {libraryEntries.length === 0 ? (
                <section className="library-empty">
                    <h2>Your library is empty</h2>

                    <p>
                        Add games you like and they will appear here.
                    </p>
                </section>
            ) : (
                <section className="library-grid">
                    {libraryEntries.map((entry) => (
                        <div className="library-item" key={entry.id}>
                            <VideoGameCard game={entry.game} />

                            <p className="library-saved-date">
                                Saved{" "} 
                                {new Date(entry.saved_at).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </section>
            )}

    </main>
  );
}
export default Library;