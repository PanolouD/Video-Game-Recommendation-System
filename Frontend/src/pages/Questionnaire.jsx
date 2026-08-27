import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Questionnaire.css";

function Questionnaire() {

    const navigate = useNavigate();

    const questions = [
        {
            id: 1,
            question: "What genre do you prefer?",
            options: [
                "RPG",
                "Action",
                "Adventure",
                "Strategy",
                "Horror"
            ]
        },
        {
            id: 2,
            question: "Do you prefer single-player or multiplayer games?",
            options: [
                "Single-player",
                "Multiplayer",
                "Both"
            ]
        },
        {
            id: 3,
            question: "How important is the story to you?",
            options: [
                "Very important",
                "Somewhat important",
                "Not important"
            ]
        },
        {
            id: 4,
            question: "How do you feel about difficult games?",
            options: [
                "I enjoy a challenge",
                "Balanced difficulty",
                "I prefer easier games"
            ]
        },
        {
            id: 5,
            question: "What type of world do you prefer?",
            options: [
                "Open world",
                "Linear",
                "Both"
            ]
        }
    ];

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});

    const question = questions[currentQuestion];

    function handleAnswer(option) {
        setAnswers({
            ...answers,
            [question.id]: option
        });
    }

    function handleNext() {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            console.log(answers);

            navigate("/results");
        }
    }

    return (
        <main className="questionnaire-page">

            <div className="questionnaire-card">

                <p className="question-progress">
                    Question {currentQuestion + 1} of {questions.length}
                </p>

                <h1>{question.question}</h1>

                <div className="question-options">

                    {question.options.map((option) => (
                        <button
                            key={option}
                            className={
                                answers[question.id] === option
                                    ? "option-button selected"
                                    : "option-button"
                            }
                            onClick={() => handleAnswer(option)}
                        >
                            {option}
                        </button>
                    ))}

                </div>

                <button
                    className="next-button"
                    onClick={handleNext}
                    disabled={!answers[question.id]}
                >
                    {currentQuestion === questions.length - 1
                        ? "Finish"
                        : "Next"}
                </button>

            </div>

        </main>
    );
}

export default Questionnaire;