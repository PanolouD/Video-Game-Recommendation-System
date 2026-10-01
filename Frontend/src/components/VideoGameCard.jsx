import "../css/VideoGameCard.css"

function VideoGameCard({ game, matchScore}) {

    if (!game){
        return null;
    }

    const coverUrl = game.cover_url
        ? game.cover_url.replace("/t_thumb", "/t_cover_big")
        : null;

    const genres = Array.isArray(game.genres)
        ? game.genres.join(" / ")    
        : game.genres || "Genre unavailable";

    const platforms = Array.isArray(game.platforms)
        ? game.platforms.join(", ")
        : game.platforms || "Platform unavailable";

    const rating = game.rating != null
        ? (game.rating / 10).toFixed(1)
        : "N/A";


    return  <article className="videogame-card">
       
            <div className="videogame-poster">
                {coverUrl ? (
                    <img src={coverUrl} alt={`${game.name} cover`} loading="lazy" />
                    ) : (
                        <div className="videogame-no-cover"> No cover available </div>
                )}

            </div>

       
        <div className="videogame-info">
            
            {matchScore != null && (
                <p className="videogame-match"> {Math.round(matchScore * 100)}% match </p>
            )}
                       
            <h3>{game.name}</h3>

            <p className="videogame-genre">{genres}</p>

            <p className="videogame-platforms">{platforms}</p>

            <p className="videogame-rating">⭐ {rating}</p>

        </div>    
    </article>
    
}

export default VideoGameCard;