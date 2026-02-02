const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function scrapeVuniper() {
    try {
        console.log("Fetching Vuniper web releases...");
        const { data } = await axios.get('https://vuniper.com/movies/web', {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            }
        });
        
        const $ = cheerio.load(data);
        const movies = [];

        // Targeted selector for Vuniper's movie grid
        $('a').each((i, el) => {
            const href = $(el).attr('href') || '';
            const imdbMatch = href.match(/tt\d+/);
            
            if (imdbMatch) {
                const imdbId = imdbMatch[0];
                const name = $(el).text().trim();

                if (!movies.find(m => m.id === imdbId)) {
                    movies.push({
                        id: imdbId,
                        type: 'movie',
                        name: name || "New Release"
                    });
                }
            }
        });

        // ERROR HANDLING: If the list is empty, stop and fail the workflow
        if (movies.length === 0) {
            throw new Error("Scraper found 0 movies. Vuniper might have changed their layout.");
        }

        const dir = path.join(__dirname, 'catalog', 'movie');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const catalogPath = path.join(dir, 'vuniper_web.json');
        fs.writeFileSync(catalogPath, JSON.stringify({ metas: movies.slice(0, 100) }));
        
        console.log(`Success! Found ${movies.length} movies.`);
    } catch (error) {
        // This ensures the GitHub Action shows a RED "X" if something goes wrong
        console.error("CRITICAL ERROR:", error.message);
        process.exit(1); 
    }
}

scrapeVuniper();