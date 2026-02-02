import { Firecrawl } from '@mendable/firecrawl-js'; // Use the new Firecrawl export
import fs from 'fs';
import path from 'path';

// Initializing the v2 client
const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

async function run() {
  try {
    console.log("Fetching Vuniper via v2 standard scrape...");
    
    const result = await firecrawl.scrape('https://vuniper.com/movies/web', {
      formats: [
        {
          type: 'json',
          prompt: "Extract the latest movie releases. Format as a 'metas' array with id, type (movie), and name.",
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

    // In v2, the structured JSON is found directly in result.json
    if (!result.success || !result.json?.metas) {
      console.error("Scrape failed. Full response:", JSON.stringify(result, null, 2));
      throw new Error("No movie data found.");
    }

    const dir = path.join(process.cwd(), 'catalog', 'movie');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(
      path.join(dir, 'vuniper_web.json'), 
      JSON.stringify(result.json, null, 2)
    );

    console.log(`Success! Saved ${result.json.metas.length} movies using v2.`);
  } catch (error) {
    console.error("Scraper Error:", error.message);
    process.exit(1);
  }
}

run();