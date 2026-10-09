import {useEffect, useState} from "react";
import {Link} from "react-router-dom";

import VideoGameCard from "../components/VideoGameCard";
import {getGames} from "../services/api";

import "../css/Home.css"


function Home() {
  

  const [games, setGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    async function loadGames(){
      try {
        setLoading(true);
        setError("");

        const data = await getGames();
        setGames(data);
      } catch(error) {
        console.error("Failed to load games:", error);
        setError("Could not load games.");
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, []); // Το κενο array [] σημαινει οτι θα εκτελεστει μονο μια φορα οταν ανοιγει το Homepage
  

  const popularGames = [...games].sort((firstGame, secondGame) => 
    (secondGame.total_rating_count ?? 0) - (firstGame.total_rating_count ?? 0)).slice(0, 40);


  return(
    <>

      <section className="home-hero">
          <div className="home-hero-content">
              <p className="home-hero-label">
                  Personalized game discovery
              </p>

              <h1>
                  Find games that actually match
                  <span> your preferences.</span>
              </h1>

              <p className="home-hero-description">
                  Tell us which genres, themes, platforms,
                  game modes and perspectives you enjoy.
                  We will analyze your choices and recommend
                  games selected specifically for you.
              </p>

              <div className="home-hero-actions">
                  <Link
                      to="/questionnaire"
                      className="home-primary-action"
                  >
                      Find my games
                      <span aria-hidden="true"> →</span>
                  </Link>

                  <Link
                      to="/recommendations"
                      className="home-secondary-action"
                  >
                      View my recommendations
                  </Link>
              </div>
          </div>

          <div className="home-process">
              <article className="home-process-step">
                  <span className="home-process-number">
                      01
                  </span>

                  <div>
                      <h2>Share your preferences</h2>

                      <p>
                          Choose the genres, themes and ways
                          you enjoy playing.
                      </p>
                  </div>
              </article>

              <article className="home-process-step">
                  <span className="home-process-number">
                      02
                  </span>

                  <div>
                      <h2>We find the best matches</h2>

                      <p>
                          Our recommendation system ranks games
                          according to your answers.
                      </p>
                  </div>
              </article>

              <article className="home-process-step">
                  <span className="home-process-number">
                      03
                  </span>

                  <div>
                      <h2>Discover your next game</h2>

                      <p>
                          Explore detailed results and save your
                          favorites to your Library.
                      </p>
                  </div>
              </article>
          </div>
      </section> 

      <section className="popular-games"> 

            <h2>
                {searchQuery.trim() ? "Search Results" : "Popular Games"}
            </h2>

            {loading && (
              <p className="home-message">Loading games...</p>
            )}

            {error && (
              <p className="home-error">{error}</p>
            )}

            {!loading && !error && popularGames.length === 0 && (
              <p className="home-message">No games available</p>
            )}


            {!loading && !error && popularGames.length > 0 &&(
              <div className="game-grid">
                {popularGames.map((game) => (
                  <VideoGameCard 
                    key={game.id}
                    game={game}
                  />
                ))}

              </div>
            )}  

      </section>
      
    </>  
  );
}
export default Home;