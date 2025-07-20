const fs = require('fs');
const path = require('path');

function getUniqueMetadata() {
  const questions = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/questions.json'), 'utf8'));
  const flashcards = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/flashcards.json'), 'utf8'));

  const subjects = new Set();
  const topics = new Set();

  // Process questions
  questions.forEach(item => {
    if (item.subject) subjects.add(item.subject);
    if (item.topic) topics.add(item.topic);
  });

  // Process flashcards
  flashcards.forEach(item => {
    if (item.subject) subjects.add(item.subject);
    if (item.topic) topics.add(item.topic);
  });

  // Convert to sorted arrays
  const sortedSubjects = Array.from(subjects).sort();
  const sortedTopics = Array.from(topics).sort();

  const result = {
    subjects: sortedSubjects,
    topics: sortedTopics,
    counts: {
      subjects: sortedSubjects.length,
      topics: sortedTopics.length
    }
  };

  // Write to file
  fs.writeFileSync(
    path.join(__dirname, '../data/metadata.json'),
    JSON.stringify(result, null, 2)
  );

  console.log('Subjects:', sortedSubjects);
  console.log('Topics:', sortedTopics);
  console.log('Total unique subjects:', sortedSubjects.length);
  console.log('Total unique topics:', sortedTopics.length);
}

getUniqueMetadata();