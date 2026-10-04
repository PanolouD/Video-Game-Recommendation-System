import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import GameDetailsCard from "../components/GameDetailsCard";
import { getRecommendations } from "../services/api";

import "../css/Recommendations.css";



function Recommendations() {


    const navigate = useNavigate();

    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {


      async function loadRecommendations() {
        try{
          setIsLoading(true);
          setError("");

          const data = await getRecommendations(10);

          setRecommendations(data);
          setCurrentIndex(0);

        } catch (requestError) {
          console.error(
            "Could not load recommendations:",
            requestError
          );

          if (requestError.status === 401) {
            localStorage.removeItem("accessToken");
            navigate("/login");
            return;
          }

          setError(
            requestError.message || "Could not load recommendations."
          );
        } finally {
          setIsLoading(false);
        }
      }

      loadRecommendations();
    }, [navigate]);

    function handlePrevious() {
      setCurrentIndex((previousIndex) =>
          Math.max(previousIndex - 1, 0)
      );
    }

    function handleNext() {
        setCurrentIndex((previousIndex) =>
            Math.min(
                previousIndex + 1,
                recommendations.length - 1
            )
        );
    }

    if (isLoading) {
      return (
        <main className="recommendations-page">
          <p className="recommendations-message">
              Finding the best games for you...
          </p>
        </main>
      );
    }


    if (error) {
      return (
        <main className="recommendations-page">
          <p className="recommendations-message">
              {error}
          </p>
        </main>
      );
    }

    return (
      <main className="recommendations-page">

        <header className="recommendations-header">

            <p className="recommendations-label">
                Based on your preferences
            </p>

              <h1>Your Recommendations</h1>

            <p>
                These games are ranked according to how closely
                they match your questionnaire answers.
            </p>
        </header>
          
          {recommendations.length === 0 ? (
                
        <div className="recommendations-empty" role="status">
            <span className="recommendations-empty-icon" aria-hidden="true">
                🎮
            </span>

            <h2>We couldn't find an exact match</h2>

            <p>
                Your current preferences may be too specific.
                Try removing one or two choices to discover more games.
            </p>

          <div className="recommendations-empty-actions">
            <Link to="/questionnaire" className="recommendations-empty-primary">
                    Update questionnaire
            </Link>

            <Link to="/" className="recommendations-empty-secondary">
                    Explore popular games
            </Link>
          </div>
       </div>
            ) : (
                <section className="recommendation-viewer">
                    <GameDetailsCard
                        game={recommendations[currentIndex].game}
                        matchScore={recommendations[currentIndex].score}
                        rank={currentIndex + 1}
                    />

                    <nav className="recommendation-navigation" aria-label="Recommendation navigation">

                        <button type="button" onClick={handlePrevious} disabled={currentIndex === 0}>
                            ← Previous
                        </button>

                        <span>
                            {currentIndex + 1} of {recommendations.length}
                        </span>

                        <button type="button" onClick={handleNext} disabled={currentIndex === recommendations.length - 1}>
                            Next →
                        </button>

                    </nav>
                </section>
            )}

      </main>
    );

 
}
export default Recommendations;