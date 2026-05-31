const { serveHTTP, addonBuilder } = require("stremio-addon-sdk");

// 1. Define the Addon Manifest
const manifest = {
    id: "community.mobilemoviebox",
    version: "1.0.0",
    name: "Mobile MovieBox Addon",
    description: "Live streams served straight from MovieBox!",
    resources: ["stream"],
    types: ["movie"],
    idPrefixes: ["tt"]
};

const builder = new addonBuilder(manifest);

// 2. Define the Live Stream Extraction Logic
builder.defineStreamHandler(async (args) => {
    console.log(`Stremio requested streams for IMDb ID: ${args.id}`);
    
    try {
        // Load the Moviebox scraping tool dynamically
        const { MovieboxSession, search, getMovieStreamUrl } = await import('moviebox-js-sdk');
        const session = new MovieboxSession({ host: 'moviebox.ph' });

        // Step A: Get the text title of the movie using its IMDb ID
        const metaRes = await fetch(`https://v3-cinemeta.strem.io/meta/movie/${args.id}.json`);
        const metaData = await metaRes.json();
        if (!metaData.meta || !metaData.meta.name) return { streams: [] };

        const title = metaData.meta.name;

        // Step B: Search MovieBox for that title
        const searchResults = await search(session, { query: title });
        const matchedItem = searchResults.results?.[0];
        if (!matchedItem) return { streams: [] };

        // Step C: Grab the final video link
        const streamInfo = await getMovieStreamUrl(session, { 
            detailPath: matchedItem.detailPath, 
            quality: 'best' 
        });

        if (streamInfo?.stream?.url) {
            return {
                streams: [{
                    name: "🎬 MovieBox Mobile",
                    title: `${title}\nBest Quality Available (Direct Link)`,
                    url: streamInfo.stream.url
                }]
            };
        }
    } catch (error) {
        console.error("Mobile Scraper Error:", error.message);
    }

    // Return empty if no stream is found or if an error happens
    return { streams: [] };
});

// 3. Start the Server Engine
const port = process.env.PORT || 3000;
serveHTTP(builder.getInterface(), { port: port });
console.log(`Server running on port ${port}`);
