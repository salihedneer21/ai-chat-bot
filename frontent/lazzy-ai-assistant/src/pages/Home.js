import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation/Navigation';
import Chatbot from '../components/Chatbot/Chatbot';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home">
      <Navigation />
      <div className="home-content">
        <div className="hero-section">
          <h1>Welcome to Lezzy AI Assistant</h1>
          <p>Your personal AI-powered learning companion</p>
          <button 
            className="cta-button"
            onClick={() => navigate('/study')}
          >
            Start Learning
          </button>
        </div>
        <div className="chat-section">
          <h2>Ask Me Anything</h2>
          <Chatbot />
        </div>
      </div>
    </div>
  );
};

export default Home;