require('dotenv').config();
const fs = require('fs');
const path = require('path');
const StreamArray = require('stream-json/streamers/StreamArray');
const { getEmbeddingsBatch } = require('../src/utils/embedding');
const { initPinecone, upsertBatch } = require('../src/utils/pinecone');

const BATCH_SIZE = 100;

async function processFile(filePath, type) {
  return new Promise((resolve, reject) => {
    const pipeline = fs.createReadStream(filePath).pipe(StreamArray.withParser());
    let batchItems = [];
    let processed = 0;
    let failed = 0;

    pipeline.on('data', async ({ value: item }) => {
      let inputText;
      let metadata;

      try {
        if (type === 'question') {
          inputText = item.question_text;
          metadata = {
            type: 'question',
            id: item.id,
            subject: item.subject,
            topic: item.topic
          };
        } else if (type === 'flashcard') {
          inputText = item.front_content;
          metadata = {
            type: 'flashcard',
            id: item.id,
            subject: item.subject,
            topic: item.topic
          };
        }

        batchItems.push({
          id: item.id,
          inputText,
          metadata
        });

        if (batchItems.length >= BATCH_SIZE) {
          pipeline.pause();
          try {
            await embedAndUpsertBatch(batchItems);
            processed += batchItems.length;
          } catch (error) {
            failed += batchItems.length;
            console.error('Failed to process batch:', error.message);
          }
          console.log(`[${type}] Processed: ${processed}, Failed: ${failed}`);
          batchItems = [];
          pipeline.resume();
        }
      } catch (error) {
        console.error('Error processing item:', error);
        failed++;
      }
    });

    pipeline.on('end', async () => {
      if (batchItems.length) {
        try {
          await embedAndUpsertBatch(batchItems);
          processed += batchItems.length;
        } catch (error) {
          failed += batchItems.length;
          console.error('Failed to process final batch:', error.message);
        }
      }
      console.log(`[${type}] Final stats - Processed: ${processed}, Failed: ${failed}`);
      resolve();
    });

    pipeline.on('error', (err) => {
      reject(err);
    });
  });
}

async function embedAndUpsertBatch(batch) {
  const maxRetries = 3;
  let retryCount = 0;
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  while (retryCount < maxRetries) {
    try {
      const texts = batch.map(item => item.inputText);
      const embeddings = await getEmbeddingsBatch(texts);

      const vectors = batch.map((item, idx) => ({
        id: item.id,
        values: embeddings[idx],
        metadata: item.metadata
      }));

      await upsertBatch(vectors);
      return;
    } catch (error) {
      retryCount++;
      console.error(`Attempt ${retryCount} failed for batch. Error:`, error.message);
      
      if (retryCount === maxRetries) {
        console.error('Max retries reached for batch, moving to next batch');
        return;
      }
      
      // Exponential backoff
      await delay(1000 * Math.pow(2, retryCount));
    }
  }
}

(async () => {
  await initPinecone();
  await processFile(path.join(__dirname, '../data/questions.json'), 'question');
  await processFile(path.join(__dirname, '../data/flashcards.json'), 'flashcard');
  console.log('All done!');
})();
