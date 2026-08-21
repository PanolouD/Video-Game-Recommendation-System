from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import Game
from schemas import GameResponse
from typing import Annotated

router = APIRouter()

## get_game
@router.get("/{game_id}", response_model=GameResponse)
async def get_game(game_id: int, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(
        select(Game).where(Game.id == game_id)
    )
    game = result.scalars().first()
    if game:
        return game
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")

## get_games
@router.get("/", response_model=list[GameResponse])
async def get_games(db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(select(Game))
    games = result.scalars().all()
    return games