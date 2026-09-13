from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Annotated
from database import get_db
from schemas import RecommendationRequest, RecommendationResponse
from recommender import get_games_from_db, recommend_games
from auth import CurrentUser
import models

router = APIRouter()

@router.post("", response_model=list[RecommendationResponse],)
async def create_recommendations(request: RecommendationRequest, db: Annotated[AsyncSession, Depends(get_db)],):
    games = await get_games_from_db(db)
    recommendations = recommend_games(
        genres=request.genres,
        platforms=request.platforms,
        release_preference=request.release_preference,
        rating_preference=request.rating_preference,
        games=games,
        top_n=request.top_n,
    )

    return recommendations

@router.get("/me", response_model=list[RecommendationResponse],)
async def create_recommendations_with_preferences(current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)], top_n: int = Query(default=10, ge=1, le=10),):
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

    #Βάζουμε τα genres και τα platforms απο τις προτιμήσεις του χρηστη σε λιστες γιατι ο recommender περιμένει λιστες οχι SQLAlchemy objects οπως user.user_preference_genres και user.user_preference_platforms.
    genres=[]
    for item in user.user_preference_genres:
        genres.append(item.genre)
    
    platforms = []
    for item in user.user_preference_platforms:
        platforms.append(item.platform)

    games = await get_games_from_db(db)
    recommendations = recommend_games(
        genres=genres,
        platforms=platforms,
        release_preference=user.user_preference.release_preference,
        rating_preference=user.user_preference.rating_preference,
        games=games,
        top_n=top_n,
    )
    
    return recommendations