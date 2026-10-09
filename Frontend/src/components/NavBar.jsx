import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import gamepadLogo from "../assets/logo-photos/game_over01.jpg";
import {getApiAssetUrl, getCurrentUser} from "../services/api";

import "../css/NavBar.css";


function NavBar(){

    const navigate = useNavigate();
    const location = useLocation();

    const isLoggedIn = !!localStorage.getItem("accessToken");

    const [currentUser, setCurrentUser] = useState(null);

        useEffect(() => {
        let canceled = false;

        async function loadCurrentUser() {
            if(!isLoggedIn) {
                setCurrentUser(null);
                return;
            }
            try {
                const data = await getCurrentUser();

                if(!canceled) {
                    setCurrentUser(data);
                }
            } catch (error) {
                if(!canceled && error.status === 401) {
                    localStorage.removeItem("accessToken");
                    setCurrentUser(null);
                }
            }
        }

        loadCurrentUser();

        function handleProfileUpdated() {
            loadCurrentUser();
        }

        window.addEventListener("profileUPdated", handleProfileUpdated);

        return () => {
            canceled = true;

            window.removeEventListener("profileUpdated", handleProfileUpdated);
        };
    }, [isLoggedIn, location.pathname]);

    function handleLogout(){
        localStorage.removeItem("accessToken");
        setCurrentUser(null);
        navigate("/");
    }

    const profileImageUrl = getApiAssetUrl(currentUser?.image_path || "/static/profile_pics/default.jpg"); // Το backend επιστρεφει το default path οταν ο χρηστης δεν εχει βαλει δικη του φωτογραφία

    return(
        <nav className="navbar">
            <Link to="/" className="navbar-logo" aria-label="Go to homepage"> <img src={gamepadLogo} alt="Game recommendation logo"/>  </Link>  

            <div className="navbar-links">

                {isLoggedIn ? (
                    <>
                        <Link to="/library">Library</Link>
                        <Link to="/questionnaire">Questionnaire</Link>
                        <Link to="/recommendations">Recommendations</Link>
                        <Link 
                        to="/profile"
                        className="navbar-profile"
                        aria-label="Open profile"
                        title={currentUser
                            ? `Profile: ${currentUser.username}`
                            : "Profile"
                        }
                        >
                         <img src={profileImageUrl} alt="" />
                        </Link>

                        <button className="navbar-logout" onClick={handleLogout}>Logout</button>

                    </>
                ) : (
                    <>
                        <Link to="/questionnaire">Questionnaire</Link>
                        <Link to="/recommendations">Recommendations</Link>
                        <Link to="/login">Login</Link>
                        <Link to="/signup">Sign Up</Link>
                    </>
                )}

            </div>

        </nav>
    );
}
export default NavBar;