import React, { useState } from 'react';
import Navigation from '../components/Navigation/Navigation';
import Flashcard from '../components/Flashcard/Flashcard';
import Quiz from '../components/Quiz/Quiz';
import './Study.css';

const Study = () => {
  const [studyType, setStudyType] = useState('flashcard');
  const [currentCard, setCurrentCard] = useState(0);

  const flashcardData = {
    currentCard: 2,
    totalCards: 5,
    front: "Which of these two are the cis vs trans polymer?",
    back: "A couple who had been trying to conceive for the past 4 years came to your clinic for advice."
  };

  const quizData = {
    currentCard: 5,
    question: "A student had his jaw locked while yawning. Which of the following muscles is attached to the articular disc of the temporomandibular joint?",
    options: {
      'A': 'Medial pterygoid',
      'B': 'Temporalis',
      'C': 'Masseter',
      'D': "I'm not sure"
    }
  };

  const handleNext = () => {
    // Add navigation logic
  };

  const handlePrevious = () => {
    // Add navigation logic
  };

  return (
    <div className="study">
      <Navigation />
      <div className="study-content">
        <div className="study-controls">
          <button 
            className={`type-button ${studyType === 'flashcard' ? 'active' : ''}`}
            onClick={() => setStudyType('flashcard')}
          >
            Flashcards
          </button>
          <button 
            className={`type-button ${studyType === 'quiz' ? 'active' : ''}`}
            onClick={() => setStudyType('quiz')}
          >
            Quiz
          </button>
        </div>
        
        {studyType === 'flashcard' ? (
          <Flashcard 
            data={flashcardData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        ) : (
          <Quiz 
            data={quizData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )}
      </div>
    </div>
  );
};

export default Study;