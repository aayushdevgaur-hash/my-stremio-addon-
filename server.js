import http from 'http';
import { MovieboxSession, search, getMovieStreamUrl } from 'moviebox-js-sdk';

// 1. Define your Stremio Addon Manifest
const manifest = {
    id: "community.mobilemoviebox",
    version: "1.0.0",
    name: "Mobile MovieBox Addon",
    description: "Live streams served straight from MovieBox natively!",
    resources: ["stream"],
    types: ["movie"],
    idPrefixes: ["tt"]
};

// 2. Create a native cloud server
const server = http.createServer(async (req, res) => {
    // Mandatory headers so the Stremio app can read our data
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json');

    // Route A: Stremio checks the addon's manifest
    if (req.url === '/manifest.json') {
        res.writeHead(200);
        return res.end(JSON.stringify(manifest));
    }

    // Route B: Stremio requests video streams for a movie ID
    if (req.url.startsWith('/stream/movie/')) {
        const parts = req.url.split('/');
        const fileName = parts[parts.length - 1]; // e.g., "tt12345.json"
        const imdbId = fileName.replace('.json', ''); // e.g., "tt12345"

        console.log(`Incoming request for IMDb ID: ${imdbId}`);

        try {
            const session = new MovieboxSession({ host: 'moviebox.ph' });

            // Fetch movie title via Stremio's Cinemeta service
            const metaRes = await fetch(`https://v3-cinemeta.strem.io/meta/movie/${imdbId}.json`);
            const metaData = await metaRes.json();
            
            if (!metaData.meta || !metaData.meta.name) {
                res.writeHead(200);
                return res.end(JSON.stringify({ streams: [] }));
            }

            const title = metaData.meta.name;
            console.log(`Searching MovieBox index for: "${title}"`);

            // Execute movie search on MovieBox
            const searchResults = await search(session, { query: title });
            const matchedItem = searchResults.results?.[0];

            if (!matchedItem) {
                res.writeHead(200);
                return res.end(JSON.stringify({ streams: [] }));
            }

            // Extract the direct streaming link
            const streamInfo = await getMovieStreamUrl(session, { 
                detailPath: matchedItem.detailPath, 
                quality: 'best' 
            });

            const streams = [];
            if (streamInfo?.stream?.url) {
                streams.push({
                    name: "🎬 MovieBox Mobile",
                    title: `${title}\nBest Quality Available (Direct Server Link)`,
                    url: streamInfo.stream.url
                });
            }

            res.writeHead(200);
            return res.end(JSON.stringify({ streams }));

        } catch (error) {
            console.error("Internal Scraper Error:", error.message);
            res.writeHead(200);
            return res.end(JSON.stringify({ streams: [] }));
        }
    }

    // Fallback response
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not Found" }));
});

// 3. Start the server engine on Render's port
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Native ESM Server successfully running on port ${port}`);
});
