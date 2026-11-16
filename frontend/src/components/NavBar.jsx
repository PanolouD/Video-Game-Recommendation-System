import { Link, useNavigate } from "react-router-dom";
import gamepadLogo from "../assets/logo-photos/game-on.jpg";
import { useAuth } from "../Context/AuthContext";
import {getApiAssetUrl} from "../services/api";

import "../css/NavBar.css";


function NavBar(){

    const navigate = useNavigate();

    const {currentUser, authLoading, logout,} = useAuth();

    const isLoggedIn = Boolean(currentUser);

    async function handleLogout(){
        await logout();
        navigate("/");
    }

    if(authLoading) {
        return null;
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