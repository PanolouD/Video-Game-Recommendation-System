from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import models
from auth import CurrentUser
from database import get_db
from schemas import LibraryGameResponse, LibraryGameStatusResponse


router = APIRouter()

@router.get("", response_model=list[LibraryGameResponse])
async def get_my_library(current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)], ):
    result = await db.execute(
        select(models.UserLibraryGame)
        .options(selectinload(models.UserLibraryGame.game),)
        .where(models.UserLibraryGame.user_id == current_user.id)
        .order_by(models.UserLibraryGame.saved_at.desc())
    )

    library_entries = result.scalars().all()

    return library_entries

@router.post("/{game_id}", response_model=LibraryGameResponse, status_code=status.HTTP_201_CREATED,)
async def add_game_to_library(game_id: int, current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)],):
    game_result = await db.execute(select(models.Game).where(models.Game.id == game_id))
    game = game_result.scalar_one_or_none()

    if game is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found",
        )

    entry_result = await db.execute(
        select(models.UserLibraryGame)
        .where(
            models.UserLibraryGame.user_id == current_user.id,
            models.UserLibraryGame.game_id == game_id,
        )
    )
    existing_entry = entry_result.scalar_one_or_none()

    if existing_entry is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Game is already in your library",
        )

    library_entry = models.UserLibraryGame(
        user_id=current_user.id,
        game_id=game_id,
    )

    db.add(library_entry)
    await db.commit()

    #Μετά το commit, κάνουμε νέο select με selectinload ώστε το library_entry.game να είναι ήδη φορτωμένο και να μην προκύψει async lazy-loading error κατά το response serialization.
    result = await db.execute(
        select(models.UserLibraryGame)
        .options(selectinload(models.UserLibraryGame.game),)
        .where(models.UserLibraryGame.id == library_entry.id)
    )
    saved_entry = result.scalar_one()

    return saved_entry

@router.delete("/{game_id}", status_code=status.HTTP_204_NO_CONTENT,)
async def remove_game_from_library(game_id: int, current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)],):
    result = await db.execute(
        select(models.UserLibraryGame).where(
            models.UserLibraryGame.user_id == current_user.id,
            models.UserLibraryGame.game_id == game_id,
        )
    )
    library_entry = result.scalar_one_or_none()

    if library_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game is not in your library",
        )

    await db.delete(library_entry)
    await db.commit()

@router.get("/{game_id}/status", response_model=LibraryGameStatusResponse,)
async def get_library_game_status(game_id: int, current_user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)],):
    result = await db.execute(
        select(models.UserLibraryGame.id).where(
            models.UserLibraryGame.user_id == current_user.id,
            models.UserLibraryGame.game_id == game_id,
        )
    )
    library_entry_id = result.scalar_one_or_none()

    return {
        "game_id": game_id,
        "is_saved": library_entry_id is not None,
    }