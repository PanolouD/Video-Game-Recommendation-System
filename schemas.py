from pydantic import BaseModel, ConfigDict, Field, EmailStr, field_validator
from datetime import datetime
import json

class UserBase(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    email: EmailStr = Field(max_length=120)

class UserCreate(UserBase):
    password: str = Field(min_length=8)

class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    image_file: str | None
    image_path: str

class UserPrivate(UserPublic):
    email: EmailStr

class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=1, max_length=50)
    email: EmailStr | None = Field(default= None, max_length=120)

class Token(BaseModel):
    access_token: str
    token_type: str

## Password Reset Schemas
class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(max_length=120)

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)

## Games Schemas
class GameBase(BaseModel): #κοινά πεδία
    name: str = Field(min_length=1, max_length=255)
    genres: list[str] | None = None
    platforms: list[str] | None = None
    game_modes: list[str] | None = None
    player_perspectives: list[str] | None = None
    themes: list[str] | None = None

    summary: str | None = None
    storyline: str | None = None

    screenshots: list[str] | None = None
    trailer_video_id: str | None = None
    first_release_date: datetime | None = None
    developers: list[str] | None = None
    publishers: list[str] | None = None
    websites: list[dict] | None = None
    age_ratings: list[dict] | None = None
    similar_games: list[dict] | None = None

    rating: float | None = None
    rating_count: int | None = None
    total_rating: float | None = None
    total_rating_count: int | None = None

    cover_url: str | None = None
class GameCreate(GameBase):
    pass

class GameResponse(GameBase): #δεδομένα που επιστρέφονται
    model_config = ConfigDict(from_attributes=True) #Αυτο υπαρχει ώστε το Pydantic να μπορεί να διαβάζει απευθείας attributes από ένα SQLAlchemy object και να μην περιμένει dictionary.
    
    id: int
    igdb_id: int
    created_at: datetime

    @field_validator("genres", "platforms", "game_modes", "player_perspectives", "themes", "screenshots", "developers", "publishers", "websites", "age_ratings", "similar_games", mode="before") # Λεει στην Pydantic πριν κάνεις validation στα fields genres, platforms, game_modes, player_perspectives, τρέξε αυτή τη συνάρτηση (JSON validator).
    @classmethod # Η Pydantic χρειάζεται @classmethod για να ξέρει ότι η συνάρτηση δεν χρειάζεται instance του class.
    def parse_json_list(cls, value): # cls Το class το ίδιο.
        if value is None:
            return None
        if isinstance(value, str): # Έλεγχος είναι αυτή η τιμή string;
            return json.loads(value) # Διάβασε το JSON string και κάν' το Python list.
        return value

class UserPreferenceBase(BaseModel):
    preferred_genres: list[str] | None = None
    preferred_platforms: list[str] | None = None
    preferred_game_modes: list[str] | None = None
    preferred_player_perspectives: list[str] | None = None
    preferred_themes: list[str] | None = None

    @field_validator(
        "preferred_genres",
        "preferred_platforms",
        "preferred_game_modes",
        "preferred_player_perspectives",
        "preferred_themes",
        mode="before",
    )
    @classmethod
    def parse_json_lists(cls, value):
        if value is None:
            return None

        if isinstance(value, str):
            return json.loads(value)

        return value

    model_config = ConfigDict(from_attributes=True)

class RecommendationRequest(BaseModel):
    platforms: list[str]
    genres: list[str]
    game_modes: list[str] = [] # ← Optional (default = empty list)
    player_perspectives: list[str] = []
    themes: list[str] = []
    top_n: int = Field(default=10)

class RecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    game: GameResponse
    score: float

class LibraryGameResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    saved_at: datetime
    game: GameResponse

class LibraryGameStatusResponse(BaseModel):
    game_id: int
    is_saved: bool