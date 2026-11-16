import {Link} from "react-router-dom";

import gamepadLogo from "../assets/logo-photos/game-on.jpg";

import "../css/Footer.css";

function Footer() {
    return (
        <footer className="site-Footer">
            <div className="footer-content">
                <section className="footer-brand">    
                    <Link
                        to="/"
                        className="footer-logo"
                        aria-label="Go to homepage"
                    >
                        <img src={gamepadLogo} alt="" />

                        <span>GameMatch</span>
                    </Link>

                    <p>
                        Discover games selected around your preferences and the way you enjoy playing.
                    </p>
                </section>

                <nav className="footer-navigation" aria-label="Footer navigation">
                    <h2>Discover</h2>
                    <Link to="/">Popular Games</Link>
                    <Link to="/questionnaire">Questionnaire</Link>
                    <Link to="/recommendations">Recommendations</Link>
                    <Link to="/library">My Library</Link>
                </nav>
            
                <section className="footer-about">
                    <h2>About</h2>

                    <p> A personalized video game recommendation platform.</p>

                    <a href="https://www.igdb.com/" target="blank" rel="noopener noreferrer"> Game data provided by IGDB </a>
                </section>
            </div>

            <div className="footer-bottom">
                <p>
                    © {new Date().getFullYear()} GameMatch.Thesis project.
                </p>

                <p>
                    Find your next game.
                </p>
            </div>
            

        </footer>
    )
}

export default Footer;