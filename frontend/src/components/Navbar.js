// Navbar.jsx — EduLearn
// Styles: globals.css
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
  return (
    <nav className="nav">
      <div className="nav-logo" onClick={() => navigate("/")}>
        <div className="nav-logo-dot" />
        Vitrox Academy
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