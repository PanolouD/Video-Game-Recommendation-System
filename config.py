from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )#Εδω αυτοματα φορτωνουν τιμες απο ενα .env αρχειο(αυτο το αρχειο χρησιμοποιειται για να αποθηκεύουμε ευαισθητα configuration πχ η αποθηκευση secret_keys στο source control.) 

    database_url: str

    secret_key: SecretStr
    algorithm: str = "HS256"#Αυτος ειναι ο default αλγοριθμος για JSON web tokens.
    access_token_expire_minutes: int = 30

    max_upload_size_bytes: int = 5 * 1024 * 1024 #5MB

    reset_token_expire_minutes: int = 60

    ## Email Configuration Settings
    mail_server: str = "localhost"
    mail_port: int = 587 #standard port για smtp με χρήση κρυπτογράφησης STARTTLS.
    mail_username: str = ""
    mail_password: SecretStr = SecretStr("")
    mail_from: str = "noreply@example.com"
    mail_use_tls: bool = True

    frontend_url: str = "http://localhost:3000"

    igdb_client_id: str
    igdb_client_secret: SecretStr #Το secret εμποδιζει την τυχαια εμφανιση ολοκληρου του secret 


settings = Settings() #Loaded from .env file