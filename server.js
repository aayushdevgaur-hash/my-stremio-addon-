const http = require('http');

// 1. Define your Stremio Addon Manifest details
const manifest = {
    id: "community.mobilemoviebox",
    version: "1.0.0",
    name: "Mobile MovieBox Addon",
    description: "Live streams served straight from MovieBox natively!",
    resources: ["stream"],
    types: ["movie"],
    idPrefixes: ["tt"]
};

// 2. Create a clean, native HTTP cloud server
const server = http.createServer(async (req, res) => {
    // Inject mandatory CORS headers so Stremio app is allowed to read our stream lists
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json');

    // Route A: Stremio requests the manifest details
    if (req.url === '/manifest.json') {
        res.writeHead(200);
        return res.end(JSON.stringify(manifest));
    }

    // Route B: Stremio requests video streams for a specific movie ID
    if (req.url.startsWith('/stream/movie/')) {
        const parts = req.url.split('/');
        const fileName = parts[parts.length - 1]; // Extract "tt12345.json"
        const imdbId = fileName.replace('.json', ''); // Strip to "tt12345"

        console.log(`Incoming request for IMDb ID: ${imdbId}`);

        try {
            // Load the Moviebox scraper module dynamically
            const { MovieboxSession, search, getMovieStreamUrl } = await import('moviebox-js-sdk');
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

            // Execute movie search
            const searchResults = await search(session, { query: title });
            const matchedItem = searchResults.results?.[0];

            if (!matchedItem) {
                res.writeHead(200);
                return res.end(JSON.stringify({ streams: [] }));
            }

            // Extract the direct media streaming link
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
            console.error("Internal Server Scraper Error:", error.message);
            res.writeHead(200);
            return res.end(JSON.stringify({ streams: [] }));
        }
    }

    // Fallback for any other root paths
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not Found" }));
});

// 3. Bind to Render's cloud environment port
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Native Cloud Server successfully running on port ${port}`);
});
