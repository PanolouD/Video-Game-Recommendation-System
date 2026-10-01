import requests #για HTTP requests
from datetime import datetime, timedelta #για caching
from functools import lru_cache #Με το lru_cache μετά από request στο API αποθηκεύει το result
from config import settings

CLIENT_ID = settings.igdb_client_id
CLIENT_SECRET = settings.igdb_client_secret.get_secret_value()

_cached_token = None # κραταει το access token.
_token_expiry = None # κραταει το  πότε λήγει το token.
_cached_genre_map = None # κραταει το genre map.
_cached_platform_map = None # κραταει το platform map.
_cached_theme_map = None

def get_access_token():
    """Παίρνει νέο access token από IGDB."""
    url = "https://id.twitch.tv/oauth2/token"
    params = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials",
    }
    response = requests.post(url, params=params)
    data = response.json()
    return data["access_token"], data["expires_in"]

def get_access_token_cached():
    """Παίρνει access token από cache ή κάνει νέο request αν έχει λήξει."""
    global _cached_token, _token_expiry

    if _cached_token and _token_expiry and _token_expiry > datetime.now(): # Αν το token υπάρχει και δεν έχει λήξει.
        return _cached_token

    # Αλλιώς, πάρε νέο token.
    token, expires_in = get_access_token()
    _cached_token = token
    _token_expiry = datetime.now() + timedelta(seconds=expires_in)
    return _cached_token

def fetch_games(genre_id=None, offset=0, limit=500):
    token = get_access_token_cached()
    url = "https://api.igdb.com/v4/games"
    headers = {
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {token}",
    }
    fields = "fields name, genres, platforms, release_dates, rating, rating_count, total_rating, total_rating_count, cover, game_modes, player_perspectives, involved_companies.company, involved_companies.developer, involved_companies.publisher, themes, summary, storyline;"
    pagination = f"limit {limit}; offset {offset}; sort total_rating_count desc;"
    if genre_id:
        where = f"where genres = {genre_id};"
        query = f"{fields} {where} {pagination}"
    else:
        query = f"{fields} {pagination}"
    response = requests.post(url, headers=headers, data=query)
    return response.json()

def fetch_games_by_genre_name(genre_name, limit=500):

    # Βρες το genre ID από το name
    genre_map = get_genre_map_cached()
    genre_id = None
    for gid, gname in genre_map.items():
        if gname.lower() == genre_name.lower():
            genre_id = gid
            break

    if genre_id is None:
        return []

    return fetch_games(genre_id=genre_id, limit=limit)

def get_genre_map():
    """Παίρνει genre map (ID -> name) από IGDB."""
    token = get_access_token_cached()
    url = "https://api.igdb.com/v4/genres"
    headers = {
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {token}",
    }
    query = """
    fields name;
    limit 100;
    """
    response = requests.post(url, headers=headers, data=query)
    genres = response.json()
    result = {}
    for g in genres:
        result[g["id"]] = g["name"]
    return result

def get_genre_map_cached():
    """Παίρνει genre map από cache ή κάνει νέο request."""
    global _cached_genre_map

    if _cached_genre_map is None:
        _cached_genre_map = get_genre_map()

    return _cached_genre_map

def get_genre_names(genre_ids):
    genre_map = get_genre_map_cached()
    result = []
    for gid in genre_ids:
        result.append(genre_map.get(gid, f"Unknown ({gid})"))
    return result

def get_platform_map():
    """Παίρνει platform map (ID -> name) από IGDB."""
    token = get_access_token_cached()
    url = "https://api.igdb.com/v4/platforms"
    headers = {
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {token}",
    }
    query = """
    fields name;
    limit 500;
    """
    response = requests.post(url, headers=headers, data=query)
    platforms = response.json()
    result = {}
    for p in platforms:
        result[p["id"]] = p["name"]
    return result

def get_platform_map_cached():
    """Παίρνει platform map από cache ή κάνει νέο request."""
    global _cached_platform_map

    if _cached_platform_map is None:
        _cached_platform_map = get_platform_map()

    return _cached_platform_map

def get_platform_names(platform_ids):
    platform_map = get_platform_map_cached()
    result = []
    for pid in platform_ids:
        result.append(platform_map.get(pid, f"Unknown ({pid})"))
    return result

def get_game_companies(game_id):
    token = get_access_token_cached()
    headers = {
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {token}",
    }

    #Παίρνουμε τα involved_companies IDs από το game
    game_query = f"fields involved_companies; where id = {game_id};"
    game_response = requests.post("https://api.igdb.com/v4/games", headers=headers, data=game_query)
    games = game_response.json()
    if not games:
        return []

    involved_ids = games[0].get("involved_companies", [])
    if not involved_ids:
        return []

    ids_str = ",".join(map(str, involved_ids)) #Το IGDB API query language θέλει τα IDs ως comma-separated λίστα σε parentheses. Δεν δέχεται Python list. Αρα αν πχ [17436, 17769] το IGDB θέλει (17436, 17769).
    involved_query = f"fields company, developer, publisher; where id = ({ids_str});"
    involved_response = requests.post("https://api.igdb.com/v4/involved_companies", headers=headers, data=involved_query)
    involved_companies = involved_response.json()

    #Παίρνουμε τα ονόματα των companies
    company_ids = []
    for ic in involved_companies:
        if "company" in ic:
            company_ids.append(ic["company"])
    if not company_ids:
        return []
    company_ids_str = ",".join(map(str, company_ids))
    company_query = f"fields name; where id = ({company_ids_str});"
    company_response = requests.post("https://api.igdb.com/v4/companies", headers=headers, data=company_query)
    companies = company_response.json()

    #Combine τα data
    company_map = {}
    for c in companies:
        company_map[c["id"]] = c["name"]

    result = []
    for ic in involved_companies:
        company_id = ic.get("company")
        company_name = company_map.get(company_id, "Unknown")
        roles = []
        if ic.get("developer"):
            roles.append("developer")
        if ic.get("publisher"):
            roles.append("publisher")
        result.append({
            "name": company_name,
            "roles": roles,
        })

    return result

def get_main_developers(companies):
    result = []
    for c in companies:
        if "developer" in c["roles"]:
            result.append(c["name"])
    return result


def get_publishers(companies):
    result = []
    for c in companies:
        if "publisher" in c["roles"]:
            result.append(c["name"])
    return result

@lru_cache(maxsize=1)
def get_game_mode_map():
    """Φτιάχνει map game mode ID -> name."""
    token = get_access_token_cached()
    url = "https://api.igdb.com/v4/game_modes"
    headers = {
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {token}",
    }
    query = "fields name; limit 100;"
    response = requests.post(url, headers=headers, data=query)
    modes = response.json()
    result = {}
    for mode in modes:
        result[mode["id"]] = mode["name"]
    return result

def get_game_mode_names(mode_ids):
    """Μετατρέπει list mode IDs σε list mode names."""
    mode_map = get_game_mode_map()
    result = []
    for mid in mode_ids:
        result.append(mode_map.get(mid, f"Unknown ({mid})"))
    return result

@lru_cache(maxsize=1)
def get_player_perspective_map():
    """Φτιάχνει map player perspective ID -> name."""
    token = get_access_token_cached()
    url = "https://api.igdb.com/v4/player_perspectives"
    headers = {
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {token}",
    }
    query = "fields name; limit 100;"
    response = requests.post(url, headers=headers, data=query)
    perspectives = response.json()
    result = {}
    for p in perspectives:
        result[p["id"]] = p["name"]
    return result

def get_player_perspective_names(perspective_ids):
    """Μετατρέπει list perspective IDs σε list perspective names."""
    perspective_map = get_player_perspective_map()
    result = []
    for pid in perspective_ids:
        result.append(perspective_map.get(pid, f"Unknown ({pid})"))
    return result

def get_release_dates(release_date_ids):
    """Επιστρέφει τις ημερομηνίες κυκλοφορίας από IDs."""
    if not release_date_ids:
        return []
    
    token = get_access_token_cached()
    url = "https://api.igdb.com/v4/release_dates"
    headers = {
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {token}",
    }
    
    ids_str = ",".join(map(str, release_date_ids))
    query = f"fields human, platform, region; where id = ({ids_str});"
    response = requests.post(url, headers=headers, data=query)
    release_dates = response.json()
    
    result = []
    for rd in release_dates:
        result.append({
            "date": rd.get("human", "Unknown"),  # πχ 2024-05-15
            "platform": rd.get("platform"),  # Platform ID
            "region": rd.get("region"),  # Region ID
        })
    return result

def get_cover_url(cover_id):
    """Επιστρέφει το URL του cover image από ID."""
    if not cover_id:
        return None
    
    token = get_access_token_cached()
    url = "https://api.igdb.com/v4/covers"
    headers = {
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {token}",
    }
    
    query = f"fields url; where id = {cover_id};"
    response = requests.post(url, headers=headers, data=query)
    covers = response.json()
    
    if covers:
        url = covers[0].get("url", "")
        # Το IGDB επιστρέφει "//images.igdb.com/..." — πρόσθεσε "https:"
        if url.startswith("//"):
            url = "https:" + url
        return url
    return None

@lru_cache(maxsize=1)
def get_theme_map():
    """Φτιάχνει map theme ID -> name."""
    token = get_access_token_cached()
    url = "https://api.igdb.com/v4/themes"
    headers = {
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {token}",
    }
    query = "fields name; limit 100;"
    response = requests.post(url, headers=headers, data=query)
    themes = response.json()
    result = {}
    for theme in themes:
        result[theme["id"]] = theme["name"]
    return result


def get_theme_map_cached():
    """Παίρνει theme map από cache ή κάνει νέο request."""
    global _cached_theme_map
    
    if _cached_theme_map is None:
        _cached_theme_map = get_theme_map()
    
    return _cached_theme_map


def get_theme_names(theme_ids):
    """Μετατρέπει list theme IDs σε list theme names."""
    theme_map = get_theme_map_cached()
    result = []
    for tid in theme_ids:
        result.append(theme_map.get(tid, f"Unknown ({tid})"))
    return result

def get_full_game_details(game_id):
    """Επιστρέφει όλα τα data ενός game σε clean format."""
    # Φέρνουμε τα βασικά data
    token = get_access_token_cached()
    url = "https://api.igdb.com/v4/games"
    headers = {
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {token}",
    }
    fields = "fields name, genres, platforms, release_dates, rating, cover, game_modes, player_perspectives, involved_companies, themes, summary, storyline;"
    query = f"{fields} where id = {game_id};"
    response = requests.post(url, headers=headers, data=query)
    games = response.json()
    if not games:
        return None
    game = games[0]
    
    # Κάνουμε όλα τα conversions
    return {
        "id": game["id"],
        "name": game["name"],
        "genres": get_genre_names(game.get("genres", [])),
        "platforms": get_platform_names(game.get("platforms", [])),
        "release_dates": get_release_dates(game.get("release_dates", [])),
        "rating": game.get("rating"),
        "cover_url": get_cover_url(game.get("cover")),
        "game_modes": get_game_mode_names(game.get("game_modes", [])),
        "player_perspectives": get_player_perspective_names(game.get("player_perspectives", [])),
        "companies": get_game_companies(game["id"]),
        "themes": get_theme_names(game.get("themes", [])),
        "summary": game.get("summary"),
        "storyline": game.get("storyline"),
    }

if __name__ == "__main__":
    print("Testing IGDB client...")
    # Test access token
    token = get_access_token_cached()
    print(f"Token: {token[:20]}...")
    # Test genre map
    genre_map = get_genre_map_cached()
    print(f"Genres: {len(genre_map)} genres loaded")
    # Test platform map
    platform_map = get_platform_map_cached()
    print(f"Platforms: {len(platform_map)} platforms loaded")
    # Test game mode map
    mode_map = get_game_mode_map()
    print(f"Game modes: {len(mode_map)} modes loaded")
    # Test player perspective map
    perspective_map = get_player_perspective_map()
    print(f"Player perspectives: {len(perspective_map)} perspectives loaded")

    # Test fetch games
    game = get_full_game_details(1942)  # The Witcher 3
    print(f"Game: {game['name']}")
    print(f"Genres: {game['genres']}")
    print(f"Platforms: {game['platforms']}")
    print(f"Developers: {[c['name'] for c in game['companies'] if 'developer' in c['roles']]}")
    print(f"Cover: {game['cover_url']}")