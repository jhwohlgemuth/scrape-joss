import { Dataset, PlaywrightCrawler } from 'crawlee';
import { router } from './routes.js';

const crawler = new PlaywrightCrawler({
    launchContext: {
        launchOptions: {
            headless: true,
        },
    },
    requestHandler: router,
    // maxRequestsPerCrawl: 1000,
});

await crawler.run(['https://joss.theoj.org/papers/published']);
await Dataset.exportToCSV('data');
