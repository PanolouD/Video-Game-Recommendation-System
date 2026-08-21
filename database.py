## database.py
#from sqlalchemy import create_engine
#from sqlalchemy.orm import DeclarativeBase, sessionmaker

## database.py imports (async)
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from config import settings



engine = create_async_engine(settings.database_url) #Εδώ είναι η σύνδεση με το database.

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
) #Εδώ δημιουργόυνται database sessions. To autocommit και το autoflush είναι False γιατί θέλουμε να ελέγχουμε τις αλλαγές που γίνονται commited.


class Base(DeclarativeBase):
    pass


async def get_db(): #Εδώ η συνάρτηση παρέχει sessions στα routes μας.
    async with AsyncSessionLocal() as session: #Αυτή η εντολή κάνει το session να δουλεύει σαν ένα context manager, δηλαδή σαν να ανοίγουμε έναν φάκελο. Αυτό εξασφαλίζει καθάρισμα ακόμη και αν ένα error προκύψει.
        yield session