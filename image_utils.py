import uuid #Για να κανουμε generate unique file names.
from io import BytesIO #Για να δουλευουμε με image bytes στην μνημη.
from pathlib import Path #Για file operations αντί για string manipulation.
from PIL import Image, ImageOps # Το Pillow με το main image functionality και ImageOps για image operations.

PROFILE_PICS_DIR = Path("media/profile_pics")

## Process Image Function
def process_profile_image(content: bytes) -> str:
    with Image.open(BytesIO(content)) as original:
        img = ImageOps.exif_transpose(original) #Η exif_transpose φτιαχνει orientation issues(δηλαδη λαθη απο φωτογραφιες που τραβηχτηκαν απο κινητα που συνηθως εχουν metadata που λενε 
        #'γυρισε με 90 μοιρες'. Αν δεν το φτιαξουμε αυτο οι φωτογραφιες των προφιλ θα εμφανιζονται sideways.)

        img = ImageOps.fit(img, (300, 300), method=Image.Resampling.LANCZOS) #Εδω στο fit γινεται resize και crop για να ταιριαξει η φωτογραφια στα 300x300 pixels 
        #που εχουμε γραψει εκει χωρις να χαλασει το aspect ratio. Το LANCZOS ειναι μια μεθοδος που μας δινει υψηλης ποιοτητας resampling. 

        if img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGB") #Εδω το κανουμε convert σε RGB αν χρειαστει γιατι καποια formats οπως το png υποστηριζει transparency αλλα το jpeg οχι 
            #οπότε το φτιαχνουμε ετσι αυτο πριν το σωσουμε.  

        filename = f"{uuid.uuid4().hex}.jpg" #Εδω δινουμε unique file name χρησιμοποιωντας το uuid4. Αυτο ειναι σημαντικο για λογους ασφαλειας. Αγνοουμε τελειως οποιοδηποτε file name 
        #ο χρηστης εκανε upload, εμεις κανουμε generate το δικο μας τυχαιο file name που αποτρεπει file name collisions και καποια αλλα security issues.
  
        filepath = PROFILE_PICS_DIR / filename

        PROFILE_PICS_DIR.mkdir(parents=True, exist_ok=True) #Εδω σιγουρευομαστε οτι το directory μας υπαρχει με την mkdir μεθοδο με parents = true για να δημιουργηθουν 
        #parent directories αν χρειαστει και exist_ok = true ωστε να μην πεταξει error αν υπαρχει ηδη το directory. 

        img.save(filepath, "JPEG", quality=85, optimize=True)

    return filename

## Delete Profile Image Function
def delete_profile_image(filename: str | None) -> None:
    if filename is None:
        return

    filepath = PROFILE_PICS_DIR / filename
    if filepath.exists():
        filepath.unlink()