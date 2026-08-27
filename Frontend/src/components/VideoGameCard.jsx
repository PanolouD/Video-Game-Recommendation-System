import "../css/VideoGameCard.css"

function VideoGameCard({image, title, genre, rating}) {
    return  <div className="videogame-card">
       
            <div className="videogame-poster">
                <img  src={image} alt={title}/>

            </div>

       
        <div className="videogame-info">
            <h3>{title}</h3>
            <p className="videogame-genre">{genre}</p>
            <p className="videogame-rating">⭐ {rating}</p>
        </div>    
    </div>
    
}

export default VideoGameCard;