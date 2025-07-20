import React, { useState } from 'react';

const Flashcard = ({ cards }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  if (!cards || cards.length === 0) {
    return <div>No flashcards available</div>;
  }

  const currentCard = cards[currentCardIndex];
  const totalCards = cards.length;

  const handleNext = () => {
    if (currentCardIndex < totalCards - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  return (
    <div className="flashcard-container">
      <div className="flashcard-header">
        <h2>FLASHCARD {currentCardIndex + 1} OF {totalCards}</h2>
      </div>

      <div className="flashcard-content">
        <div className="card">
          <div className="card-section">
            <h3>FRONT</h3>
            <p>{currentCard.content.front_content}</p>
          </div>
          <hr className="divider" />
          <div className="card-section">
            <h3>BACK</h3>
            <p>{currentCard.content.back_content}</p>
          </div>
        </div>
      </div>

      <div className="navigation-controls">
        <button 
          className="nav-button previous" 
          onClick={handlePrev}
          disabled={currentCardIndex === 0}
        >
          <span className="nav-icon">‹</span>
          <span>PREVIOUS</span>
        </button>
        <button 
          className="nav-button next" 
          onClick={handleNext}
          disabled={currentCardIndex === totalCards - 1}
        >
          <span>NEXT</span>
          <span className="nav-icon">›</span>
        </button>
      </div>

      <style jsx>{`
        .flashcard-container {
          max-width: 800px;
          margin: 20px auto;
          padding: 20px;
          font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        .flashcard-header {
          text-align: left;
          margin-bottom: 30px;
        }

        .flashcard-header h2 {
          color: #666;
          font-size: 24px;
          font-weight: 500;
          margin: 0;
        }

        .flashcard-content {
          margin-bottom: 30px;
        }

        .card {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .divider {
          border: none;
          border-top: 1px solid #eee;
          margin: 30px 0;
        }

        .card-section h3 {
          color: #999;
          font-size: 18px;
          font-weight: 500;
          margin-bottom: 20px;
          text-transform: uppercase;
        }

        .card-section p {
          color: #333;
          font-size: 22px;
          line-height: 1.5;
          margin: 0;
        }

        .navigation-controls {
          display: flex;
          justify-content: space-between;
          padding: 0 20px;
        }

        .nav-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          color: #666;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nav-button:hover:not(:disabled) {
          background: #f8f9fa;
          border-color: #ccc;
        }

        .nav-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .nav-icon {
          font-size: 24px;
          line-height: 1;
        }

        .previous .nav-icon {
          margin-right: 4px;
        }

        .next .nav-icon {
          margin-left: 4px;
        }
      `}</style>
    </div>
  );
};

export default Flashcard;