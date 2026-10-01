import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import VideoGameCard from "../components/VideoGameCard";
import { getRecommendations } from "../services/api";

import "../css/Recommendations.css";



function Recommendations() {


    const navigate = useNavigate();

    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {


      async function loadRecommendations() {
        try{
          setIsLoading(true);
          setError("");

          const data = await getRecommendations(10);

          setRecommendations(data);

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
                
              <div className="recommendations-empty">
                  <h2>No matching games found</h2>

                  <p>
                      Try selecting fewer or more general preferences.
                  </p>

                  <Link to="/questionnaire">
                      Update questionnaire
                  </Link>
                </div>
            ) : (
                <div className="recommendations-grid">
                    {recommendations.map(
                        ({ game, score }, index) => (
                            <div
                                className="recommendation-result"
                                key={game.id}
                            >
                                <span className="recommendation-rank">
                                    #{index + 1}
                                </span>

                                <VideoGameCard
                                    game={game}
                                    matchScore={score}
                                />
                            </div>
                        )
                    )}
                </div>
            )}

      </main>
    );

 
}
export default Recommendations;