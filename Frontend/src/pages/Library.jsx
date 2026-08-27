import VideoGameCard from "../components/VideoGameCard";
import "../css/Library.css"

function Library() {



     const libraryGames = [

      {
         id:1,
         title: "The Witcher 3",
         image: "https://placehold.co/220x280",
         genre: "RPG",
         rating: 9.4,
         userRating: 10,
         review: "Amazing story and world" 
      },
      { 
        id: 2,
        title: "Elden Ring",
        image: "https://placehold.co/220x280",
        genre: "Action RPG",
        rating: 9.5,
        userRating: 9,
        review: "Great combat and exploration."
      }
     ]; 

  return(
    <main className="library-page">

      <section className="library-header">
        <h1>My Library</h1>
        <p>Games you have played and reviewd</p>
      </section>

      <section className="library-grid">
          {libraryGames.map((game) => (
           <div className="library-item" key={game.id}> {/* το key πρεπει να μπει στο πρωτο element που επιστρεφει το .map */}
              <VideoGameCard 
                  title={game.title}
                  image={game.image}
                  genre={game.genre}
                  rating={game.rating}
                />

              <div className="library-review">
                <h3>Your Review</h3>
                <p className="user-rating"> {game.userRating}/10 </p>

                <p className="review-text"> {game.review} </p>
              </div>

            </div>
          ))}  
          
      </section>

    </main>
  );
}
export default Library;