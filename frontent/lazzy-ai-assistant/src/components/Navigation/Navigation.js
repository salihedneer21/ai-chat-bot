import React from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  return (
    <nav className="navigation">
      <div className="nav-brand">
        <Link to="/">Lezzy AI</Link>
      </div>
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/study" className="nav-link">Study</Link>
      </div>
    </nav>
  );
};

export default Navigation;