// Navbar.jsx — EduLearn
// Styles: globals.css
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const scrollTo = (id) => {
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="nav">
      <div className="nav-logo" onClick={() => navigate("/")}>
        <img
          src="https://learn.vitrox.academy/pluginfile.php/1/theme_edumy/headerlogo_mobile/1663920908/Vitrox%20Academy%20Logo%20FINAL-20%20MAY%202020-high%20res%20%281%29.png"
          alt="ViTrox Academy"
          className="nav-logo-img"
        /> ViTrox Academy
      </div>

      <div className="nav-links">
        <button className="nav-link" onClick={() => scrollTo("announcements")}>Announcements</button>
        <button className="nav-link" onClick={() => scrollTo("background")}>Background</button>
        <button className="nav-link" onClick={() => scrollTo("components")}>Programme Components</button>
        <button className="nav-link" onClick={() => scrollTo("application")}>Application Process</button>
        <button
          className="nav-btn nav-btn-outline"
          onClick={() => navigate("login")}
        >
          Log in
        </button>
        <button
          className="nav-btn nav-btn-solid"
          onClick={() => navigate("signup")}
        >
          Register
        </button>
      </div>
    </nav>
  );
};

export default Navbar;