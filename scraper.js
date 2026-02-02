import FirecrawlApp from '@mendable/firecrawl-js';
import fs from 'fs';
import path from 'path';

// The new SDK uses the FirecrawlApp class name
const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

async function run() {
  try {
    console.log("Fetching Vuniper via standard scrape...");
    
    // In SDK v2, use .scrapeUrl or .scrape depending on your exact version.
    // .scrapeUrl is the most stable method for single-page JSON extraction.
    const result = await app.scrapeUrl('https://vuniper.com/movies/web', {
      formats: [
        {
          type: 'json',
          prompt: "Extract the latest 20 movie releases. Find the IMDb ID (tt...) and the movie title.",
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
        }
      ]
    });

    // Check if result.data.json exists (v2 format)
    const movieData = result.data?.json || result.json;

    if (!result.success || !movieData || !movieData.metas.length) {
      console.error("Debug Result:", JSON.stringify(result, null, 2));
      throw new Error("Scrape failed or found no movies.");
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