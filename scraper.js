const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function scrapeVuniper() {
    try {
        console.log("Fetching Vuniper web releases...");
        // Fetch the HTML from Vuniper
        const { data } = await axios.get('https://vuniper.com/movies/web', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const $ = cheerio.load(data);
        const movies = [];

        // Look for links that point to IMDb titles
        $('a[href*="imdb.com/title/"]').each((i, el) => {
            const href = $(el).attr('href');
            const imdbId = href.match(/tt\d+/)?.[0];
            const name = $(el).text().trim();

            // Only add if we found an ID and haven't added it already
            if (imdbId && !movies.find(m => m.id === imdbId)) {
                movies.push({
                    id: imdbId,
                    type: 'movie',
                    name: name || "New Release"
                });
            }
        });

        // Create the folder structure Stremio needs: /catalog/movie/
        const dir = path.join(__dirname, 'catalog', 'movie');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        // Save the results to the file Stremio will read
        const catalogPath = path.join(dir, 'vuniper_web.json');
        fs.writeFileSync(catalogPath, JSON.stringify({ metas: movies.slice(0, 100) }));
        
        console.log(`Success! Found ${movies.length} movies.`);
    } catch (error) {
        console.error("Scraping failed:", error.message);
        process.exit(1);
    }
}

scrapeVuniper();