import http from 'http';

const manifest = {
    id: "community.hubscraper",
    version: "1.0.3",
    name: "Vega + HDHub + Kat Scraper",
    description: "Basic scraper for Vegamovies, HDHub4u & KatMovieHD",
    resources: ["stream"],
    types: ["movie", "series"],
    idPrefixes: ["tt"]
};

async function searchSite(siteName, title) {
    try {
        console.log(`Searching ${siteName} for: ${title}`);
        
        // TODO: Real scraping logic will go here later
        // For now returning mock working streams
        return {
            name: `🔥 ${siteName}`,
            title: `1080p - Found on ${siteName}`,
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        };
    } catch (e) {
        return null;
    }
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json');

    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/manifest.json') {
        res.writeHead(200);
        return res.end(JSON.stringify(manifest));
    }

    if (url.pathname.startsWith('/stream/')) {
        const streams = [];
        const titleParam = url.searchParams.get('title') || "Unknown Movie";
        const cleanTitle = titleParam.replace(/[^a-zA-Z0-9 ]/g, '');

        const [vega, hdhub, kat] = await Promise.all([
            searchSite("Vegamovies", cleanTitle),
            searchSite("HDHub4u", cleanTitle),
            searchSite("KatMovieHD", cleanTitle)
        ]);

        if (vega) streams.push(vega);
        if (hdhub) streams.push(hdhub);
        if (kat) streams.push(kat);

        res.writeHead(200);
        return res.end(JSON.stringify({ streams }));
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not Found" }));
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`🚀 Hub Scraper running → http://localhost:${port}`);
    console.log(`Add this manifest in Stremio: http://YOUR-IP:${port}/manifest.json`);
});
