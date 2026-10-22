# Thesis
Thesis: Video Games Recommendation System

# Video Game Recommendation System

A full-stack web application that recommends video games based on a user's preferences. Users complete a questionnaire about genres, themes, platforms, game modes, and player perspectives. The backend ranks the available games and returns personalized recommendations.

The application also supports user registration and authentication, password reset by email, profile management, game details, and a personal game library.

## Main Features

- User registration, login, and JWT-based authentication
- Password reset through email
- User profile and profile-picture management
- Preference questionnaire with multiple selections
- Personalized game recommendations
- Recommendation ranking using rule-based scoring, TF-IDF, and cosine similarity
- Detailed game information, including covers, screenshots, trailers, storyline, developers, publishers, release date, age ratings, and similar games
- Personal library for saving and removing games
- Popular games on the home page
- Game data retrieved from the IGDB API and stored locally in PostgreSQL

## Technologies

### Frontend

- React
- React Router
- React Icons
- CSS

### Backend

- Python
- FastAPI
- SQLAlchemy with asynchronous sessions
- Alembic
- PostgreSQL
- Pydantic
- JWT authentication
- scikit-learn
- IGDB API
- SMTP email service
- Pillow for profile-image processing

## Project Structure

```text
FinalProject/
├── alembic/                 # Database migrations
├── Frontend/                # React application
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
├── media/                   # Uploaded profile pictures
├── routers/                 # FastAPI API routes
├── static/                  # Static files and default profile picture
├── templates/               # Email templates
├── auth.py                  # Authentication and token functions
├── config.py                # Environment-based configuration
├── database.py              # Database connection and sessions
├── igdb_client.py           # IGDB API client
├── main.py                  # FastAPI application entry point
├── models.py                # SQLAlchemy models
├── recommender.py           # Recommendation algorithm
├── requirements.txt         # Python dependencies
├── schemas.py               # Pydantic schemas
└── seed_games.py            # Initial game-data import
```
Uploaded user pictures should not be committed to the repository. The default profile picture at `static/profile_pics/default.jpg` is an application asset and must be retained.

## Prerequisites

Install the following software before running the application:

- Python 3.11 or newer, with a version compatible with the project's dependencies
- Node.js and npm
- PostgreSQL
- Git, if you want to clone the repository

The backend uses `datetime.UTC`, which requires Python 3.11 or newer. Compatibility with the full dependency list must also be checked.

You will also need:

- IGDB API credentials (Twitch Client ID and Client Secret)
- SMTP credentials if you want to test password-reset emails

The installation commands below use Windows PowerShell.

## Environment Configuration

Create a `.env` file in the root directory, next to `config.py`.

You may copy `.env.example` and replace its placeholder values:

```powershell
Copy-Item .env.example .env
```

Example configuration:

```dotenv
DATABASE_URL=postgresql+psycopg://thesis_user:YOUR_PASSWORD@localhost:5432/video_game_recommendations

SECRET_KEY=replace_with_a_long_random_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
RESET_TOKEN_EXPIRE_MINUTES=60
MAX_UPLOAD_SIZE_BYTES=5242880

IGDB_CLIENT_ID=your_igdb_client_id
IGDB_CLIENT_SECRET=your_igdb_client_secret

MAIL_SERVER=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=your_mail_username
MAIL_PASSWORD=your_mail_password
MAIL_FROM=noreply@example.com
MAIL_USE_TLS=true

FRONTEND_URL=http://localhost:3000
```
Do not commit or share the real `.env` file because it contains private credentials.

Replace the database and IGDB values with your own credentials.

SMTP settings must match your email provider. The example SMTP values will not deliver password-reset emails.

You can generate a random JWT secret locally:

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

Copy the generated value into `SECRET_KEY`.

### Frontend API Configuration

The frontend defaults to `http://localhost:8000`.

To use another backend address, create `Frontend/.env`:

```dotenv
REACT_APP_API_URL=http://localhost:8000
```

Restart the frontend after changing this value.

If the frontend address changes, also check the backend's allowed CORS origins. Changing `FRONTEND_URL` should not be assumed to update the CORS configuration automatically.

## Database Setup

Create a PostgreSQL login role for the application and an empty database owned by that role.

For example, when connected as a PostgreSQL user with the required permissions:

```sql
CREATE DATABASE video_game_recommendations OWNER thesis_user;
```

The role `thesis_user` must already exist before running this command.

Update `DATABASE_URL` in `.env` so that it contains the correct PostgreSQL username, password, host, port, and database name.

Make sure PostgreSQL is running before continuing.

## Backend Installation

Open PowerShell in the project root directory.

### 1. Create and activate a virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2. Install dependencies

```powershell
python -m pip install -r requirements.txt
```

If the supplied `requirements.txt` is still encoded as UTF-16 and pip reports an encoding error, create a UTF-8 copy and install from it:

```powershell
Get-Content requirements.txt -Encoding Unicode |
    Set-Content requirements-utf8.txt -Encoding utf8

python -m pip install -r requirements-utf8.txt
```

### 3. Prepare profile-picture directories

```powershell
New-Item -ItemType Directory -Force .\static\profile_pics
New-Item -ItemType Directory -Force .\media\profile_pics
```

Ensure the default image exists at:

```text
static/profile_pics/default.jpg
```

Creating the directory does not create the image itself.

### 4. Apply migrations, import games, and start the backend

```powershell
python -m alembic upgrade head
python seed_games.py
python -m uvicorn main:app --reload --port 8000
```

The backend will be available at:

```text
http://localhost:8000
```

Interactive API documentation is available at:

```text
http://localhost:8000/docs
```

### About `seed_games.py`

Run `python seed_games.py` during the initial setup to retrieve game data from IGDB and populate the PostgreSQL database. Valid IGDB credentials and an internet connection are required.

The seeding command is not required every time the backend starts. Run it during initial setup to populate the catalog.

Re-running the script should not be treated as a full synchronization of existing game data.

## Frontend Installation

Keep the backend running and open a second PowerShell window in the project root:

```powershell
cd Frontend
npm ci
npm start
```

The frontend will open at:

```text
http://localhost:3000
```

`npm ci` installs dependencies using the versions recorded in `package-lock.json`.

## Starting the Application After the First Installation

Database migrations, package installations, and initial seeding do not need to be repeated on every launch.

Install dependencies again when dependency files change, and apply migrations again when new migrations are added.

Start the backend from the project root:

```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --port 8000
```

Then start the frontend in a second terminal, also starting from the project root:

```powershell
cd Frontend
npm start
```

PostgreSQL must be running while the application is in use.

## Recommendation Process

1. The user selects preferred genres, themes, platforms, game modes, and player perspectives.
2. The backend filters the locally stored games using the selected categories.
3. A weighted rule-based score is calculated for each candidate game.
4. TF-IDF and cosine similarity are used to measure content similarity.
5. The final score combines 85% rule-based matching and 15% content similarity.
6. The highest-ranked games are returned to the recommendations page.

Selections within the same category use OR logic, while different non-empty categories use AND logic. A game must satisfy every selected category to remain a candidate.

Recommendations are generated from the games stored in PostgreSQL. The application does not send a new IGDB request whenever a questionnaire is submitted.

## Useful URLs

| Service | URL |
| --- | --- |
| React frontend | http://localhost:3000 |
| FastAPI backend | http://localhost:8000 |
| Swagger API documentation | http://localhost:8000/docs |
| ReDoc documentation | http://localhost:8000/redoc |

## Notes and Limitations

- The import script requests up to 500 games from IGDB. The actual number stored depends on the API response and the import outcome.
- Recommendations are limited to games already stored in the local database.
- Strict preference combinations may produce few or no matching games.
- Missing or inconsistent game metadata can affect matching.
- Recommendation scores indicate preference matching, not a validated probability of enjoyment.
- Scoring weights are fixed and have not been optimized through a formal evaluation.
- Recommendation quality and user satisfaction have not been quantitatively evaluated.
- The current algorithm does not use collaborative filtering or other users' behavior.
- SMTP settings are required for actual password-reset email delivery.
- Uploaded profile pictures are stored locally in the `media` directory.
- Dependency audit findings require review before production deployment.

This is an academic portfolio project. The local development setup is not a production deployment configuration.

## Data and Attribution

Game metadata and media are obtained through IGDB.

Game names, artwork, and other third-party assets belong to their respective rights holders.

This project is not an official IGDB or Twitch product.

## Authors and Contributions

Developed as an undergraduate thesis project in the Department of Informatics and Telecommunications, University of the Peloponnese.

| Author | Main responsibility |
| --- | --- |
| Panagiotis Stathousis | Backend development |
| Nikolaos Mastrapas | Frontend development |