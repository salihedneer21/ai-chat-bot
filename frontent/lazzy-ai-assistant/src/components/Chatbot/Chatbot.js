import React, { useState } from 'react';
import './Chatbot.css';
// import Quiz from '../Quiz/Quiz';
// import Flashcard from '../Flashcard/Flashcard';

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
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      text: input,
      sender: 'user',
      timestamp: new Date().getTime()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    setLoadingStage('Analyzing your request...');

    // Add initial loading message
    const loadingMessageId = Date.now();
    const loadingMessage = {
      id: loadingMessageId,
      sender: 'bot',
      timestamp: loadingMessageId,
      type: 'loading',
      text: 'Analyzing your request...'
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Create SSE connection
      const response = await fetch('http://localhost:3000/api/search/query-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: currentInput.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.substring(5).trim());
              handleSSEEvent(currentEvent, data, loadingMessageId);
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessageId 
          ? { ...msg, text: `Error: ${error.message}`, type: 'error' }
          : msg
      ));
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  };

  const handleSSEEvent = (eventType, data, loadingMessageId) => {
    switch (eventType) {
      case 'parsing':
      case 'searching':
      case 'fetching':
      case 'generating':
        setLoadingStage(data.status);
        setMessages(prev => prev.map(msg => 
          msg.id === loadingMessageId 
            ? { ...msg, text: data.status, dots: true }
            : msg
        ));
        break;

      case 'pre-prompt':
        // Update loading message with pre-prompt and keep loading for content
        setMessages(prev => prev.map(msg => 
          msg.id === loadingMessageId 
            ? { 
                ...msg, 
                text: data.text, 
                type: data.type,
                showingPrePrompt: true,
                dots: true
              }
            : msg
        ));
        setLoadingStage('Preparing content...');
        break;

      case 'complete':
        // Replace loading message with final response
        let finalMessage = {
          id: loadingMessageId,
          sender: 'bot',
          timestamp: Date.now(),
          type: data.parsed.type || 'text'
        };

        if (data.parsed.type === 'question' && data.results?.length > 0) {
          finalMessage.content = data.results;
          finalMessage.text = data.parsed['pre-prompt'] || 'Here are your questions:';
        } else if (data.parsed.type === 'flashcard' && data.results?.length > 0) {
          finalMessage.content = data.results;
          finalMessage.text = data.parsed['pre-prompt'] || 'Here are your flashcards:';
        } else {
          finalMessage.text = data.llmResponse || 'No response available';
        }

        setMessages(prev => prev.map(msg => 
          msg.id === loadingMessageId ? finalMessage : msg
        ));
        break;

      case 'error':
        setMessages(prev => prev.map(msg => 
          msg.id === loadingMessageId 
            ? { ...msg, text: `Error: ${data.message}`, type: 'error' }
            : msg
        ));
        break;

      default:
        console.log('Unknown SSE event:', eventType, data);
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
      
      case 'loading':
        return (
          <div className="loading-message">
            <p>{message.text}</p>
            {message.dots && <TypingDots />}
          </div>
        );
      
      case 'question':
        return (
          <div>
            <p>{message.text}</p>
            {/* <Quiz questions={message.content} /> */}
            <div>Questions will be rendered here</div>
          </div>
        );
      
      case 'flashcard':
        return (
          <div>
            <p>{message.text}</p>
            {/* <Flashcard cards={message.content} /> */}
            <div>Flashcards will be rendered here</div>
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
          <div key={message.id || index} className={`message ${message.sender}`}>
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
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

// Typing dots component
const TypingDots = () => {
  return (
    <div className="typing-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
};

export default Chatbot;