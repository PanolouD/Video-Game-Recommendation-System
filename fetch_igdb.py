import requests
import csv

CLIENT_ID = "lrz5436iurz8ue6oz6bp3orznqqq0e"
CLIENT_SECRET = "aifzmhomywszkup8uw6sss6kx4s4ya"

def get_access_token():
    url = "https://id.twitch.tv/oauth2/token"
    params = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials",
    }
    response = requests.post(url, params=params)
    data = response.json()
    return data["access_token"]

def fetch_games(access_token, offset=0, limit=500):
    url = "https://api.igdb.com/v4/games"
    headers = {
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {access_token}",
    }
    query = f"""
    fields name, genres, platforms, release_dates, rating, cover;
    limit {limit};
    offset {offset};
    """
    response = requests.post(url, headers=headers, data=query)
    return response.json()

def fetch_all_games():
    access_token = get_access_token()
    genre_map = get_genre_map(access_token)
    platform_map = get_platform_map(access_token)
    all_games = []
    offset = 0
    limit = 500

    while True:
        games = fetch_games(access_token, offset=offset, limit=limit)
        if not games:
            break
        all_games.extend(games)
        offset += limit

    save_to_csv(all_games, genre_map, platform_map)

    return all_games

def get_genre_map(access_token):
    """Επιστρέφει dict {genre_id: genre_name}"""
    url = "https://api.igdb.com/v4/genres"
    headers = {
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {access_token}",
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

def get_platform_map(access_token):
    """Επιστρέφει dict {platform_id: platform_name}"""
    url = "https://api.igdb.com/v4/platforms"
    headers = {
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {access_token}",
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


def save_to_csv(games, genre_map, platform_map, filename="igdb_games.csv"):
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["name","genre","platform","year_of_release","rating"])

        for game in games:
            name = game.get("name","")
            genre_ids = game.get("genres", [])
            platform_ids = game.get("platforms", [])
            release_dates = game.get("release_dates", [])
            rating = game.get("rating", "")

            year_of_release =""
            if release_dates:
                first_release = release_dates[0]
                if isinstance(first_release, dict):
                    year_of_release = first_release.get("year", "")
                else:
                    year_of_release = first_release

            genres_list = []
            for gid in genre_ids:
                if gid in genre_map:
                    genres_list.append(genre_map.get(gid, ""))
            genres = ", ".join(genres_list)

            platform_list = []
            for pid in platform_ids:
                if pid in platform_map:
                    platform_list.append(platform_map.get(pid, ""))
            platforms = ", ".join(platform_list)

            writer.writerow([name, genres, platforms,year_of_release, rating])

if __name__ == "__main__":
    print("Fetching games from IGDB.")
    games = fetch_all_games()
    print(f"Fetched {len(games)} games.")
    print("Saved to igdb_games.csv")