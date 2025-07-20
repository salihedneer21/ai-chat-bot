require('dotenv').config();
const OpenAI = require('openai');
const Fuse = require('fuse.js');
const metadata = require('../../data/metadata.json');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize Fuse instances for fuzzy matching
const topicsFuse = new Fuse(metadata.topics, {
  threshold: 0.2,
  keys: ['.']
});

const subjectsFuse = new Fuse(metadata.subjects, {
  threshold: 0.2,
  keys: ['.']
});

function findMatchesInMetadata(topics) {
  const matchedSubjects = new Set();
  const matchedTopics = new Set();

  topics.forEach(topicObj => {
    topicObj.topic.forEach(term => {
      // Search in subjects
      const subjectMatches = subjectsFuse.search(term);
      subjectMatches.forEach(match => matchedSubjects.add(match.item));

      // Search in topics
      const topicMatches = topicsFuse.search(term);
      topicMatches.forEach(match => matchedTopics.add(match.item));
    });
  });

  return {
    subjects: Array.from(matchedSubjects),
    topics: Array.from(matchedTopics)
  };
}

async function extractFromPrompt(prompt) {
  const systemPrompt = `
You're a Medical Study Assistant. Your task is to clean and structure user requests for medical questions.

Your task is to:
1. Extract the core question intent (no subject/topic names in context)
2. Count total questions/flashcards requested (default to 3 if not specified)
3. Determine type (Flashcard/Question/General)

Return JSON like:
{
  "total": <number of questions>,
  "user_query": "<user query>",
  "type": "<Flashcard/Question/General>",
  "pre-prompt": "<pre-prompt for LLM>",
  "context": "<clean scenario/situation - NO subject/topic names. If unclear, return empty string>",
  "topics": [
    { "topic": [""]}
  ]
}

Example:
Input: "I need questions about stomach pain and surgery"
Output: {
  "total": 2,
  "user_query": "I need questions about stomach pain and surgery",
  "type": "Question",
  "pre-prompt" : <shown to the user before generating the questions>",
  "context": "Abdominal pain requiring surgical intervention",
  "topics": [
    { "topic": ["Abdominal","Clinical Surgery"]}
  ]
}

Important:
- Defining type only if user mentions "flashcard" or "question/quiz" or else consider general (eg : user explicitly asks for flashcards or questions then set type accordingly or else set type to general)
- Use "Question" instead of "Quiz" consistently
- Context should focus on scenarios/symptoms/procedures. don't use any human terms such as studying, understanding, explanaing just pure medical terms and related to it, don't make it empty add words from the prompt
eg : questions related to bone marrow, then context should be "Bone marrow" eg 2 : questions related to stomach ache should be "Abdominal pain", use the most relevant medical term or user asked words if it can be used
- pre prompt means that will be shown to the user before generating the questions, so it should be clear and concise and include under 50 words above 40 words
- Subjects and topics should be exact matches from the metadata
- User query is same as the input prompt
`;

  const userMessage = `Prompt: ${prompt}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.2
  });

  const jsonBlock = response.choices[0].message.content.trim();

  try {
    const parsed = JSON.parse(jsonBlock);
    
    // Standardize the type values
    if (parsed.type) {
      parsed.type = parsed.type.toLowerCase();
      if (parsed.type.includes('flashcard')) {
        parsed.type = 'flashcard';
      } else if (parsed.type.includes('question')) {
        parsed.type = 'question';
      } else {
        parsed.type = 'general';
      }
    }

    const matches = findMatchesInMetadata(parsed.topics);
    
    return {
      ...parsed,
      subjects: matches.subjects,
      topics: matches.topics
    };
  } catch (err) {
    console.error('❌ Failed to parse JSON from model:', err.message);
    console.log('Raw content:', jsonBlock);
    return null;
  }
}

module.exports = {
  extractFromPrompt
};