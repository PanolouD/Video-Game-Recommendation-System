import {useEffect, useState} from "react";

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


  const filteredGames = searchQuery.trim() ? games.filter((game) => 
    game.name.toLowerCase().includes(searchQuery.trim().toLocaleLowerCase())) 
  : popularGames;


  return(
    <>

      <section className="home-search">
        <h1>Find Games like </h1>
          <h4>Enter the title of game you like to find.</h4>  
            <form className="search-form" onSubmit={(event) => event.preventDefault()}> {/* Ετσι το Enter δεν ανανεωνει την σελιδα */}
              <input 
                type = "search"
                placeholder = "Games like... "
                className="search-bar"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} // Ενημερώνει το searchQuery κάθε φορά που αλλάζει το input
              />
            </form>
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

            {!loading && !error && filteredGames.length === 0 && (
              <p className="home-message">No games found</p>
            )}


            {!loading && !error && filteredGames.length > 0 &&(
              <div className="game-grid">
                {filteredGames.map((game) => (
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