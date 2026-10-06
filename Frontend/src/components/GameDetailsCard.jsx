import { useEffect, useState } from "react";

import LibraryButton from "./LibraryButton";

import "../css/GameDetailsCard.css";

function formatReleaseDate(value) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    }).format(date);
}

const storePriority = [
    "Steam",
    "GOG",
    "Epic",
    "PlayStation",
    "Xbox",
    "Nintendo",
    "Android",
    "iPhone",
];

// Επιλεγει με προτεραιοτητα ποιο store link θα δωσει
function getPreferredWebsite(websites) {
    if (!Array.isArray(websites)) {
        return null;
    }

    const validWebsites = websites.filter(
        (website) => website?.url?.startsWith("https://") || website?.url?.startsWith("http://")
    );

    for (const storeName of storePriority) {
        const matchingWebsite = validWebsites.find((website) => website.type?.toLowerCase().includes(storeName.toLowerCase()));

        if (matchingWebsite) {
            return matchingWebsite;
        }
    }

    return (
        validWebsites.find((website) => website.type?.toLowerCase().includes("official")) || null
    );
}


function GameDetailsCard({ game, matchScore, rank }) {
    
    const [activeMedia, setActiveMedia] = useState({
        type: "cover",
        index: 0,
    });

    useEffect(() => {
        setActiveMedia({type: game?.cover_url ? "cover" : "image", index: 0,});
    }, [game?.id]);
    
    if (!game) {
        return null;
    }

    const coverUrl = game.cover_url
        ? game.cover_url.replace("/t_thumb/", "/t_cover_big/")
        : null;

    const screenshots = Array.isArray(game.screenshots)
        ? game.screenshots.slice(0, 3).map((screenshot) => screenshot.replace("/t_thumb/", "/t_screenshot_big"))
        : [];

    const selectedScreenshot = screenshots[activeMedia.index] || screenshots[0] || null;

    const activeImage = activeMedia.type === "cover"
        ? coverUrl
        : selectedScreenshot || coverUrl;

    const genres = Array.isArray(game.genres)
        ? game.genres
        : [];

    const themes = Array.isArray(game.themes)
        ? game.themes
        : [];

    const platforms = Array.isArray(game.platforms)
        ? game.platforms
        : [];

    const gameModes = Array.isArray(game.game_modes)
        ? game.game_modes
        : [];

    const perspectives = Array.isArray(game.player_perspectives)
        ? game.player_perspectives
        : [];

    const developers = Array.isArray(game.developers)
        ? game.developers
        : [];

    const publishers = Array.isArray(game.publishers)
        ? game.publishers
        : [];

    const ageRatings = Array.isArray(game.age_ratings)
        ? game.age_ratings
        : [];

    const displayedAgeRatings = ageRatings.filter(
        (ageRating) =>
            ageRating.organization === "PEGI" ||
            ageRating.organization === "ESRB"
    );

    const similarGames = Array.isArray(game.similar_games)
        ? game.similar_games.slice(0,6)
        : [];

    const preferredWebsite = getPreferredWebsite(game.websites);

    const rating = game.rating != null
        ? (game.rating / 10).toFixed(1)
        : "N/A";

    const releaseDate =
        game.first_release_date ||
        game.release_date ||
        game.release_dates?.[0]?.date ||
        null;

    const formattedReleaseDate = formatReleaseDate(releaseDate);

    return (
        <article className="game-details-card">

            <div className="game-details-left-column">

                <div className="game-details-media-viewer">
                    {activeMedia.type === "trailer" &&
                    game.trailer_video_id ? (
                        <iframe
                            src={
                                `https://www.youtube.com/embed/` +
                                `${game.trailer_video_id}`
                            }
                            title={`${game.name} trailer`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : activeImage ? (
                        <img
                            className={
                                activeMedia.type === "cover"
                                    ? "game-details-active-cover"
                                    : "game-details-active-screenshot"
                            }
                            src={activeImage}
                            alt={
                                activeMedia.type === "cover"
                                    ? `${game.name} cover`
                                    : `${game.name} screenshot`
                            }
                        />
                    ) : (
                        <div className="game-details-no-image">
                            No image available
                        </div>
                    )}
                </div>

                {(screenshots.length > 0 || game.trailer_video_id) && (
                    <div className="game-details-media-options">

                        {coverUrl && (
                            <button
                                type="button"
                                className={
                                    activeMedia.type === "cover"
                                        ? "media-option cover-option selected"
                                        : "media-option cover-option"
                                }
                                onClick={() =>
                                    setActiveMedia({
                                        type: "cover",
                                        index: 0,
                                    })
                                }
                                aria-label={`Show ${game.name} cover`}
                            >
                                <img
                                    src={coverUrl}
                                    alt={`${game.name} cover`}
                                />

                                <span className="media-option-label">
                                    Cover
                                </span>
                            </button>
                        )}

                        {screenshots.map((screenshot, index) => (
                            <button
                                type="button"
                                key={screenshot}
                                className={
                                    activeMedia.type === "image" &&
                                    activeMedia.index === index
                                        ? "media-option selected"
                                        : "media-option"
                                }
                                onClick={() =>
                                    setActiveMedia({
                                        type: "image",
                                        index: index,
                                    })
                                }
                                aria-label={`Show screenshot ${index + 1}`}
                            >
                                <img
                                    src={screenshot}
                                    alt={`${game.name} screenshot ${index + 1}`}
                                />
                            </button>
                        ))}

                        {game.trailer_video_id && (
                            <button
                                type="button"
                                className={
                                    activeMedia.type === "trailer"
                                        ? "media-option trailer-option selected"
                                        : "media-option trailer-option"
                                }
                                onClick={() =>
                                    setActiveMedia({
                                        type: "trailer",
                                        index: 0,
                                    })
                                }
                                aria-label={`Play ${game.name} trailer`}
                            >
                                <img
                                    src={
                                        `https://img.youtube.com/vi/` +
                                        `${game.trailer_video_id}/mqdefault.jpg`
                                    }
                                    alt={`${game.name} trailer`}
                                />

                                <span
                                    className="trailer-play-icon"
                                    aria-hidden="true"
                                >
                                    ▶
                                </span>
                            </button>
                        )}

                    </div>
                )}

                {similarGames.length > 0 && (
                    <section className="game-details-similar">
                        <h3>Similar games</h3>

                        <div className="game-details-similar-grid">
                            {similarGames.map((similarGame) => (
                                <article
                                    className="game-details-similar-item"
                                    key={
                                        similarGame.igdb_id ||
                                        similarGame.name
                                    }
                                >
                                    {similarGame.cover_url ? (
                                        <img
                                            src={similarGame.cover_url.replace(
                                                "/t_thumb/",
                                                "/t_cover_big/"
                                            )}
                                            alt={`${similarGame.name} cover`}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="similar-game-no-cover">
                                            No cover
                                        </div>
                                    )}

                                    <p>{similarGame.name}</p>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

            </div>    

                <div className="game-details-content">
                    <div className="game-details-top-row">
                        {rank != null && (
                            <span className="game-details-rank">
                                #{rank}
                            </span>
                        )}

                        {matchScore != null && (
                            <span className="game-details-match">
                                {Math.round(matchScore * 100)}% match
                            </span>
                        )}
                    </div>

                    <h2>{game.name}</h2>

                    <div className="game-details-rating">
                        <span>⭐ {rating}</span>

                        {game.rating_count != null && (
                            <span>
                                {game.rating_count.toLocaleString()} ratings
                            </span>
                        )}
                    </div>

                    {genres.length > 0 && (
                        <div className="game-details-tags">
                            {genres.map((genre) => (
                                <span key={genre}>{genre}</span>
                            ))}
                        </div>
                    )}

                    {game.summary && (
                        <section className="game-details-section">
                            <h3>Summary</h3>
                            <p>{game.summary}</p>
                        </section>
                    )}

                    <dl className="game-details-metadata">
                        
                        {displayedAgeRatings.length > 0 && (
                            <>
                                <dt>Age ratings</dt>

                                <dd className="game-details-age-ratings">
                                    {displayedAgeRatings.map((ageRating) => (
                                        <span
                                            key={
                                                `${ageRating.organization}-` +
                                                `${ageRating.rating}`
                                            }
                                        >
                                            {ageRating.organization}{" "}
                                            {ageRating.rating}
                                        </span>
                                    ))}
                                </dd>
                            </>
                        )}

                    
                        
                        {formattedReleaseDate && (
                            <>
                                <dt>Release date</dt>

                                <dd>
                                    <time dateTime={releaseDate}>
                                        {formattedReleaseDate}
                                    </time>
                                </dd>
                            </>
                        )}

                        {platforms.length > 0 && (
                            <>
                                <dt>Platforms</dt>
                                <dd>{platforms.join(", ")}</dd>
                            </>
                        )}

                        {themes.length > 0 && (
                            <>
                                <dt>Themes</dt>
                                <dd>{themes.join(", ")}</dd>
                            </>
                        )}

                        {gameModes.length > 0 && (
                            <>
                                <dt>Game modes</dt>
                                <dd>{gameModes.join(", ")}</dd>
                            </>
                        )}

                        {perspectives.length > 0 && (
                            <>
                                <dt>Perspective</dt>
                                <dd>{perspectives.join(", ")}</dd>
                            </>
                        )}

                        {developers.length > 0 && (
                            <>
                                <dt>Developer</dt>
                                <dd>{developers.join(", ")}</dd>
                            </>
                        )}

                        {publishers.length > 0 && (
                            <>
                                <dt>Publisher</dt>
                                <dd>{publishers.join(", ")}</dd>
                            </>
                        )}
                    </dl>

                    <div className="game-details-actions">
                        {preferredWebsite && (
                            <a
                                className="game-details-store-link"
                                href={preferredWebsite.url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View on {preferredWebsite.type}
                                <span aria-hidden="true"> ↗</span>
                            </a>
                        )}

                        <LibraryButton gameId={game.id} />
                    </div>    

                    {game.storyline && (
                        <details className="game-details-storyline">
                            <summary>Read storyline</summary>
                            <p>{game.storyline}</p>
                        </details>
                    )}


                </div>
        </article>
    );
}

export default GameDetailsCard;