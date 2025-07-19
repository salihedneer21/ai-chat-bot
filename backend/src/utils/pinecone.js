require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');

let pinecone = null;
let index = null;

async function initPinecone() {
  if (!index) {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    
    index = pinecone.Index(process.env.PINECONE_INDEX);
  }
  return index;
}

async function upsertBatch(vectors) {
  if (!index) throw new Error('Pinecone index not initialized!');
  await index.upsert(vectors);
}

module.exports = { initPinecone, upsertBatch };

// two functions are available upsert & initiaalise/connect pinecone DB