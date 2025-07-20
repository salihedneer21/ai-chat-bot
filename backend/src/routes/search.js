const express = require('express');
const router = express.Router();
const { extractFromPrompt } = require('../core/parseWithLLM');
const { semanticSearch, fetchContentForId, getLLMResponse } = require('../core/searchRAG');

// Input validation middleware
const validateQuery = (req, res, next) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'Valid query string is required' });
  }
  req.body.query = query.trim();
  next();
};

router.post('/query', validateQuery, async (req, res) => {
  try {
    const { query } = req.body;
    console.log('📝 Incoming query:', query);

    // Step 1: Parse with LLM
    console.log('🔄 Starting LLM parsing...');
    const parsedData = await extractFromPrompt(query);
    console.log('✅ Parsed data:', JSON.stringify(parsedData, null, 2));

    if (!parsedData) {
      console.log('❌ Failed to parse query');
      return res.status(422).json({ 
        error: 'Failed to parse query',
        details: 'The query could not be processed by the LLM'
      });
    }

    let contentResults = [];
    let llmResponse = null;

    // Handle based on query type
    if (parsedData.type === 'general' || !parsedData.context) {
      console.log('🔄 Processing as general query...');
      llmResponse = await getLLMResponse(query, []);
      console.log('✅ General LLM response received');
    } else {
      // For specific queries, do semantic search
      console.log('🔄 Starting semantic search...');
      const searchResults = await semanticSearch(parsedData.context, {
        type: parsedData.type,
        total: parsedData.total || 3
      });
      console.log('✅ Search results:', JSON.stringify(searchResults, null, 2));

      if (searchResults && searchResults.length > 0) {
        console.log('🔄 Fetching content for results...');
        contentResults = await Promise.all(
          searchResults.map(async (result) => {
            const content = await fetchContentForId(result.id);
            return {
              ...result,
              content: content?.content || null
            };
          })
        );
        console.log('✅ Content fetched');
      }

      // Generate LLM response if needed
      if (!contentResults.some(r => r.content)) {
        console.log('🔄 Generating fallback LLM response...');
        llmResponse = await getLLMResponse(query, []);
      }
    }

    console.log('🔄 Preparing response...');
    res.json({
      parsed: parsedData,
      results: contentResults,
      llmResponse: llmResponse || "I'll need more specific information to help you. Could you please provide more details?",
      metadata: {
        totalResults: contentResults.length,
        queryType: parsedData.type,
        context: parsedData.context
      }
    });

  } catch (error) {
    console.error('❌ Search error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;