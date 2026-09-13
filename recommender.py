# We import 'pandas' to manage our game database in a neat table format (like a spreadsheet)
import pandas as pd
import json
import models
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def parse_json_list(value):
    if not value:
        return []
    if isinstance(value, str):
        return json.loads(value)
    return value


def recommend_games(genres, platforms, game_modes, player_perspectives, games, top_n=10):
    filtered_games = []

    for game in games:
        # Filter by genres, platforms, game_modes, player_perspectives
        if game_matches_preferences(
            game=game,
            genres=genres,
            platforms=platforms,
            game_modes=game_modes,
            player_perspectives=player_perspectives,
        ):
            filtered_games.append(game)

    if not filtered_games:
        return []

    # Create user preference text for TF-IDF
    user_preference_text = create_user_text(
        genres=genres,
        platforms=platforms,
        game_modes=game_modes,
        player_perspectives=player_perspectives,
    )

    # Create game texts for TF-IDF
    game_texts = []
    for game in filtered_games:
        game_texts.append(create_game_text(game))

    tfidf_vectorizer = TfidfVectorizer() #Δημιουργούμε τον vectorizer.
    game_matrix = tfidf_vectorizer.fit_transform(game_texts) #Εδώ γίνονται δύο πράγματα με το fit o vectorizer μαθαίνει ποιες λέξεις υπάρχουν στα game texts και με το transform
    # μετατρέπουμε τον χρήστη σε vector.
    user_vector = tfidf_vectorizer.transform([user_preference_text])
    tfidf_scores = cosine_similarity(user_vector, game_matrix).flatten() #Υπολογίζουμε similarity. Η cosine_similarity συγκρίνει το user vector με κάθε game vector.  
    #Το .flatten() μετατρέπει το αποτέλεσμα από matrix σε απλή λίστα αριθμών.

    # Calculate final scores
    recommendations = []
    for index, game in enumerate(filtered_games): #Το enumerate(filtered_games) μας δίνει δύο πράγματα σε κάθε επανάληψη, τη θέση του στοιχείου, την τιμή του στοιχείου. Το game παίρνει την επόμενη τιμή από τη λίστα filtered_games σε κάθε επανάληψη και το index είναι ο αριθμός θέσης/μετρητής του συγκεκριμένου score.
        score = calculate_game_score(
            game=game,
            user_genres=genres,
            user_platforms=platforms,
            user_game_modes=game_modes,
            user_player_perspectives=player_perspectives,
            tfidf_score=float(tfidf_scores[index]),
        )
        recommendations.append(
            {
                "game": game,
                "score": score,
            }
        )

    recommendations.sort(
        key=lambda recommendation: recommendation["score"],
        reverse=True,
    )#Το key=lambda recommendation: recommendation["score"] λέει ποια τιμή θα χρησιμοποιηθεί για την ταξινόμηση.

    print("Games after filtering:", len(filtered_games))
    return recommendations[:top_n]

def create_game_text(game):
    """Δημιουργεί text representation ενος game για το tfidf."""
    genres_list = parse_json_list(game.genres)
    platforms_list = parse_json_list(game.platforms)
    game_modes_list = parse_json_list(game.game_modes)
    player_perspectives_list = parse_json_list(game.player_perspectives)

    # Μετατροπη των lists σε space-separated strings.
    if genres_list:
        genres_str = " ".join(genres_list)
    else:
        genres_str = ""

    if platforms_list:
        platforms_str = " ".join(platforms_list)
    else:
        platforms_str = ""

    if game_modes_list:
        game_modes_str = " ".join(game_modes_list)
    else:
        game_modes_str = ""

    if player_perspectives_list:
        player_perspectives_str = " ".join(player_perspectives_list)
    else:
        player_perspectives_str = ""
    
    return " ".join(
        [
            str(game.name or ""),
            genres_str,
            platforms_str,
            game_modes_str,
            player_perspectives_str,
        ]
    )

def create_user_text(genres, platforms, game_modes, player_perspectives):
    """Δημιουργεί text representation του user preference για το tfidf"""
    user_parts = [
        *genres,
        *platforms,
        *game_modes,
        *player_perspectives,
    ]

    return " ".join(user_parts)


def game_matches_preferences(
    game,
    genres,
    platforms,
    game_modes,
    player_perspectives,
):
    # Check genres if user has preferences
    if genres and not matches_any(game.genres, genres):
        return False

    # Check platforms if user has preferences
    if platforms and not matches_any(game.platforms, platforms):
        return False

    # Check game_modes if user has preferences
    if game_modes and not matches_any(game.game_modes, game_modes):
        return False

    # Check player_perspectives if user has preferences
    if player_perspectives and not matches_any(game.player_perspectives, player_perspectives):
        return False

    return True

def matches_any(game_json, user_preferences):
    """Ελεγχει αν το json list ενος game ταιριαζει σε κάποιο/α απο τα user preferences."""
    game_list = parse_json_list(game_json)
    if not game_list:
        return False

    # Normalize to lowercase
    game_list_lower = []
    for item in game_list:
        game_list_lower.append(item.lower())
        
    user_prefs_lower = []
    for pref in user_preferences:
        user_prefs_lower.append(pref.lower())

    # Check for matches
    for user_pref in user_prefs_lower:
        for game_item in game_list_lower:
            if user_pref in game_item or game_item in user_pref:
                return True

    return False


def calculate_game_score(
    game,
    user_genres,
    user_platforms,
    user_game_modes,
    user_player_perspectives,
    tfidf_score,
):
    genre_score = calculate_match_score(game.genres, user_genres)
    platform_score = calculate_match_score(game.platforms, user_platforms)
    game_mode_score = calculate_match_score(game.game_modes, user_game_modes)
    player_perspective_score = calculate_match_score(game.player_perspectives, user_player_perspectives)

    # Weighted average
    rule_score = (
        0.35 * genre_score +
        0.30 * platform_score +
        0.20 * game_mode_score +
        0.15 * player_perspective_score
    )

    # Combine with tfidf
    final_score = (0.70 * rule_score + 0.30 * tfidf_score)
    return final_score

def calculate_match_score(game_json, user_preferences):
    """Calculate match score (0-1) between game's list and user preferences."""
    if not user_preferences:
        return 0.5  # No preference = neutral score

    game_list = parse_json_list(game_json)
    if not game_list:
        return 0.0

    game_list_lower = []
    for item in game_list:
        game_list_lower.append(item.lower())
            
    user_prefs_lower = []
    for pref in user_preferences:
        user_prefs_lower.append(pref.lower())
    

    # Count matches
    matches = 0
    for user_pref in user_prefs_lower:
        for game_item in game_list_lower:
            if user_pref in game_item or game_item in user_pref:
                matches += 1
                break

    # Score = percentage of user preferences that match
    return matches / len(user_preferences)


async def get_games_from_db(db: AsyncSession):
    """Fetch all games from database."""
    result = await db.execute(select(models.Game))
    return list(result.scalars().all())