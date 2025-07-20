import React, { useState } from 'react';
import './Chatbot.css';
import Quiz from '../Quiz/Quiz';
import Flashcard from '../Flashcard/Flashcard';

const Chatbot = () => {
  const initialMessage = {
    sender: 'bot',
    timestamp: new Date().getTime(),
    text: "Hey there! 👋\nHow can I help?",
    type: 'welcome'
  };

  const popularSearches = [
    "What bone articulates with the femur?",
    "What topic is important to study for NEET-PG in Osteology?",
    "Which best serves the purpose of osteology?"
  ];

  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState('');
  const [currentResponse, setCurrentResponse] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      text: input,
      sender: 'user',
      timestamp: new Date().getTime()
    };

    setMessages([...messages, userMessage]);
    setInput('');

    try {
      // Validate query before sending
      if (!input) {
        throw new Error('Query cannot be empty');
      }

      const response = await fetch('http://localhost:3000/api/search/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: input.trim() 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get response');
      }

      const data = await response.json();
      
      // Validate response data
      if (!data || !data.parsed) {
        throw new Error('Invalid response format');
      }

      let botMessage = {
        sender: 'bot',
        timestamp: new Date().getTime(),
        type: data.parsed.type || 'text'
      };

      if (data.parsed.type === 'question' && data.results) {
        botMessage.content = data.results;
        botMessage.text = data.parsed['pre-prompt'];
      } else if (data.parsed.type === 'flashcard' && data.results) {
        botMessage.content = data.results;
        botMessage.text = data.parsed['pre-prompt'];
      } else {
        // General chat response
        botMessage.text = data.llmResponse || 'No response available';
      }

      setCurrentResponse(botMessage);
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        text: `Error: ${error.message || 'Something went wrong'}`,
        sender: 'bot',
        timestamp: new Date().getTime()
      }]);
    }
  };

  const renderResponse = (message) => {
    if (message.sender === 'user') {
      return <p>{message.text}</p>;
    }

    switch (message.type) {
      case 'welcome':
        return (
          <div className="welcome-message">
            <div className="welcome-title">How can I help?</div>
            <div className="action-buttons">
              <button className="action-button">
                <span role="img" aria-label="search">🔍</span>
                <span className="action-button-text">Find PYQs</span>
              </button>
              <button className="action-button">
                <span role="img" aria-label="flashcards">📝</span>
                <span className="action-button-text">Flashcards</span>
              </button>
            </div>
            <div className="popular-searches">
              <h3>POPULAR SEARCHES</h3>
              {popularSearches.map((search, index) => (
                <div 
                  key={index} 
                  className="search-item"
                  onClick={() => setInput(search)}
                >
                  <span className="search-icon">🔍</span>
                  {search}
                </div>
              ))}
            </div>
          </div>
        );
      case 'question':
        return (
          <div>
            <p>{message.text}</p>
            <Quiz questions={message.content} />
          </div>
        );
      case 'flashcard':
        return (
          <div>
            <p>{message.text}</p>
            <Flashcard cards={message.content} />
          </div>
        );
      default:
        return <p>{message.text}</p>;
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chat-header">
        <span className="header-title">Ask Rezzy</span>
        <div className="header-actions">
          <button className="header-button">
            Start New Chat
            <span>+</span>
          </button>
          <button className="header-button">
            View Past Chats
            <span>🕒</span>
          </button>
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {renderResponse(message)}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Chatbot;