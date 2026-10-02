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
from routers import users, games, recommendations, library
from fastapi.middleware.cors import CORSMiddleware
from config import settings

@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield#Από έδω όντως τρέχει το application μας.
    #shutdown
    await engine.dispose()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware, # Περιλαμβανει HTTP request/responses για να επικοινωνει ο browser
    allow_origins=[settings.frontend_url, "http://127.0.0.1:3000",], #Επιτρεπει στο Frontend Που τρεχει στο Post 3000 να κανει request εδω
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.mount("/media", StaticFiles(directory="media"), name="media")

##templates = Jinja2Templates(directory="templates")

app.include_router(users.router, prefix="/api/users", tags=["users"])

app.include_router(games.router, prefix="/api/games", tags=["games"])

app.include_router(recommendations.router, prefix="/api/recommendations", tags=["recommendations"])

app.include_router(library.router, prefix="/api/library", tags=["library"])

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