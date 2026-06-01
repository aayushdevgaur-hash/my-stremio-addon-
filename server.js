import { load } from 'cheerio';

async function scrapeWebsite() {
    try {
        // REPLACE THIS URL with the public, static website you want to analyze
        const targetUrl = "https://new1.katmoviehd.cymru/"; 
        
        console.log(`Fetching raw HTML from: ${targetUrl}...`);
        
        // 1. Send the HTTP request to the site
        const response = await fetch(targetUrl, {
            headers: {
                // Tells the server you are a regular web browser
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }
        
        const html = await response.text();
        
        // 2. Load the HTML string into Cheerio for parsing
        const $ = load(html);
        
        // 3. Extract data using CSS Selectors
        // (Modify these selectors based on your target website's actual HTML elements)
        const pageTitle = $('h1').text().trim();
        const paragraphText = $('p').text().trim();
        
        console.log('\n--- Extraction Results ---');
        console.log(`Extracted Heading: "${pageTitle}"`);
        console.log(`Extracted Paragraph: "${paragraphText}"`);
        
        // Example: How to loop through a list of items (like a grid of cards or links)
        /*
        $('.movie-card').each((index, element) => {
            const title = $(element).find('.movie-title').text().trim();
            const link = $(element).find('a').attr('href');
            console.log(`Item #${index + 1}: ${title} -> ${link}`);
        });
        */

    } catch (error) {
        console.error("Scraper encountered an error:", error.message);
    }
}

// Execute the function
scrapeWebsite();
