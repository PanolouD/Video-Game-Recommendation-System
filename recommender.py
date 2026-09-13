# We import 'pandas' to manage our game database in a neat table format (like a spreadsheet)
import pandas as pd
import models
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sklearn.feature_extraction.text import TfidfVectorizer # μετατρέπει κείμενο σε αριθμητικά vectors.
from sklearn.metrics.pairwise import cosine_similarity #συγκρίνει δύο ή περισσότερα vectors και επιστρέφει πόσο μοιάζουν.

MODERN_YEAR = 2015

def recommend_games(genres, platforms, release_preference, rating_preference, games, top_n=10):
    filtered_games = []

    for game in games:
        if game_matches_user_genres(game, genres):
            filtered_games.append(game)

    if not filtered_games:
        return []
    
    user_preference_text = create_user_text(
        genres=genres,
        platforms=platforms,
        release_preference=release_preference,
        rating_preference=rating_preference,
    )# Tο user profile. 

    game_texts = []

    for game in filtered_games:
        game_texts.append(create_game_text(game))
    
    tfidf_vectorizer = TfidfVectorizer() #Δημιουργούμε τον vectorizer.
    
    game_matrix = tfidf_vectorizer.fit_transform(game_texts) #Εδώ γίνονται δύο πράγματα με το fit o vectorizer μαθαίνει ποιες λέξεις υπάρχουν στα game texts και με το transform 
    #μετατρέπει κάθε game text σε αριθμητικό vector.

    user_vector = tfidf_vectorizer.transform([user_preference_text]) # Μετατρέπουμε τον χρήστη σε vector.

    tfidf_scores = cosine_similarity(user_vector, game_matrix,).flatten() #Υπολογίζουμε similarity. Η cosine_similarity συγκρίνει το user vector με κάθε game vector. 
    #Το .flatten() μετατρέπει το αποτέλεσμα από matrix σε απλή λίστα αριθμών.

    recommendations = []

    #Εμφανίζω τα αποτελέσματα
    for index, game in enumerate(filtered_games): #Το enumerate(filtered_games) μας δίνει δύο πράγματα σε κάθε επανάληψη, τη θέση του στοιχείου, την τιμή του στοιχείου. Το game παίρνει την επόμενη τιμή από τη λίστα filtered_games σε κάθε επανάληψη και το index είναι ο αριθμός θέσης/μετρητής του συγκεκριμένου score.
        score = calculate_game_score(
            game=game,
            user_genres=genres,
            user_platforms=platforms,
            release_preference=release_preference,
            rating_preference=rating_preference,
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
    ) #Το key=lambda recommendation: recommendation["score"] λέει ποια τιμή θα χρησιμοποιηθεί για την ταξινόμηση.

    num_genres = len(genres) # ποσα genres εχουμε
    num_platforms = len(platforms) # ποσα platform εχουμε
    if num_genres > 0:
        per_genre = top_n // num_genres
    else:
        per_genre = top_n

    if num_platforms > 0:
        per_platform = top_n // num_platforms
    else:
        per_platform = top_n

    selected_by_genre = []

    for genre in genres:
        genre_normalized = genre.strip().lower()
        games_for_this_genre = []
        for rec in recommendations:
            game_genre = (rec["game"].genre or "").strip().lower()
            if game_genre == genre_normalized:
                games_for_this_genre.append(rec) # Παίρνει μόνο games με αυτό το genre.
        selected_by_genre.extend(games_for_this_genre[:per_genre]) # Πάρε τα πρώτα per_genre games

    selected_by_platform = []

    for platform in platforms:
        platform_normalized = platform.strip().lower()
        games_for_this_platform = []
        for rec in recommendations:
            game_platform = (rec["game"].platform or "").strip().lower()
            if game_platform == platform_normalized:
                games_for_this_platform.append(rec) # Παίρνει  μόνο games με αυτή την platform
        selected_by_platform.extend(games_for_this_platform[:per_platform]) # Πάρε τα πρώτα per_platform games

    final_candidates = {} # Θα είναι η λίστα με τα επιλεγμένα games χωρίς διπλότυπα.
    for rec in selected_by_genre + selected_by_platform:
        game_id = rec["game"].id
        if game_id not in final_candidates:
            final_candidates[game_id] = rec

    final_recommendations = sorted(
        final_candidates.values(),
        key=lambda rec: rec["score"],
        reverse=True,
    )

    print("Games after genre filter:", len(filtered_games))
    return final_recommendations[:top_n]

def create_game_text(game):
    return " ".join(
        [
            str(game.name or""),
            str(game.platform or""),
            str(game.genre or""),
            str(game.publisher or""),
            str(game.developer or""),
            str(game.rating or""),
            str(game.year_of_release or""),
        ]
    )

def create_user_text(
        genres,
        platforms,
        release_preference,
        rating_preference,
):
    user_parts = [
        *genres, # Αυτό σημαινει οτι αν εχουμε genres = ["Action", "Racing"] το *genres βάζει τα στοιχεία της λίστας ξεχωριστά μέσα στη νέα λίστα. Έτσι το  " ".join(...) μπορεί να ενώσει όλα τα στοιχεία σε ένα κείμενο.
        *platforms,
        str(release_preference or ""),
        str(rating_preference or ""),
    ]

    return " ".join(user_parts)

def calculate_release_score(game_year, release_preference,):
    if game_year is None:
        return 0.0

    if release_preference == "both":
        return 1.0

    if release_preference == "modern":
        if game_year >= MODERN_YEAR:
            return 1.0
        return 0.0

    if release_preference == "classic":
        if game_year < MODERN_YEAR:
            return 1.0
        return 0.0

    return 0.0

def calculate_rating_score(game_rating, rating_preference,):
    if game_rating is None:
        return 0.0

    if rating_preference is None:
        return 0.0

    if game_rating.strip().lower() == (rating_preference.strip().lower()):
        return 1.0
    
    return 0.0

def calculate_genre_score(game_genre, user_genres,):
    if game_genre is None:
        return 0.0

    if not user_genres:
        return 0.0

    game_genre = game_genre.strip().lower()

    for genre in user_genres:
        normalized_user_genres = genre.strip().lower()

    if normalized_user_genres in game_genre:
        return 1.0
    
    return 0.0

def game_matches_user_genres(game, user_genres):
    if not user_genres:
        return True

    if game.genre is None:
        return False

    game_genre = game.genre.strip().lower()

    for genre in user_genres:
        if genre.strip().lower() in game_genre:
            return True

    return False

def calculate_platform_score(game_platform, user_platforms,):
    if game_platform is None:
        return 0.0

    if not user_platforms:
        return 0.0

    game_platform = game_platform.strip().lower()

    for platform in user_platforms:
        normalized_user_platforms = platform.strip().lower()

    if normalized_user_platforms in game_platform:
        return 1.0
    
    return 0.0

def calculate_game_score(game, user_genres, user_platforms, release_preference, rating_preference, tfidf_score,):
    genre_score = calculate_genre_score(game_genre=game.genre, user_genres=user_genres)
    platform_score = calculate_platform_score(game_platform=game.platform, user_platforms=user_platforms)
    release_score = calculate_release_score(game_year=game.year_of_release, release_preference=release_preference)
    rating_score = calculate_rating_score(game_rating=game.rating, rating_preference=rating_preference)
    rule_score = (0.40 * genre_score + 0.30 * platform_score + 0.15 * release_score + 0.15 * rating_score)
    final_score = (0.70 * rule_score + 0.30 * tfidf_score)
    return final_score

async def get_games_from_db(db: AsyncSession):
    result = await db.execute(select(models.Game))
    return list(result.scalars().all())