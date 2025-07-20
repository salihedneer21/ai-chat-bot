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

// SSE endpoint for streaming responses
router.post('/query-stream', validateQuery, async (req, res) => {
  try {
    const { query } = req.body;
    console.log('📝 Incoming query:', query);

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Helper function to send SSE messages
    const sendEvent = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Step 1: Parse with LLM and send pre-prompt immediately
    console.log('🔄 Starting LLM parsing...');
    sendEvent('parsing', { status: 'Analyzing your request...' });
    
    const parsedData = await extractFromPrompt(query);
    console.log('✅ Parsed data:', JSON.stringify(parsedData, null, 2));

    if (!parsedData) {
      sendEvent('error', { message: 'Failed to parse query' });
      res.end();
      return;
    }

    // Send pre-prompt immediately
    if (parsedData['pre-prompt']) {
      sendEvent('pre-prompt', {
        text: parsedData['pre-prompt'],
        type: parsedData.type
      });
    }

    let contentResults = [];
    let llmResponse = null;

    // Handle based on query type
    if (parsedData.type === 'general' || !parsedData.context) {
      sendEvent('generating', { status: 'Generating response...' });
      llmResponse = await getLLMResponse(query, []);
      
      sendEvent('complete', {
        parsed: parsedData,
        results: [],
        llmResponse: llmResponse,
        metadata: {
          totalResults: 0,
          queryType: parsedData.type,
          context: parsedData.context
        }
      });
    } else {
      // For specific queries, do semantic search
      sendEvent('searching', { status: 'Finding relevant content...' });
      
      const searchResults = await semanticSearch(parsedData.context, {
        type: parsedData.type,
        total: parsedData.total || 3
      });

      if (searchResults && searchResults.length > 0) {
        sendEvent('fetching', { status: 'Preparing content...' });
        
        contentResults = await Promise.all(
          searchResults.map(async (result) => {
            const content = await fetchContentForId(result.id);
            return {
              ...result,
              content: content?.content || null
            };
          })
        );
      }

      // Send final results
      sendEvent('complete', {
        parsed: parsedData,
        results: contentResults,
        llmResponse: llmResponse,
        metadata: {
          totalResults: contentResults.length,
          queryType: parsedData.type,
          context: parsedData.context
        }
      });
    }

    res.end();

  } catch (error) {
    console.error('❌ Search error:', error);
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ message: error.message })}\n\n`);
    res.end();
  }
});

// Keep existing endpoint for fallback
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