from pydantic import BaseModel, ConfigDict, Field, EmailStr
from datetime import datetime

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
    platform: str | None = Field(default= None, min_length=1, max_length=255)
    year_of_release: int | None = None
    genre: str | None = Field(default= None, min_length=1, max_length=255)
    publisher: str | None = Field(default= None, min_length=1, max_length=255)
    global_sales: float | None = None
    critic_score: float | None = None
    critic_count: int | None = None
    user_score: float | None = None
    user_count: int | None = None
    developer: str | None = Field(default= None, min_length=1, max_length=255)
    rating: str | None = Field(default= None, min_length=1, max_length=255)

class GameCreate(GameBase):
    pass

class GameResponse(GameBase): #δεδομένα που επιστρέφονται
    model_config = ConfigDict(from_attributes=True) #Αυτο υπαρχει ώστε το Pydantic να μπορεί να διαβάζει απευθείας attributes από ένα SQLAlchemy object και να μην περιμένει dictionary.
    
    id: int

class UserPreferenceBase(BaseModel):
    release_preference: str
    rating_preference: str

class UserQuestionnaireCreate(UserPreferenceBase):
    genres: list[str]
    platforms: list[str]

class UserQuestionnaireResponse(UserQuestionnaireCreate):
    pass