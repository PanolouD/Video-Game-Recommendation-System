import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveQuestionnaire } from "../services/api";
import "../css/Questionnaire.css";

const genreOptions = [
    "Point-and-click",
    "Fighting",
    "Shooter",
    "Music",
    "Platform",
    "Puzzle",
    "Racing",
    "Real Time Strategy (RTS)",
    "Role-playing (RPG)",
    "Simulator",
    "Sport",
    "Strategy",
    "Turn-based strategy (TBS)",
    "Tactical",
    "Hack and slash/Beat 'em up",
    "Quiz/Trivia",
    "Pinball",
    "Adventure",
    "Arcade",
    "Visual Novel",
    "Indie",
    "Card & Board Game",
    "MOBA"
];

const themeOptions = [
    "Action",
    "Fantasy",
    "Science fiction",
    "Horror",
    "Thriller",
    "Survival",
    "Historical",
    "Stealth",
    "Comedy",
    "Business",
    "Drama",
    "Non-fiction",
    "Sandbox",
    "Educational",
    "Kids",
    "Open world",
    "Warfare",
    "Party",
    "4X",
    "Mystery",
    "Romance"
];

const platformOptions = [
    "PC (Microsoft Windows)",
    "PlayStation 5",
    "PlayStation 4",
    "PlayStation 3",
    "PlayStation 2",
    "PlayStation",
    "Xbox Series X|S",
    "Xbox One",
    "Xbox 360",
    "Xbox",
    "Nintendo Switch",
    "Wii U",
    "Wii",
    "Nintendo 3DS",
    "Nintendo DS",
    "Nintendo GameCube",
    "Nintendo 64",
    "Super Nintendo Entertainment System",
    "Nintendo Entertainment System",
    "PlayStation Vita",
    "PlayStation Portable",
    "Mac",
    "Linux",
    "Android",
    "iOS",
    "Web browser"
];

function Questionnaire() {

    const navigate = useNavigate();

    const questions = [
        {
            id: "preferred_genres",
            question: "Which genres do you prefer?",
            type: "dropdown",
            helpText: "You can select more than one genre.",
            options: genreOptions
        },
        {
            id: "preferred_themes",
            question: "Which themes do you prefer?",
            type: "dropdown",
            helpText: "You can select more than one theme.",
            options: themeOptions
        },
        {
            id: "preferred_platforms",
            question: "Which platforms do you use?",
            type: "dropdown",
            helpText: "Type a platform and press Enter. You can add more than one.",
            options: platformOptions
        },
        {
            id: "preferred_game_modes",
            question: "Which game modes do you prefer?",
            type: "multipleChoice",
            helpText: "You can select more than one game mode.",
            options: [
                "Single player",
                "Multiplayer",
                "Co-operative",
                "Split screen",
                "Massively Multiplayer Online (MMO)",
                "Battle Royale"
            ]
        },
        {
            id: "preferred_player_perspectives",
            question: "Which player perspectives do you prefer?",
            type: "multipleChoice",
            helpText: "You can select more than one perspective.",
            options: [
                "First person",
                "Third person",
                "Bird view / Isometric",
                "Side view",
                "Text",
                "Auditory",
                "Virtual Reality"
            ]
        }
    ];

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({ // Ωστε να μπορει καθε απαντηση να περιεχει πολλες τιμες
        preferred_genres: [],
        preferred_themes: [],
        preferred_platforms: [],
        preferred_game_modes: [],
        preferred_player_perspectives: []

    });
    const [dropdownOpen, setDropdownOpen] = useState(false); // Έλεγχος για το αν το dropdown ειναι ανοιχτο
    const [searchTerm, setSearchTerm] = useState(""); // Έλεγχος για το αν κρατα το κειμενο αναζητησης
    const [finishAttempted, setFinishAttempted] = useState(false); // Γίνεται true ΜΟΝΟ οταν πατησει finish ο χρηστης
    //States για loading και API error
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState(""); // Εμφανίζει λάθος οταν οι απαντησεις ειναι συμπληρωμένες, αλλα απέτυχε το request προς το backend

    const question = questions[currentQuestion];

    const allQuestionsAnswered = questions.every( // Η every επιστρεφει true μόνο αν καθε ερώτηση έχει τουλάχιστον μια απάντηση
        (questionItem) =>
            answers[questionItem.id] &&
            answers[questionItem.id].length > 0
    );

    const filteredOptions = question.options
        ? question.options.filter((option) =>
            option.toLowerCase().includes(searchTerm.toLowerCase())
        ) 
        : [];

    function handleAnswer(option) {
       const currentAnswers = answers[question.id];

       const optionIsSelected = currentAnswers.includes(option);

       let updatedAnswers;

       if(optionIsSelected){
            updatedAnswers = currentAnswers.filter(
                (currentOption) => currentOption !== option
            );
       } else{
            updatedAnswers = [...currentAnswers, option];
       }

       setAnswers({
        ...answers,
        [question.id]: updatedAnswers
       });

    } 

    function handlePrevious() {
        if(currentQuestion > 0){
            setCurrentQuestion(currentQuestion - 1);
            setDropdownOpen(false);
            setSearchTerm("");
        }
    }

    async function handleNext() {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setDropdownOpen(false);
            setSearchTerm("");
            setSubmissionError("");
            return;
        }

        setFinishAttempted(true); //Αυτό γινεται μονο στην τελευταια ερωτηση 
        
        if (!allQuestionsAnswered) {
            return;
        }

        setIsSubmitting(true);
        setSubmissionError("");

        try {
            await saveQuestionnaire(answers);
            navigate("/recommendations");

        }catch(error) {
            console.error("Questionnaire submission failed:", error);

            if(error.status === 401){ //Αν ο χρήστης δεν ειναι πλεον authenticated, τον στελνουμε πισω στην Login
                localStorage.removeItem("accessToken");
                navigate("/login");
                return;
            }

            setSubmissionError(
                error.message || "Could not save your preferences."
            );
        } finally {
            setIsSubmitting(false);
        }

        console.log(answers);
        
    }
    
    

    return (
        <main className="questionnaire-page">

            <div className="questionnaire-card">

                <p className="question-progress">
                    Question {currentQuestion + 1} of {questions.length}
                </p>

                <h1>{question.question}</h1>

                <p className="question-help"> {question.helpText} </p>

                {question.type === "dropdown" && (
                    <div className="multi-select">

                        <button
                            type="button"
                            className="multi-select-toggle"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                        >

                                {answers[question.id].length > 0
                                ? `${answers[question.id].length} selected`
                                : "Select options"}

                        </button>

                        {dropdownOpen && (
                                    <div className="multi-select-menu">

                                        <input
                                            type="search"
                                            className="multi-select-search"
                                            placeholder="Search..."
                                            value={searchTerm}
                                            onChange={(event) =>
                                                setSearchTerm(event.target.value)
                                            }
                                        />

                                        <div className="multi-select-options">
                                            {filteredOptions.map((option) => (
                                                <label
                                                    key={option}
                                                    className="multi-select-option"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={answers[question.id].includes(option)}
                                                        onChange={() => handleAnswer(option)}
                                                    />

                                                    <span>{option}</span>
                                                </label>
                                            ))}
                                        </div>

                                    </div>
                                )}

                                <div className="selected-options">
                                    {answers[question.id].map((option) => (
                                        <button
                                            type="button"
                                            key={option}
                                            onClick={() => handleAnswer(option)}
                                        >
                                            {option}
                                            <span> ×</span>
                                        </button>
                                    ))}
                                </div>

                            </div>
                        )}

                        {question.type === "multipleChoice" && (
                            <div className="question-options">
                                {question.options.map((option) => (
                                    <button
                                        type="button"
                                        key={option}
                                        className={
                                            answers[question.id].includes(option)
                                                ? "option-button selected"
                                                : "option-button"
                                        }
                                        onClick={() => handleAnswer(option)}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}

                        

                        
                        {finishAttempted && currentQuestion === questions.length - 1 && !allQuestionsAnswered && (    // Με αυτό εμφανίζεται το μήνυμα μόνο όταν ο χρηστης πατησει το finish button και χωρις να εχει απαντησει σε ολες τις ερωτησεις
                                <p className="questionnaire-error">
                                    Please answer all questions before finishing.
                                </p>
                            )
                        }

                        {submissionError && (
                            <p className="questionnaire-error">
                                {submissionError}
                            </p>
                        )}

                        <div className="question-navigation">
                            
                            <button
                                type="button"
                                className="previous-button"
                                onClick={handlePrevious}
                                disabled={currentQuestion === 0 || isSubmitting}
                            >
                                Previous

                            </button>
                            <button
                                type="button"
                                className="next-button"
                                onClick={handleNext}
                            >
                                {isSubmitting
                                    ? "Saving..."
                                    :   currentQuestion === questions.length - 1
                                        ? "Finish"
                                        : "Next"}
                            </button>

                        </div>    

            </div>

        </main>
    );
}

export default Questionnaire;