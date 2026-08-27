import VideoGameCard from "../components/VideoGameCard";
import {useState} from "react"

import "../css/Home.css"


function Home() {
  
  const [searchQuery, setSearchQuery] = useState("");


  const games = [
    { id: 1, title: "The Witcher 3", image: "https://placehold.co/220x280", genre: "RPG", rating: 9.4},
    { id: 2, title: "Elden Ring", image: "https://placehold.co/220x280", genre: "Action RPG", rating: 9.5},
    { id: 3, title: "Red Dead Redemption 2", image: "https://placehold.co/220x280", genre: "Action / Adventure", rating: 9.7},
    { id: 4, title: "Cyberpunk 2077", image: "https://placehold.co/220x280", genre: "RPG", rating: 8.8}
  ];
  

  const filteredGames = games.filter((game) => //κραταει μονο τα στοιχεια που πληρουν την συνθηκη
    game.title.toLowerCase().includes(searchQuery.toLowerCase()) 
  );

  return(
    <>

      <section className="home-search">
        <h1>Find Games like </h1>
          <h4>Enter the title of game you like to find.</h4>  
            <form className="search-form">
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
                {searchQuery ? "Search Results" : "Popular Games"}
            </h2>

          <div className="game-grid">
            {filteredGames.map((game) => (
              <VideoGameCard 
                key={game.id}
                image={game.image}
                title={game.title}
                genre={game.genre}
                rating={game.rating}
              />
            ))}

          </div>

      </section>
      
    </>  
  );
}
export default Home;