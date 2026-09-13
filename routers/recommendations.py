from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Annotated
import json
from database import get_db
from schemas import RecommendationRequest, RecommendationResponse
from recommender import get_games_from_db, recommend_games
from auth import CurrentUser
import models


router = APIRouter()


@router.post("", response_model=list[RecommendationResponse])
async def create_recommendations(
    request: RecommendationRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    games = await get_games_from_db(db)
    
    recommendations = recommend_games(
        genres=request.genres,
        platforms=request.platforms,
        game_modes=request.game_modes,
        player_perspectives=request.player_perspectives,
        games=games,
        top_n=request.top_n,
    )

    return recommendations


@router.get("/me", response_model=list[RecommendationResponse])
async def create_recommendations_with_preferences(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    top_n: int = Query(default=10, ge=1, le=10),
):
    # Fetch user with user_preference (eager loading)
    result = await db.execute(
        select(models.User)
        .options(
            selectinload(models.User.user_preference),
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
    
    # Parse JSON strings -> lists
    # Το DB αποθηκεύει JSON strings, οπότε πρέπει να τα κάνουμε parse
    preferred_genres = (
        json.loads(user.user_preference.preferred_genres)
        if user.user_preference.preferred_genres
        else []
    )
    
    preferred_platforms = (
        json.loads(user.user_preference.preferred_platforms)
        if user.user_preference.preferred_platforms
        else []
    )
    
    preferred_game_modes = (
        json.loads(user.user_preference.preferred_game_modes)
        if user.user_preference.preferred_game_modes
        else []
    )
    
    preferred_player_perspectives = (
        json.loads(user.user_preference.preferred_player_perspectives)
        if user.user_preference.preferred_player_perspectives
        else []
    )

    games = await get_games_from_db(db)
    
    recommendations = recommend_games(
        genres=preferred_genres,
        platforms=preferred_platforms,
        game_modes=preferred_game_modes,
        player_perspectives=preferred_player_perspectives,
        games=games,
        top_n=top_n,
    )

    return recommendations