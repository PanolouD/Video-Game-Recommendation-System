import asyncio
from pathlib import Path # βρίσκει το CSV χωρίς να γράψεις απόλυτο path στον υπολογιστή σου.
import pandas as pd
from sqlalchemy import select, func # Η func είναι ένας τρόπος να καλέσεις συναρτήσεις της βάσης από Python, αντί να γράψεις raw SQL. Δεν μετράει η ίδια τα rows στη Python, φτιάχνει το αντίστοιχο κομμάτι SQL.
from database import AsyncSessionLocal
from models import Game
import sys

CSV_PATH = Path(__file__).parent / "Video_Games.csv" # Η γραμμή αυτη σημαίνει: «πάρε τον φάκελο όπου βρίσκεται αυτό το script και εκεί ψάξε το Video_Games.csv».  

MAX_STRING_LENGTH = 255

def clean_text(value):
    if pd.isna(value): # ελέγχει: «αυτή η τιμή λείπει;»
        return None

    text = str(value).strip() # κάνουμε την value string και μετά αφαιρούμε τα κενά από την αρχή και το τέλος.
    if text == "" or text.lower() == "nan":
        return None

    return text[:MAX_STRING_LENGTH]

def clean_int(value):
    if pd.isna(value):
        return None

    text = str(value).strip()
    if text == "" or text.lower() in {"nan","tbd"}:
        return None

    return int(float(text))

def clean_float(value):
    if pd.isna(value):
        return None

    text = str(value).strip()
    if text == "" or text.lower() in {"nan","tbd"}:
        return None

    return float(text)

def row_to_game(row: pd.Series) -> Game | None:
    name = clean_text(row.get("Name"))
    if name is None:
        return None

    return Game(
        name=name,
        platform=clean_text(row.get("Platform")),
        year_of_release=clean_int(row.get("Year_of_Release")),
        genre=clean_text(row.get("Genre")),
        publisher=clean_text(row.get("Publisher")),
        global_sales=clean_float(row.get("Global_Sales")),
        critic_score=clean_float(row.get("Critic_Score")),
        critic_count=clean_int(row.get("Critic_Count")),
        user_score=clean_float(row.get("User_Score")),
        user_count=clean_int(row.get("User_Count")),
        developer=clean_text(row.get("Developer")),
        rating=clean_text(row.get("Rating")),
    )

async def seed_games() -> None:
    df = pd.read_csv(CSV_PATH)

    async with AsyncSessionLocal() as session:
        existing = await session.scalar(select(func.count()).select_from(Game))
        if existing:
            print(f"Skipped. The games table already has {existing} rows.")
            return

        games = []
        skipped = 0

        for _, row in df.iterrows(): # Το df.iterrows() δίνει μία-μία τις γραμμές. Το _ είναι ο αριθμός γραμμής του pandas και δεν μας χρειάζεται. Το row είναι τα δεδομένα.
            game = row_to_game(row)
            if game is None:
                skipped += 1
                continue
            games.append(game)

        session.add_all(games)
        await session.commit()

        print(f"Inserted {len(games)} games. Skipped {skipped} rows without a name.")

# Κάθε αρχείο Python έχει μια ειδική μεταβλητή __name__ αν το τρέξεις απευθείας: python seed_games.py τότε __name__ γίνεται "__main__". 
# Αν κάποιο άλλο αρχείο το κάνει import seed_games, τότε __name__ γίνεται "seed_games".
# Άρα ο έλεγχος σημαίνει: Τρέξε τον κώδικα μόνο όταν ανοίγω αυτό το αρχείο ως πρόγραμμα, όχι όταν το εισάγει κάποιος άλλος. 
if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy()) ## Στα Windows, το asyncio.run() ανοίγει από προεπιλογή ProactorEventLoop. Ο async driver psycopg δεν δουλεύει με αυτό το loop. Θέλει SelectorEventLoop. Αυτό λέει: «στα Windows, πριν μιλήσουμε στη PostgreSQL, χρησιμοποίησε το loop που δέχεται ο psycopg». 
    asyncio.run(seed_games()) 