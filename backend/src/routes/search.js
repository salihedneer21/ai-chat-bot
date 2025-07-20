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

    // Step 1: Parse with LLM
    const parsedData = await extractFromPrompt(query);
    if (!parsedData) {
      return res.status(422).json({ 
        error: 'Failed to parse query',
        details: 'The query could not be processed by the LLM'
      });
    }

    // Step 2: Perform semantic search
    const searchResults = await semanticSearch(parsedData.context, {
      type: parsedData.type,
      total: parsedData.total || 3 // Ensure default value
    });

    if (!searchResults || searchResults.length === 0) {
      return res.json({
        parsed: parsedData,
        results: [],
        llmResponse: 'No relevant content found for your query.'
      });
    }

    // Step 3: Fetch content for results
    const contentResults = await Promise.all(
      searchResults.map(async (result) => {
        const content = await fetchContentForId(result.id);
        return {
          ...result,
          content: content?.content || null
        };
      })
    );

    // Step 4: Generate LLM response for general
    let llmResponse = null;
    if (parsedData.type === 'general' || !contentResults.some(r => r.content)) {
      llmResponse = await getLLMResponse(query, contentResults);
    }

    res.json({
      parsed: parsedData,
      results: contentResults,
      llmResponse,
      metadata: {
        totalResults: contentResults.length,
        queryType: parsedData.type,
        context: parsedData.context
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;