import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Chatbot from './components/Chatbot/Chatbot';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* any routes in future */}
        </Routes>
        <Chatbot />
      </div>
    </Router>
  );
}

export default App;