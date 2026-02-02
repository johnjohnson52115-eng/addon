import Firecrawl from '@mendable/firecrawl-js';
import fs from 'fs';
import path from 'path';

const app = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

async function run() {
  try {
    console.log("Fetching Vuniper...");
    
    const result = await app.scrape('https://vuniper.com/movies/web', {
      formats: [{
        type: 'json',
        prompt: "Extract the latest 20 movies. Find the IMDb ID (tt...) and the movie name.",
        schema: {
          type: "object",
          properties: {
            metas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  type: { type: "string", enum: ["movie"] },
                  name: { type: "string" }
                },
                required: ["id", "type", "name"]
              }
            }
          },
          required: ["metas"]
        }
      }]
    });

    // FAIL-SAFE: Check all possible locations for the JSON data
    const movieData = result.data?.json || result.json || result.data;

    if (!movieData || !movieData.metas || movieData.metas.length === 0) {
      console.error("API Response Structure:", JSON.stringify(result, null, 2));
      throw new Error("No movies found in the API response.");
    }

    const dir = path.join(process.cwd(), 'catalog', 'movie');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(
      path.join(dir, 'vuniper_web.json'), 
      JSON.stringify({ metas: movieData.metas }, null, 2)
    );

    console.log(`Success! Saved ${movieData.metas.length} movies.`);
  } catch (error) {
    console.error("Scraper Error:", error.message);
    process.exit(1);
  }
}

run();