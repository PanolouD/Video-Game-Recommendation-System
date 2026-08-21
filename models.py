## models.py
from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class User(Base):
    __tablename__ = "users" #Αυτό δημιουργείται για να πει στην sqlalchemy ποιο είναι το όνομα του table.  

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    image_file: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
        default=None,
    )#Εδώ πέρα αποθηκεύουμε μόνο το όνομα του αρχείου που δίνεται στα images μας. 
    #Δεν παίρνει ολόκληρο το path, αποσυνδέει το database μας με την δομή αρχείων μας ώστε αν επιλέξουμε να κάνουμε αναδιοργάνωση των αρχείων μας αργότερα
    #και να αλλάξουμε τα ονόματα μερικών directories τοτε δεν θα χρειαστεί να κάνουμε update το database. 

    ## User.reset_tokens relationship
    reset_tokens: Mapped[list[PasswordResetToken]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )#ακολουθει τον ιδιο σκεπτικο οπως το posts από πάνω αλλα για τα reset_tokens.

    @property
    def image_path(self) -> str:
        if self.image_file:
            return f"/media/profile_pics/{self.image_file}"
        return "/static/profile_pics/default.jpg"
    #Η παραπάνω συνάρτηση λέει αν ένας χρήστης έχει ένα uploaded custom image τότε θα επιστρέψουμε αυτό το image από αυτό το path /media/profile_pics. 
    #Αλλά αν δεν έχουν uploaded image τοτε το επιστρέφουμε απο το path /static/profile_pics/default.jpg. 
    #Ετσι στην ουσία ξεχωρίζουμε το static υλικο της εφαρμογης μας από τα media που οι χρήστες κάνουν upload.

    #Με το uselist = False γιατι η SQLAlchemy συχνά καταλαβαίνει ότι το UserPreference είναι ένα αντικείμενο επειδή το user_id είναι unique. 
    #Το uselist=False δηλώνει ξεκάθαρα: User → ένα UserPreference. Χωρίς αυτό, υπάρχει περίπτωση να το χειριστεί σαν λίστα
    user_preference: Mapped[UserPreference] = relationship(back_populates="user", cascade="all, delete-orphan", uselist=False)
    user_preference_genres: Mapped[list[UserPreferenceGenre]] = relationship(back_populates="user", cascade="all, delete-orphan")
    user_preference_platforms: Mapped[list[UserPreferencePlatform]] = relationship(back_populates="user", cascade="all, delete-orphan")

## PasswordResetToken model
class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
    )

    user: Mapped[User] = relationship(back_populates="reset_tokens")

class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    platform: Mapped[str | None] = mapped_column(String(255), nullable=True)
    year_of_release: Mapped[int | None] = mapped_column(Integer, nullable=True)
    genre: Mapped[str | None] = mapped_column(String(255), nullable=True)
    publisher: Mapped[str | None] = mapped_column(String(255), nullable=True)
    global_sales: Mapped[float | None] = mapped_column(Float, nullable=True)
    critic_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    critic_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    user_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    user_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    developer: Mapped[str | None] = mapped_column(String(255), nullable=True)
    rating: Mapped[str | None] = mapped_column(String(255), nullable=True)

class UserPreference(Base):
    __tablename__ = "user_preferences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True,nullable=False)
    release_preference: Mapped[str] = mapped_column(String(20), nullable=False)
    rating_preference: Mapped[str] = mapped_column(String(20), nullable=False)
    user: Mapped[User] = relationship(back_populates="user_preference")

class UserPreferenceGenre(Base):
    __tablename__ = "user_preference_genres"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    genre: Mapped[str] = mapped_column(String(255), nullable=False)
    user: Mapped[User] = relationship(back_populates="user_preference_genres")

class UserPreferencePlatform(Base):
    __tablename__ = "user_preference_platforms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    platform: Mapped[str] = mapped_column(String(255), nullable=False)
    user: Mapped[User] = relationship(back_populates="user_preference_platforms")