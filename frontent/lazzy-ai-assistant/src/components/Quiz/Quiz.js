import React, { useState } from 'react';
import Markdown from 'markdown-to-jsx';

const Quiz = ({ questions }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  
  // Early return if no questions provided
  if (!questions || questions.length === 0) {
    return <div>No questions available</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  const handleAnswerSelect = (answer) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: answer
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const getOptionClass = (option) => {
    const selectedAnswer = selectedAnswers[currentQuestionIndex];
    if (!selectedAnswer) return '';
    
    const isCorrect = option.is_correct;
    if (selectedAnswer === option.text) {
      return isCorrect ? 'correct' : 'incorrect';
    }
    return '';
  };

  const getStatusIcon = (option) => {
    const selectedAnswer = selectedAnswers[currentQuestionIndex];
    if (!selectedAnswer) return null;

    if (option.is_correct) {
      return <div className="status-icon check">✓</div>;
    }
    if (selectedAnswer === option.text && !option.is_correct) {
      return <div className="status-icon cross">×</div>;
    }
    return null;
  };

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div className="quiz-title">
          <div className="quiz-icon">?</div>
          <span>Quiz</span>
        </div>
        <span className="questions-count">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
      </div>

      <div className="quiz-content">
        <p className="question">{currentQuestion.content.question_text}</p>
        
        <div className="options">
          {currentQuestion.content.options.map((option, index) => (
            <button
              key={index}
              className={`option ${getOptionClass(option)}`}
              onClick={() => handleAnswerSelect(option.text)}
              disabled={selectedAnswers[currentQuestionIndex]}
            >
              <div className="option-content">
                <span className="option-key">{String.fromCharCode(65 + index)}</span>
                <span className="option-value">{option.text}</span>
              </div>
              {getStatusIcon(option)}
            </button>
          ))}
        </div>

        {selectedAnswers[currentQuestionIndex] && (
          <div className="explanation">
            <h4>Explanation:</h4>
            <Markdown className="markdown-content">
              {currentQuestion.content.explanation}
            </Markdown>
          </div>
        )}

        <div className="navigation-buttons">
          <button 
            onClick={handlePrev} 
            disabled={currentQuestionIndex === 0}
            className="nav-button"
          >
            Previous
          </button>
          <button 
            onClick={handleNext} 
            disabled={currentQuestionIndex === totalQuestions - 1}
            className="nav-button"
          >
            Next
          </button>
        </div>
      </div>

      <style jsx>{`
        .quiz-container {
          max-width: 600px;
          margin: 20px auto;
          padding: 30px;
          background: white;
          border: 2px solid #4a90e2;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .quiz-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }

        .quiz-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 28px;
          font-weight: 500;
          color: #666;
        }

        .quiz-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: #4a90e2;
          color: white;
          border-radius: 50%;
          font-size: 18px;
          font-weight: bold;
        }

        .questions-count {
          color: #999;
          font-size: 24px;
          font-weight: 400;
        }

        .question {
          font-size: 20px;
          line-height: 1.4;
          color: #333;
          margin-bottom: 40px;
          font-weight: 400;
        }

        .options {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 16px 20px;
          border: 1px solid #E0E0E0;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
          min-height: 60px;
          font-size: 16px;
        }

        .option-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .option-key {
          font-weight: 500;
          color: #757575;
          font-size: 16px;
          min-width: 20px;
        }

        .option-value {
          font-size: 16px;
          color: #424242;
          font-weight: 400;
        }

        .option:hover {
          background: #F5F5F5;
        }

        .option.correct {
          background: #E8F5E9;
          border: 1px solid #4CAF50;
        }

        .option.correct .option-value {
          color: #2e7d32;
          font-weight: 500;
        }

        .option.incorrect {
          background: #FFEBEE;
          border: 1px solid #F44336;
        }

        .option.incorrect .option-value {
          color: #c62828;
          font-weight: 500;
        }

        .status-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          font-size: 16px;
          font-weight: bold;
          flex-shrink: 0;
        }

        .status-icon.check {
          background: #4CAF50;
          color: white;
        }

        .status-icon.cross {
          background: #F44336;
          color: white;
        }

        .option:focus {
          outline: none;
        }

        .navigation-buttons {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #E0E0E0;
        }

        .nav-button {
          padding: 10px 20px;
          background: #4a90e2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }

        .nav-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .explanation {
          margin-top: 20px;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 4px;
        }

        .explanation h4 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .markdown-content {
          margin: 0;
          color: #666;
          line-height: 1.4;
        }

        .markdown-content h2 {
          font-size: 1.2em;
          margin: 1em 0 0.5em;
          color: #333;
        }

        .markdown-content ul {
          margin: 0.5em 0;
          padding-left: 1.5em;
        }

        .markdown-content li {
          margin: 0.3em 0;
        }

        .markdown-content p {
          margin: 0.5em 0;
        }
      `}</style>
    </div>
  );
};

export default Quiz;
