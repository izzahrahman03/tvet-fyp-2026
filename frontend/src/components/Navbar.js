// Navbar.jsx — EduLearn
// Styles: globals.css
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
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
        <button className="nav-link">Home</button>
        <button className="nav-link">About Us</button>
        <button className="nav-link">Contact</button>
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