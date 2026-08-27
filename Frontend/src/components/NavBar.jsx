import { Link } from "react-router-dom";
import "../css/NavBar.css";

function NavBar(){
    return(
        <nav className="navbar">
            <Link to="/" className="navbar-logo"> [LOGO] </Link>  

            <div className="navbar-links">
                <Link to="/library">Library</Link>
                <Link to="/questionnaire">Questionnaire</Link>
                <Link to="/login">Login</Link>
                <Link to="/signup">Sign Up</Link>
            </div>

        </nav>
    );
}
export default NavBar;