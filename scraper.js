import Firecrawl from '@mendable/firecrawl-js';
import fs from 'fs';
import path from 'path';

const app = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

async function run() {
  try {
    console.log("Fetching Vuniper via standard scrape...");
    
    const result = await app.scrape('https://vuniper.com/movies/web', {
      // The SDK now requires this specific object structure for JSON mode
      formats: [
        {
          type: 'json',
          prompt: "Extract the latest movie releases. For each, find the IMDb ID (starting with 'tt') and the movie title.",
          schema: {
            type: "object",
            properties: {
              metas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "IMDb ID, e.g., 'tt1234567'" },
                    type: { type: "string", enum: ["movie"] },
                    name: { type: "string", description: "Movie title" }
                  },
                  required: ["id", "type", "name"]
                }
              }
            },
            required: ["metas"]
          }
        }
      ]
    });

    if (!result.success || !result.data.json || !result.data.json.metas.length) {
      throw new Error("Scrape failed or found no movies. Check if result.data.json exists.");
    }

    const dir = path.join(process.cwd(), 'catalog', 'movie');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // In this mode, the data is usually under result.data.json
    fs.writeFileSync(
      path.join(dir, 'vuniper_web.json'), 
      JSON.stringify(result.data.json, null, 2)
    );

    console.log(`Success! Saved ${result.data.json.metas.length} movies.`);
  } catch (error) {
    console.error("Scraper Error:", error.message);
    process.exit(1);
  }
}

run();