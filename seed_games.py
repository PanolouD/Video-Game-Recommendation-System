import asyncio
import json
import logging
import sys
from pathlib import Path
from igdb_client import fetch_games, get_full_game_details, get_cover_url, get_genre_names, get_platform_names, get_game_mode_names, get_player_perspective_names, get_theme_names
from database import AsyncSessionLocal
from models import Game
from sqlalchemy import select

# Δημιουργεί φάκελο logs/ αν δεν υπάρχει
LOG_DIR = Path(__file__).parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

# Ρυθμίζει logging: γράφει σε αρχείο και στην οθόνη
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        # Γράφει σε αρχείο (logs/seed.log)
        logging.FileHandler(LOG_DIR / "seed.log", encoding="utf-8"),
        # Γράφει στην οθόνη (console)
        logging.StreamHandler(),
    ],
)

logger = logging.getLogger(__name__)

def list_to_json(value):
    if not value:
        return None
    return json.dumps(value, ensure_ascii=False) # ensure_ascii=False: αποθήκευσε Ελληνικά, Ιαπωνικά, emoji κλπ χωρίς Unicode escapes (\uXXXX)


def game_to_db_game(igdb_game: dict) -> Game:
    return Game(
        igdb_id=igdb_game["id"],
        name=igdb_game["name"],
        genres=list_to_json(get_genre_names(igdb_game.get("genres", []))),
        platforms=list_to_json(get_platform_names(igdb_game.get("platforms", []))),
        game_modes=list_to_json(get_game_mode_names(igdb_game.get("game_modes", []))),
        player_perspectives=list_to_json(get_player_perspective_names(igdb_game.get("player_perspectives", []))),
        themes=list_to_json(get_theme_names(igdb_game.get("themes", []))),
        summary=igdb_game.get("summary"),
        storyline=igdb_game.get("storyline"),
        rating=igdb_game.get("rating"),
        rating_count=igdb_game.get("rating_count"),
        total_rating=igdb_game.get("total_rating"),
        total_rating_count=igdb_game.get("total_rating_count"),
        cover_url=get_cover_url(igdb_game.get("cover")), # Ωστε το id του image να γινεται url
    )
 

async def seed_games(limit: int = 500) -> None:
    logger.info(f"Fetching {limit} games from IGDB...")
    igdb_games = fetch_games(limit=limit)
    if not igdb_games:
        logger.error("No games fetched from IGDB.")
        return
    logger.info(f"Fetched {len(igdb_games)} games from IGDB.")
    
    async with AsyncSessionLocal() as session:
        inserted = 0
        skipped = 0
        for igdb_game in igdb_games:
            try:
                # Check if game already exists
                existing = await session.scalar(
                    select(Game).where(Game.igdb_id == igdb_game["id"])
                )
                if existing:
                    if not existing.cover_url and igdb_game.get("cover"):
                        existing.cover_url = get_cover_url(igdb_game["cover"])
                        logger.info(f"Updated cover: {existing.name}")
                    else:    
                        skipped += 1
                        logger.debug(f"Skipped: {igdb_game['name']} (already exists)")
                    continue
                # Convert to Game model
                db_game = game_to_db_game(igdb_game)
                session.add(db_game)
                inserted += 1
                logger.info(f"Inserted: {igdb_game['name']} (IGDB ID: {igdb_game['id']})")
            except Exception as e:
                logger.error(f"Error processing game {igdb_game.get('name', 'Unknown')}: {e}")
                continue
        
        await session.commit()
        logger.info(f"Done! Inserted {inserted} games. Skipped {skipped} games.")


if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(seed_games(limit=500))