from datetime import UTC, datetime, timedelta
import jwt
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash
from config import settings
from typing import Annotated
from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import models
from database import get_db
import hashlib
import secrets #Με αυτο η Python κανει generate ασφαλης τυχαιες τιμες.

password_hash = PasswordHash.recommended() #Εδω δημιουργειται ενας password hasher χρησιμοποιωντας την Argon2 που κατεβασαμε με το pwdlib με τα recommended settings του.

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/token") #Αυτο το tokenUrl πρεπει να ταιριαζει με το login endpoint path το οποιο ειναι το api/users/token. 
#Ο OAuth2PasswordBearer παιρνει το token απο το authorization header. Οποτε οταν ενας client το στελνει αυτο, το schema αυτο παιρνει αυτο το token για εμας
#και επισης ενεργοποιει το authorization button στα docs της FastAPI που κανει τα τεστ για το authentication πιο ευκολα.   

#Αυτο που γινεται στην συναρτηση αυτη ειναι οτι παιρνει ενα plain text password και επιστρέφει το hash.
def hash_password(password: str) -> str:
    return password_hash.hash(password)

#Η συναρτηση αυτη παιρνει ενα plain password και ενα hashed password και επιστρέφει True αν ταιριαζουν μεταξυ τους. Αν δεν ταιριαζουν επιστρεφει false. 
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)

def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)

def hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest() #Εδω χρησιμοποιουμε sh256 αντι για Argon2 γιατι τα password που εκει χρησιμοποιουμε το Argon2 ειναι συνηθως αδυναμοι 
    #και προβλεψιμοι αλλα επειδη τα reset tokens ειναι τυχαια δεν χρειαζεται κατι τετοιο, το sha256 κανει την δουλεια μια χαρα και πιο γρηγορα.

#Η συνάρτηση αυτη παιρνει τα data ως dictionary και ενα optional expiration delta. Δημιουργει μια κοπια του data προσθετει το expiration time και το κανει encode ως ενα JSON web token(jwt).   
## create_access_token
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(
            minutes=settings.access_token_expire_minutes,
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key.get_secret_value(), #Με αυτη την εντολη παιρνουμε το actual string απο τα settings μας αφοτου το ορισαμε ως secret string. 
        algorithm=settings.algorithm,
    )
    return encoded_jwt

## verify_access_token
def verify_access_token(token: str) -> str | None:
    """Verify a JWT access token and return the subject (user id) if valid."""
    try:
        payload = jwt.decode(
            token,
            settings.secret_key.get_secret_value(),
            algorithms=[settings.algorithm],
            options={"require": ["exp", "sub"]},
        )
    except jwt.InvalidTokenError:
        return None
    else:
        return payload.get("sub")

## get_current_user
async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> models.User:
    user_id = verify_access_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(
        select(models.User).where(models.User.id == user_id_int),
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

CurrentUser = Annotated[models.User, Depends(get_current_user)] #Εδώ αυτό που γίνεται είναι ότι στην μεταβλητη CurrentUser η Annotated την θεωρεί user object απο το models 
#που τα μεταδεδομενα του εξαρτουνται (με την Depends) απο την get_current_user που φτιαξαμε παραπανω.
#Αυτό βοηθάει στον να αναφερόμαστε στον current user με αυτη την εντολη απο το να γράφουμε καθε φορα τα παντα για αυτο οποτε λιγοτερος κωδικας και πιο καθαρος.