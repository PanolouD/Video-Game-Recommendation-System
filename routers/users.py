from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, BackgroundTasks
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import delete as sql_delete
import models
from database import get_db
from schemas import UserCreate, UserUpdate, UserPrivate, UserPublic, Token, ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest, UserQuestionnaireCreate, UserQuestionnaireResponse
from datetime import timedelta, UTC, datetime
from fastapi.security import OAuth2PasswordRequestForm
from auth import create_access_token, hash_password, verify_password, CurrentUser, generate_reset_token, hash_reset_token
from config import settings
from PIL import UnidentifiedImageError
from starlette.concurrency import run_in_threadpool
from image_utils import delete_profile_image, process_profile_image
from email_utils import send_password_reset_email

router = APIRouter()

## πηραμε την create_user απο την main.py και της αλλαξαμε μερικα πραγματα για να δουλεψει με τον router. Αλλάζουμε δηλαδή τον decorator από app.post σε router.post και σβήνουμε το path.
## Τα υπολοιπα μενουν ως εχουν.
@router.post(
    "",
    response_model=UserPrivate,
    status_code=status.HTTP_201_CREATED,
)
async def create_user(user: UserCreate, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(
        select(models.User).where(func.lower(models.User.username) == user.username.lower()),
    )
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )

    result = await db.execute(
        select(models.User).where(func.lower(models.User.email) == user.email.lower()),
    )
    existing_email = result.scalars().first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    new_user = models.User(
        username=user.username,
        email=user.email.lower(),
        password_hash= hash_password(user.password),
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

#Οτι καναμε στους create_user παραπανω κανουμε και στους υπολοιπους παρακατω.

## login_for_access_token
@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    # Look up user by email (case-insensitive)
    # Note: OAuth2PasswordRequestForm uses "username" field, but we treat it as email
    result = await db.execute(
        select(models.User).where(
            func.lower(models.User.email) == form_data.username.lower(),
        ),
    )
    user = result.scalars().first()

    # Verify user exists and password is correct
    # Don't reveal which one failed (security best practice)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token with user id as subject
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires,
    )
    return Token(access_token=access_token, token_type="bearer")

## get_current_user
@router.get("/me", response_model=UserPrivate)
async def get_current_user(current_user: CurrentUser):
    return current_user

## forgot_password endpoint
@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
async def forgot_password(
    request_data: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(models.User).where(
            func.lower(models.User.email) == request_data.email.lower(),
        ),
    )
    user = result.scalars().first()

    if user:
        await db.execute(
            sql_delete(models.PasswordResetToken).where(
                models.PasswordResetToken.user_id == user.id,
            ),
        )

        token = generate_reset_token()
        token_hash = hash_reset_token(token)
        expires_at = datetime.now(UTC) + timedelta(
            minutes=settings.reset_token_expire_minutes
        )

        reset_token = models.PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        db.add(reset_token)
        await db.commit()

        background_tasks.add_task(
            send_password_reset_email,
            to_email=user.email,
            username=user.username,
            token=token,
        )

    return {
        "message": "If an account exists with this email, you will receive password reset instructions."
    }

## reset_password endpoint
@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    request_data: ResetPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    token_hash = hash_reset_token(request_data.token)

    result = await db.execute(
        select(models.PasswordResetToken).where(
            models.PasswordResetToken.token_hash == token_hash,
        ),
    )
    reset_token = result.scalars().first()

    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    if reset_token.expires_at < datetime.now(UTC):
        await db.delete(reset_token)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    result = await db.execute(
        select(models.User).where(models.User.id == reset_token.user_id),
    )
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    user.password_hash = hash_password(request_data.new_password)

    await db.execute(
        sql_delete(models.PasswordResetToken).where(
            models.PasswordResetToken.user_id == user.id,
        ),
    )

    await db.commit()
    return {
        "message": "Password reset successfully. You can now log in with your new password."
    }

## change_password endpoint
@router.patch("/me/password", status_code=status.HTTP_200_OK)
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    current_user.password_hash = hash_password(password_data.new_password)

    await db.execute(
        sql_delete(models.PasswordResetToken).where(
            models.PasswordResetToken.user_id == current_user.id,
        ),
    )

    await db.commit()
    return {"message": "Password changed successfully"}

## get_user
@router.get("/{user_id}", response_model=UserPublic)
async def get_user(user_id: int, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    if user:
        return user
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

## update_user
@router.patch("/{user_id}", response_model=UserPrivate)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user",
        )
    
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if user_update.username is not None and user_update.username.lower() != user.username.lower():
        result = await db.execute(
            select(models.User).where(func.lower(models.User.username) == user_update.username.lower()),
        )
        existing_user = result.scalars().first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists",
            )
    if user_update.email is not None and user_update.email.lower() != user.email.lower():
        result = await db.execute(
            select(models.User).where(func.lower(models.User.email) == user_update.email.lower()),
        )
        existing_email = result.scalars().first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    #τα παρακάτω είναι μια πιο απλή manual check επιλογή από το setattr.
    if user_update.username is not None:
        user.username = user_update.username
    if user_update.email is not None:
        user.email = user_update.email.lower()

    await db.commit()
    await db.refresh(user)
    return user

## delete_user
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int, current_user:CurrentUser, db: Annotated[AsyncSession, Depends(get_db)]):

    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this user",
        )
    
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    old_filename = user.image_file

    await db.delete(user)
    await db.commit()

    if old_filename:
        delete_profile_image(old_filename)

## Upload Profile Picture Endpoint
@router.patch("/{user_id}/picture", response_model=UserPrivate)
async def upload_profile_picture(
    user_id: int,
    file: UploadFile,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user's picture",
        )

    content = await file.read()

    if len(content) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {settings.max_upload_size_bytes // (1024 * 1024)}MB",
        )

    try:
        new_filename = await run_in_threadpool(process_profile_image, content)
    except UnidentifiedImageError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image file. Please upload a valid image (JPEG, PNG, GIF, WebP).",
        ) from err

    old_filename = current_user.image_file

    current_user.image_file = new_filename
    await db.commit()
    await db.refresh(current_user)

    if old_filename:
        delete_profile_image(old_filename)

    return current_user

## Delete Profile Picture Endpoint
@router.delete("/{user_id}/picture", response_model=UserPrivate)
async def delete_user_picture(
    user_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this user's picture",
        )

    old_filename = current_user.image_file

    if old_filename is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No profile picture to delete",
        )

    current_user.image_file = None
    await db.commit()
    await db.refresh(current_user)

    delete_profile_image(old_filename)

    return current_user 

@router.post("/me/questionnaire")
async def save_user_preference(questionnaire: UserQuestionnaireCreate, current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)],):
    result = await db.execute(select(models.UserPreference).where(models.UserPreference.user_id == current_user.id))
    user_preference = result.scalars().first()
    if user_preference is None:
        user_preference = models.UserPreference(
            user_id = current_user.id,
            release_preference = questionnaire.release_preference,
            rating_preference = questionnaire.rating_preference,
        )
        db.add(user_preference)
    else:
        user_preference.release_preference = (
            questionnaire.release_preference
        )
        user_preference.rating_preference = (
            questionnaire.rating_preference
        )

    await db.execute(
        delete(models.UserPreferenceGenre).where(
            models.UserPreferenceGenre.user_id == current_user.id
        )
    )
    await db.execute(
        delete(models.UserPreferencePlatform).where(
            models.UserPreferencePlatform.user_id == current_user.id
        )
    )

    new_genres = []
    for genre in questionnaire.genres:
        new_genre = models.UserPreferenceGenre(
            user_id = current_user.id,
            genre = genre,
        )
        new_genres.append(new_genre)

    db.add_all(new_genres)

    new_platforms = []
    for platform in questionnaire.platforms:
        new_platform = models.UserPreferencePlatform(
            user_id = current_user.id,
            platform = platform
        )
        new_platforms.append(new_platform)

    db.add_all(new_platforms)

    await db.commit()
    await db.refresh(user_preference)

    return{
        "message": "User preferences saved successfully",
        "user_id": current_user.id,
        "release_preference": user_preference.release_preference,
        "rating_preference": user_preference.rating_preference,
        "genres": questionnaire.genres,
        "platforms": questionnaire.platforms,
    }

@router.get("/me/questionnaire", response_model=UserQuestionnaireResponse)
async def get_user_questionnaire(current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(
        select(models.User)
        .options(
            selectinload(models.User.user_preference),
            selectinload(models.User.user_preference_genres),
            selectinload(models.User.user_preference_platforms),
        )
        .where(models.User.id == current_user.id)
    )

    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.user_preference is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Questionnaire not found",
        )

    genres=[]
    for item in user.user_preference_genres:
        genres.append(item.genre)

    platforms = []
    for item in user.user_preference_platforms:
        platforms.append(item.platform)
    
    return UserQuestionnaireResponse(
        release_preference=(
            user.user_preference.release_preference
        ),
        rating_preference=(
            user.user_preference.rating_preference
        ),
        genres=genres,
        platforms=platforms,
    )