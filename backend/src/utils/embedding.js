require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getEmbeddingsBatch(texts) {
  const response = await openai.embeddings.create({
    // 1536 vector dimension, must be same in pinecone as well, newer version is available # small,cheap,cost effective
    model: "text-embedding-ada-002",
    input: texts,
  });
  
  return response.data.map(item => item.embedding);
}

module.exports = { getEmbeddingsBatch };
