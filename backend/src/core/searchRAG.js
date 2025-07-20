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
  console.log('🔄 getLLMResponse called with query:', query);
  console.log('searchResults:', JSON.stringify(searchResults, null, 2));

  const prompt = `You are a helpful medical education assistant. 
Query: "${query}"
${searchResults && searchResults.length > 0 
  ? `\nContext:\n${searchResults.map(r => r.content ? JSON.stringify(r.content) : '').join('\n')}` 
  : '\nNo specific context available - provide a general response'}

Please provide a clear and helpful response. If this is a follow-up question, ask for more context if needed.`;

  try {
    console.log('🔄 Sending prompt to OpenAI...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });
    
    console.log('✅ Received response from OpenAI');
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('❌ LLM response error:', error);
    console.error('Error stack:', error.stack);
    return "I apologize, but I'm having trouble processing your request. Could you please try again?";
  }
}

async function semanticSearch(query, metadata = null) {
  console.log('🔄 semanticSearch called with:', { query, metadata });

  // Handle empty/undefined query
  if (!query || query.trim().length === 0) {
    console.log('⚠️ Empty query detected, skipping semantic search');
    return [];
  }

  try {
    const index = pinecone.index(process.env.PINECONE_INDEX);
    console.log('🔄 Getting embedding for query...');
    const queryEmbedding = await getEmbedding(query);
    
    let filter = {};
    if (metadata?.type && metadata.type.toLowerCase() !== 'general') {
      filter = { type: metadata.type.toLowerCase() };
    }
    
    console.log('🔄 Executing Pinecone query with filter:', filter);
    const searchResults = await index.query({
      vector: queryEmbedding,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      topK: Math.min(Math.max(1, metadata?.total || 5), 10),
      includeMetadata: true
    });

    console.log('✅ Search results received');
    return searchResults?.matches 
      ? searchResults.matches.map(match => ({
          id: match.id,
          score: match.score,
          subject: match.metadata?.subject || 'Unknown subject',
          topic: match.metadata?.topic || 'Unknown topic',
          type: match.metadata?.type || 'Unknown type'
        }))
      : [];

  } catch (error) {
    console.error('❌ Semantic search error:', error);
    console.error('Error stack:', error.stack);
    return [];
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