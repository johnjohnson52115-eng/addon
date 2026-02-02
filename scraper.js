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

        // Updated selector: Looks for any link containing /title/tt
        $('a').each((i, el) => {
            const href = $(el).attr('href') || '';
            const imdbMatch = href.match(/tt\d+/);
            
            if (imdbMatch) {
                const imdbId = imdbMatch[0];
                // Get the title from the nearest heading or the link text
                const name = $(el).text().trim() || $(el).closest('div').find('h1, h2, h3').first().text().trim();

                if (!movies.find(m => m.id === imdbId)) {
                    movies.push({
                        id: imdbId,
                        type: 'movie',
                        name: name || "New Release"
                    });
                }
            }
        });

        const dir = path.join(__dirname, 'catalog', 'movie');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const catalogPath = path.join(dir, 'vuniper_web.json');
        fs.writeFileSync(catalogPath, JSON.stringify({ metas: movies.slice(0, 100) }));
        
        console.log(`Success! Found ${movies.length} movies.`);
    } catch (error) {
        console.error("Scraping failed:", error.message);
        process.exit(1);
    }
}

scrapeVuniper();