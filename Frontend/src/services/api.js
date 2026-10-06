const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export async function apiRequest(path, options = {}){ //path ειναι το endpoint που θελουμε να καλεσουμε ανα στιγμη | options ειναι ενα object με τις ρυθμισεις του request
   
    //Παιρνουμε το JWT απο το localStorage
    const token = localStorage.getItem("accessToken");
   
    const response = await fetch(`${API_BASE_URL}${path}`, { 
        ...options, // Αντιγραφει ολες τις ρυθμισεις του request, οπως method, body και headers

        headers:{
            ...options.headers,
        
            //Αν υπαρχει token προσθετει το Authorization header
            ...(token && {
                Authorization : `Bearer ${token}`,
            }),
        },    
    });

    if (response.status === 204) {
    return null;
}

    const contentType = response.headers.get("content-type");

    let data = null;

    if(contentType?.includes("application/json")) { // Με το ? (optional chaining) βοηθαει να μη κρασαρει αν ειναι null η τιμη, και εκτελει την .includes οταν δεν εχουμε null
        data = await response.json();
    }

    if(!response.ok) {
        const error = new Error(
            data?.detail || "Something went wrong."
        );

        error.status = response.status;
        error.data = data;

        throw error; // Μεταφερει το error στο catch της σελιδας που εκανε την κληση
    }

    return data;
}


export function registerUser(userData) { //userData = {username,email,password}
    return apiRequest("/api/users", {
        method: "POST",

        headers: {
            "Content-Type": "application/json",
        },

        body: JSON.stringify(userData),
    });
}

export function loginUser(email, password) {
     const formData = new URLSearchParams(); // What is that?

     formData.append("username", email); //what are formData
     formData.append("password", password);

     return apiRequest("/api/users/token", {
        method: "POST",

        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },

        body: formData,
     });
}

export function getCurrentUser() {
    return apiRequest("/api/users/me"); // Το fetch χρησιμοποιεί απο μονο του GET method, για αυτο δεν ξεκαθαριζουμε εμεις το method
}

export function getGames(){
    return apiRequest("/api/games/");
}

export function saveQuestionnaire(questionnaireData) {
    return apiRequest("/api/users/me/questionnaire", {
        method: "POST",

        headers: {
            "Content-Type": "application/json",
        },

        body: JSON.stringify(questionnaireData),
    });
}

// Κανουμε και GET questionnaire για να παρουμε τις ηδη υπαρχουσες προτιμησεις ενος συνδεδεμενου χρηστη
export function getQuestionnaire() {
    return apiRequest("/api/users/me/questionnaire");
}

export function getRecommendations(topN = 10) {
    return apiRequest(
        `/api/recommendations/me?top_n=${topN}`
    );
}

// Επιστρέφει όλα τα παιχνίδια που έχει αποθηκεύσει ο συνδεδεμένος χρήστης
export function getLibrary() {
    return apiRequest("/api/library");
}


// Προσθέτει ένα παιχνίδι στη Library. Το gameId είναι το game.id της δικής μας βάσης, όχι το game.igdb_id
export function addGameToLibrary(gameId) {
    return apiRequest(`/api/library/${gameId}`, {
        method: "POST",
    });
}


// Αφαιρεί ένα παιχνίδι από τη Library
export function removeGameFromLibrary(gameId) {
    return apiRequest(`/api/library/${gameId}`, {
        method: "DELETE",
    });
}


// Ελέγχει αν ένα συγκεκριμένο παιχνίδι βρίσκεται ήδη στη Library του χρήστη
export function getLibraryGameStatus(gameId) {
    return apiRequest(`/api/library/${gameId}/status`);
}

export function requestPasswordReset(email) {
    return apiRequest("/api/users/forgot-password", {
        method: "POST",

        headers: {
            "Content-type": "application/json",
        },

        body: JSON.stringify({
            email: email,
        }),
    });
}

export function resetPassword(token, newPassword) {
    return apiRequest("/api/users/reset-password", {
        method: "POST",

        headers: {
            "Content-type": "application/json",
        },

        body: JSON.stringify({
            token: token,
            new_password: newPassword,
        }),
    });
}