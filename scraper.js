const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function scrapeVuniper() {
    try {
        console.log("Fetching Vuniper grid...");
        const { data } = await axios.get('https://vuniper.com/movies/web', {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html'
            }
        });
        
        const $ = cheerio.load(data);
        const movies = [];

        // Scan every link on the page for IMDb IDs
        $('a').each((i, el) => {
            const href = $(el).attr('href') || '';
            const imdbMatch = href.match(/tt\d{7,}/);
            
            if (imdbMatch) {
                const imdbId = imdbMatch[0];
                
                // Extraction Strategy: Check image alt first (cleanest), then aria-labels, then link text
                const imgAlt = $(el).find('img').attr('alt');
                const ariaLabel = $(el).attr('aria-label');
                const linkText = $(el).text().trim();
                
                const name = imgAlt || ariaLabel || linkText || "New Release";

                // Avoid duplicates
                if (!movies.find(m => m.id === imdbId)) {
                    movies.push({
                        id: imdbId,
                        type: 'movie',
                        name: name
                    });
                }
            }
        });

        // Error Handling: If zero movies found, fail the GitHub Action so you get an alert
        if (movies.length === 0) {
            throw new Error("Zero movies found. Site structure might be blocking the bot or changed.");
        }

        // Ensure the directory exists for Stremio's static path
        const dir = path.join(__dirname, 'catalog', 'movie');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        // Save only the top 20 (the first "page" of the grid)
        fs.writeFileSync(path.join(dir, 'vuniper_web.json'), JSON.stringify({ metas: movies.slice(0, 20) }));
        
        console.log(`Success! Found ${movies.length} movies. Saved the top 20 to catalog.`);
    } catch (error) {
        console.error("Scraper Error:", error.message);
        process.exit(1); // Tells GitHub the run failed
    }
}

scrapeVuniper();