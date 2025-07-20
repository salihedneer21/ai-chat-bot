require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');
const OpenAI = require('openai');
const path = require('path');
const fs = require('fs').promises;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

async function getEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function getLLMResponse(query, searchResults) {
  if (!searchResults || searchResults.length === 0) {
    return "I don't have enough information to provide a specific response to your query.";
  }

  const context = searchResults.map(result => {
    if (result.content) {
      if (result.type === 'flashcard') {
        return `Flashcard Content:\nFront: ${result.content.front_content}\nBack: ${result.content.back_content}`;
      } else if (result.type === 'question') {
        return `Question Content:\nQ: ${result.content.question_text}\nA: ${result.content.explanation}`;
      }
    }
    return '';
  }).filter(Boolean).join('\n\n');

  if (!context) {
    return "I found some related content but couldn't extract the specific information needed.";
  }

  const prompt = `You are a helpful educational assistant. Use the following retrieved content to answer the user's question.
If you don't have enough information, say so and provide a general response.

Retrieved Content:
${context}

User Query: ${query}

Please provide a clear and concise response.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('LLM response error:', error);
    return null;
  }
}

async function semanticSearch(query, metadata = null) {
  if (!query) {
    throw new Error('Query is required for semantic search');
  }

  const index = pinecone.index(process.env.PINECONE_INDEX);
  const queryEmbedding = await getEmbedding(query);

  // Prepare filter based on type only
  let filter = {};

  if (metadata?.type && metadata.type.toLowerCase() !== 'general') {
    filter = {
      type: metadata.type.toLowerCase()
    };
  }

  try {
    const searchResults = await index.query({
      vector: queryEmbedding,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      topK: Math.min(Math.max(1, metadata?.total || 5), 10), // Ensure between 1 and 10
      includeMetadata: true
    });

    if (!searchResults?.matches) {
      return [];
    }

    return searchResults.matches.map(match => ({
      id: match.id,
      score: match.score,
      subject: match.metadata?.subject || 'Unknown subject',
      topic: match.metadata?.topic || 'Unknown topic',
      type: match.metadata?.type || 'Unknown type'
    }));

  } catch (error) {
    console.error('Search error:', error);
    throw new Error('Failed to perform semantic search');
  }
}

async function fetchContentForId(id) {
  try {
    const flashcardsPath = path.join(__dirname, '../../data/flashcards.json');
    const questionsPath = path.join(__dirname, '../../data/questions.json');

    const [flashcardsData, questionsData] = await Promise.all([
      fs.readFile(flashcardsPath, 'utf8'),
      fs.readFile(questionsPath, 'utf8')
    ]);

    const flashcards = JSON.parse(flashcardsData);
    const questions = JSON.parse(questionsData);

    // Search in flashcards
    const flashcard = flashcards.find(f => f.id === id);
    if (flashcard) {
      return {
        type: 'flashcard',
        content: {
          front_content: flashcard.front_content,
          back_content: flashcard.back_content
        }
      };
    }

    // Search in questions
    const question = questions.find(q => q.id === id);
    if (question) {
      return {
        type: 'question',
        content: {
          question_text: question.question_text,
          explanation: question.explanation,
          options: question.options.map(opt => ({
            text: opt.text,
            is_correct: opt.is_correct
          }))
        }
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching content:', error);
    return null;
  }
}

module.exports = {
  semanticSearch,
  fetchContentForId,
  getLLMResponse
};