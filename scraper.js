import Firecrawl from '@mendable/firecrawl-js';
import fs from 'fs';
import path from 'path';

const app = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

async function run() {
  try {
    console.log("Fetching Vuniper via standard scrape...");
    
    // CHANGED: .scrape() is the correct method name in the new SDK
    const result = await app.scrape('https://vuniper.com/movies/web', {
      formats: ['json'],
      jsonOptions: {
        schema: {
          type: "object",
          properties: {
            metas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", pattern: "^tt\\d{7,}$" },
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
    });

    if (!result.success || !result.data.metas.length) {
      throw new Error("Scrape failed or found no movies.");
    }

    const dir = path.join(process.cwd(), 'catalog', 'movie');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(
      path.join(dir, 'vuniper_web.json'), 
      JSON.stringify(result.data, null, 2)
    );

    console.log(`Success! Saved ${result.data.metas.length} movies.`);
  } catch (error) {
    console.error("Scraper Error:", error.message);
    process.exit(1);
  }
}

run();