import http from 'http';

const manifest = {
    id: "community.moviescraper",
    version: "1.0.2",
    name: "HDHub + Vegamovies + KatMovieHD",
    description: "Scrapes from Vegamovies, HDHub4u & KatMovieHD",
    resources: ["stream"],
    types: ["movie", "series"],
    idPrefixes: ["tt"]
};

// ================== PLACEHOLDERS (we'll improve later) ==================
async function fetchVegamovies(title) {
    try {
        return {
            name: "🌐 Vegamovies",
            title: "720p/1080p - Vegamovies",
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        };
    } catch (e) {
        return null;
    }
}

async function fetchHDHub4u(title) {
    try {
        return {
            name: "🔥 HDHub4u",
            title: "1080p - HDHub4u",
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
        };
    } catch (e) {
        return null;
    }
}

async function fetchKatMovieHD(title) {
    try {
        return {
            name: "⚡ KatMovieHD",
            title: "Dual Audio 1080p",
            url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
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
        const parts = url.pathname.split('/');
        const imdbId = parts[parts.length - 1].replace('.json', '');

        // Try to get movie name from query if available
        const title = url.searchParams.get('title') || imdbId;

        const streams = [];

        const [v1, v2, v3] = await Promise.all([
            fetchVegamovies(title),
            fetchHDHub4u(title),
            fetchKatMovieHD(title)
        ]);

        if (v1) streams.push(v1);
        if (v2) streams.push(v2);
        if (v3) streams.push(v3);

        res.writeHead(200);
        return res.end(JSON.stringify({ streams }));
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not Found" }));
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`🚀 Multi-Piracy Scraper running on port ${port}`);
    console.log(`Manifest → http://localhost:${port}/manifest.json`);
});
