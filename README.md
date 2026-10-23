# Thesis
Thesis: Video Games Recommendation System

# Video Game Recommendation System

A full-stack web application that recommends video games based on a user's preferences. Users complete a questionnaire about genres, themes, platforms, game modes, and player perspectives. The backend filters and ranks the available games and returns personalized recommendations.

The application also supports user registration and authentication, password reset by email, profile management, game details, and a personal game library.

Developed as an undergraduate thesis project.

## Main Features

- User registration, login, and JWT-based authentication
- Password reset through email
- User profile and profile-picture management
- Preference questionnaire with multiple selections
- Personalized game recommendations with up to 10 ranked results
- Recommendation ranking using rule-based scoring, TF-IDF, and cosine similarity
- Detailed game information, including available covers, screenshots, trailers, storyline, developers, publishers, release date, age ratings, and similar games
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
- PyJWT and pwdlib for authentication
- scikit-learn for TF-IDF and cosine similarity
- Pillow for profile-image processing
- IGDB API
- SMTP email service

## Project Structure

The following structure highlights the main application files:

```text
project-root/
├── alembic/                 # Database migrations
├── alembic.ini              # Alembic configuration
├── Frontend/                # React application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── css/
│   │   └── services/
│   │       └── api.js
│   ├── package.json
│   └── package-lock.json
├── media/
│   └── profile_pics/        # Uploaded profile pictures; not committed
├── routers/                 # FastAPI API routes
├── static/
│   └── profile_pics/
│       └── default.jpg      # Default profile picture
├── auth.py                  # Authentication and token functions
├── config.py                # Environment-based configuration
├── database.py              # Database connection and sessions
├── email_utils.py           # Password-reset email delivery
├── image_utils.py           # Profile-image processing
├── igdb_client.py           # IGDB API client
├── main.py                  # FastAPI application entry point
├── models.py                # SQLAlchemy models
├── recommender.py           # Recommendation algorithm
├── requirements.txt         # Python dependencies
├── schemas.py               # Pydantic schemas
├── seed_games.py            # Initial game-data import
├── .env.example             # Configuration template without real credentials
├── .gitignore
└── README.md
```

Uploaded user pictures should not be committed to the repository. The default profile picture at `static/profile_pics/default.jpg` is an application asset and must be retained.

## Prerequisites

Install the following software before running the application:

- Python 3.11 or newer, with a version compatible with the project's dependencies
- Node.js and npm
- PostgreSQL
- Git, if you want to clone the repository

The backend uses `datetime.UTC`, which requires Python 3.11 or newer. Compatibility with the complete dependency list must also be checked.

You will also need:

- IGDB API credentials: Twitch Client ID and Client Secret
- SMTP credentials if you want to test password-reset email delivery

The commands below use Windows PowerShell.

Download or clone the repository, then open PowerShell in the project root: the directory containing `main.py`, `config.py`, and `Frontend/`.

## Environment Configuration

Create your local `.env` file by copying the supplied example:

```powershell
Copy-Item .env.example .env
```

The `.env` file must be in the project root, next to `config.py`.

Example configuration:

```dotenv
DATABASE_URL=postgresql+psycopg://thesis_user:CHANGE_ME@localhost:5432/video_game_recommendations

SECRET_KEY=REPLACE_WITH_A_LONG_RANDOM_SECRET
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
RESET_TOKEN_EXPIRE_MINUTES=60

MAX_UPLOAD_SIZE_BYTES=5242880

FRONTEND_URL=http://localhost:3000

IGDB_CLIENT_ID=REPLACE_WITH_YOUR_TWITCH_CLIENT_ID
IGDB_CLIENT_SECRET=REPLACE_WITH_YOUR_TWITCH_CLIENT_SECRET

MAIL_SERVER=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=REPLACE_WITH_YOUR_SMTP_USERNAME
MAIL_PASSWORD=REPLACE_WITH_YOUR_SMTP_PASSWORD
MAIL_FROM=noreply@example.com
MAIL_USE_TLS=true
```

Replace the database and IGDB placeholders with your own configuration.

SMTP settings must match your email provider. The example SMTP values will not deliver password-reset emails.

After creating the Python environment described below, you can generate a random JWT secret with:

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

Copy the generated value into `SECRET_KEY`.

Never commit the real `.env` file, database passwords, SMTP credentials, or IGDB/Twitch secrets. Only the placeholder `.env.example` should be included in the repository.

### Frontend API Configuration

The frontend defaults to the backend at `http://localhost:8000`.

To configure another backend address, create `Frontend/.env`:

```dotenv
REACT_APP_API_URL=http://localhost:8000
```

Restart the frontend after changing this value.

If the frontend address changes, also check the backend's allowed CORS origins. Changing `FRONTEND_URL` should not be assumed to update the CORS configuration automatically.

## Database Setup

Using pgAdmin or PostgreSQL tools:

1. Create a PostgreSQL login role for the application.
2. Create an empty database owned by that role.
3. Update `DATABASE_URL` in `.env` with the matching credentials and database name.

For example, when connected as a PostgreSQL user with the required permissions:

```sql
CREATE DATABASE video_game_recommendations OWNER thesis_user;
```

The role `thesis_user` must already exist before running this command.

Make sure PostgreSQL is running before applying migrations or starting the application.

## Backend Installation

Open PowerShell in the project root directory.

### 1. Create and Activate a Virtual Environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2. Install Dependencies

```powershell
python -m pip install -r requirements.txt
```

If the supplied `requirements.txt` is still encoded as UTF-16 and pip reports an encoding error, create a UTF-8 copy and install from it:

```powershell
Get-Content requirements.txt -Encoding Unicode |
    Set-Content requirements-utf8.txt -Encoding utf8

python -m pip install -r requirements-utf8.txt
```

### 3. Prepare Profile-Picture Directories

```powershell
New-Item -ItemType Directory -Force .\static\profile_pics
New-Item -ItemType Directory -Force .\media\profile_pics
```

Ensure the default image exists at:

```text
static/profile_pics/default.jpg
```

Creating the directory does not create the image itself. The default image must be included in the repository.

### 4. Apply Database Migrations

```powershell
python -m alembic upgrade head
```

### 5. Import Game Data

```powershell
python seed_games.py
```

This step requires internet access and valid IGDB/Twitch credentials.

### 6. Start the Backend

```powershell
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

Keep this terminal running.

### About `seed_games.py`

Run `python seed_games.py` during initial setup to retrieve game data from IGDB and populate the PostgreSQL database.

The import script requests up to 500 games. The actual number stored depends on the API response, existing records, and the import outcome.

The seeding command is not required every time the backend starts. Re-running the script should not be treated as a full synchronization of existing game data.

## Frontend Installation

Keep the backend running and open a second PowerShell window in the project root:

```powershell
cd Frontend
npm ci
npm start
```

Open the application at:

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

Selections within the same category use OR logic, while different non-empty categories use AND logic. A game must satisfy every non-empty preference category to remain a candidate.

The rule-based component uses the following category weights:

| Category | Weight |
| --- | --- |
| Genres | 0.30 |
| Platforms | 0.25 |
| Game modes | 0.20 |
| Player perspectives | 0.15 |
| Themes | 0.10 |

The final score is calculated as:

```text
Final score = 0.85 × rule-based score + 0.15 × cosine similarity
```

Recommendations are generated from the games stored in PostgreSQL. The application does not send a new IGDB request whenever a questionnaire is submitted.

## Using the Application

1. Create an account and sign in.
2. Complete the preference questionnaire.
3. Submit your preferences to generate recommendations.
4. Browse the recommended games and their available details.
5. Save games to your personal library.
6. Manage your saved games and profile settings.

If no recommendations are returned, try a different combination of preferences. Strict filtering can exclude every game in the current catalog.

## Useful URLs

| Service | URL |
| --- | --- |
| React frontend | http://localhost:3000 |
| FastAPI backend | http://localhost:8000 |
| Swagger API documentation | http://localhost:8000/docs |
| ReDoc documentation | http://localhost:8000/redoc |

## Manual Verification

After installation, verify that:

- The home page loads the game catalog.
- Registration, login, and logout work.
- Questionnaire preferences can be saved.
- Recommendations appear, or an appropriate empty-result message is displayed.
- Games can be saved to and removed from the personal library.
- Profile updates and profile-picture operations work.
- Users without an uploaded picture see the default profile image.
- Password-reset emails are delivered when valid SMTP settings are configured.

This checklist describes manual verification steps, not automated test coverage.

## Troubleshooting

### The Game Catalog Is Empty

Check that:

- PostgreSQL is running.
- `DATABASE_URL` points to the correct database.
- Database migrations completed successfully.
- IGDB credentials are valid.
- `python seed_games.py` completed successfully.
- `GET /api/games/` returns game records.

### Recommendations Are Empty

Confirm that games have been imported and try a different or less restrictive combination of preferences.

### The Frontend Cannot Reach the Backend

Check that:

- The backend is running on port 8000.
- `REACT_APP_API_URL` points to the correct backend.
- The frontend origin is allowed by the backend's CORS configuration.

### Personal Endpoints Return 401

The access token may be missing or expired. Sign in again.

### The Default Profile Picture Is Missing

Verify that the following file exists:

```text
static/profile_pics/default.jpg
```

### Password-Reset Emails Are Not Delivered

Check the SMTP host, port, username, password, sender address, and TLS configuration.

## Notes and Limitations

- The import script requests up to 500 games from IGDB. The actual number stored depends on the import outcome.
- Recommendations are limited to games already stored in the local database.
- Strict preference combinations may produce few or no matching games.
- Missing or inconsistent game metadata can affect matching.
- Recommendation scores indicate preference matching, not a validated probability of enjoyment.
- Scoring weights are fixed and have not been optimized through a formal evaluation.
- Recommendation quality and user satisfaction have not been quantitatively evaluated.
- The current algorithm does not use collaborative filtering or other users' behavior.
- Saved library entries do not influence the current recommendation score.
- SMTP settings are required for actual password-reset email delivery.
- Uploaded profile pictures are stored locally in the `media` directory.
- Access tokens are stored in browser localStorage in the current implementation.
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