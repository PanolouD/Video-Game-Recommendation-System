from fastapi import FastAPI, Request , HTTPException, status, Depends
from fastapi.exceptions import RequestValidationError #αυτό είναι για να χειριζόμαστε τα validation errors(πχ βαζουμε καπου string αντι για αριθμο που ζηταει).
#from fastapi.responses import JSONResponse #αυτο το χρησιμοποιούμε για να μπορούμε να επιστρέψουμε manually JSON responses από τον exception handler μας. 
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from starlette.exceptions import HTTPException as StarletteHTTPException
from typing import Annotated
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import models
from database import engine, get_db
from contextlib import asynccontextmanager
from fastapi.exception_handlers import http_exception_handler, request_validation_exception_handler
from routers import users, games

@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield#Από έδω όντως τρέχει το application μας.
    #shutdown
    await engine.dispose()

app = FastAPI(lifespan=lifespan)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.mount("/media", StaticFiles(directory="media"), name="media")

##templates = Jinja2Templates(directory="templates")

app.include_router(users.router, prefix="/api/users", tags=["users"])

app.include_router(games.router, prefix="/api/games", tags=["games"])

## StarletteHTTPException Handler
@app.exception_handler(StarletteHTTPException)
async def general_http_exception_handler(request: Request, exception: StarletteHTTPException):

    if request.url.path.startswith("/api"):
        return await http_exception_handler(request,exception)
    message = (
        exception.detail
        if exception.detail
        else "An error occurred. Please check your request and try again."
    )

### RequestValidationError Handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exception: RequestValidationError):
    if request.url.path.startswith("/api"):
        return await request_validation_exception_handler(request,exception)