import { Link, useLocation, useNavigate } from "react-router-dom";
import "../css/NavBar.css";

function NavBar(){

    const navigate = useNavigate();
    useLocation();

    const isLoggedIn = !!localStorage.getItem("accessToken");

    function handleLogout(){
        localStorage.removeItem("accessToken");
        navigate("/");
    }

    return(
        <nav className="navbar">
            <Link to="/" className="navbar-logo"> [LOGO] </Link>  

            <div className="navbar-links">

                {isLoggedIn ? (
                    <>
                        <Link to="/library">Library</Link>
                        <Link to="/questionnaire">Questionnaire</Link>
                        <Link to="/recommendations">Recommendations</Link>

                        <button className="navbar-logout" onClick={handleLogout}>Logout</button>

                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/signup">Sign Up</Link>
                    </>
                )}

            </div>

        </nav>
    );
}
export default NavBar;