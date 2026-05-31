import http from 'http';

// 1. Define your Stremio Addon Manifest
const manifest = {
    id: "community.namesearchaddon",
    version: "1.0.0",
    name: "Name-Based Open Source Addon",
    description: "Converts IDs to movie titles and searches public catalogs concurrently.",
    resources: ["stream"],
    types: ["movie"],
    idPrefixes: ["tt"]
};

// Function representing an Open Public Domain Archive searching by title name
async function fetchPublicArchiveByTitle(movieTitle) {
    try {
        console.log(`[Archive] Initiating search query for: "${movieTitle}"`);
        
        // Normalize title string for robust pattern matching
        const normalizedTitle = movieTitle.toLowerCase().trim();
        
        // Demonstration fallback: matches public domain movie keywords
        if (normalizedTitle.includes("bunny") || normalizedTitle.includes("big buck")) {
            return {
                name: "🌐 Open Archive A",
                title: `${movieTitle}\n1080p Public Domain Stream`,
                url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            };
        }
        
        return null;
    } catch (e) {
        console.log("[Archive] Search routine failed:", e.message);
        return null;
    }
}

// Function representing a secondary Open Video Index searching by title name
async function fetchOpenIndexByTitle(movieTitle) {
    try {
        console.log(`[Open Index] Initiating search query for: "${movieTitle}"`);
        
        const normalizedTitle = movieTitle.toLowerCase().trim();
        
        // Demonstration fallback: matches open-source movie keywords
        if (normalizedTitle.includes("dream") || normalizedTitle.includes("elephant")) {
            return {
                name: "🌐 Open Index B",
                title: `${movieTitle}\n720p Open Media Stream`,
                url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
            };
        }
        
        return null;
    } catch (e) {
        console.log("[Open Index] Search routine failed:", e.message);
        return null;
    }
}

// 2. Create the native HTTP server pipeline
const server = http.createServer(async (req, res) => {
    // Inject mandatory headers for Stremio cross-origin capability
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json');

    const cleanUrl = req.url.split('?')[0];

    // Route A: Manifest request route
    if (cleanUrl === '/manifest.json') {
        res.writeHead(200);
        return res.end(JSON.stringify(manifest));
    }

    // Route B: Stream resolution route
    if (cleanUrl.startsWith('/stream/movie/')) {
        const parts = cleanUrl.split('/');
        const fileName = parts[parts.length - 1]; // e.g., "tt12345.json"
        const imdbId = fileName.replace('.json', ''); // e.g., "tt12345"

        console.log(`🎬 Request received for IMDb ID: ${imdbId}`);

        try {
            // STEP 1: Convert the IMDb ID into a string movie title using Cinemeta
            const metaRes = await fetch(`https://v3-cinemeta.strem.io/meta/movie/${imdbId}.json`);
            const metaData = await metaRes.json();
            
            if (!metaData.meta || !metaData.meta.name) {
                console.log(`❌ Title metadata resolution failed for ID: ${imdbId}`);
                res.writeHead(200);
                return res.end(JSON.stringify({ streams: [] }));
            }

            const movieTitle = metaData.meta.name;
            console.log(`✅ ID successfully resolved to Title: "${movieTitle}"`);

            const streams = [];

            // STEP 2: Pass the resolved string title into name-based public search modules concurrently
            const [resultA, resultB] = await Promise.all([
                fetchPublicArchiveByTitle(movieTitle),
                fetchOpenIndexByTitle(movieTitle)
            ]);

            if (resultA) streams.push(resultA);
            if (resultB) streams.push(resultB);

            res.writeHead(200);
            return res.end(JSON.stringify({ streams }));

        } catch (error) {
            console.error("❌ Internal Streaming Engine Error:", error.message);
            res.writeHead(200);
            return res.end(JSON.stringify({ streams: [] }));
        }
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not Found" }));
});

// 3. Initialize server binding
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Name-based multi-source server running on port ${port}`);
});
