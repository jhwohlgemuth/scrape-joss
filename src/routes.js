import * as URL from 'url';
import { createPlaywrightRouter } from 'crawlee';

export const router = createPlaywrightRouter();

const NOT_FOUND = '???';

function clean(str) {
    return typeof (str) === 'string'
        ? str.trim().replace(/^\"/, '').replace(/\"$/, '')
        : NOT_FOUND;
}

router.addDefaultHandler(async ({ enqueueLinks, log }) => {
    log.info(`Adding new URLs`);
    await enqueueLinks({
        globs: ['https://joss.theoj.org/papers/10.21105/**',],
        label: 'paper',
    });
    await enqueueLinks({
        globs: ['https://joss.theoj.org/papers/published?page=**',],
    });
});
router.addHandler('paper', async ({ page, enqueueLinks }) => {
    const code = await page
        .locator('.btn.paper-btn')
        .filter({ hasText: 'Software repository' })
        .getAttribute('href');
    await enqueueLinks({
        globs: [code],
        label: 'code',
    });
});
router.addHandler('code', async ({ request, page, log, pushData }) => {
    const url = request.loadedUrl;
    const title = await page.title();
    const parsed = URL.parse(url);
    const hostname = parsed.hostname;
    log.info(`Processing ${url}`);
    let meta = { hostname, url };
    if (hostname === 'github.com') {
        const [_, user, project] = parsed.pathname.split('/');
        const description = clean(title.split(':').slice(1).join(':'));
        const star_count = clean(
            await page
                .locator('#repo-stars-counter-star')
                .innerText()
        );
        meta = Object.assign(meta, {
            star_count,
            user,
            project,
            description,
        });
    } else if (hostname === 'gitlab.com') {
        const [_, user, project] = parsed.pathname.split('/');
        let description = NOT_FOUND;
        try {
            const element = page.locator('.home-panel-description-markdown > p');
            description = clean(await element.innerText());
        } catch {
            log.warning(`Failed to get description for ${url}`);
        }
        const star_count = clean(
            await page
                .locator('a.star-count > span')
                .innerText()
        );
        meta = Object.assign(meta, {
            star_count,
            user,
            project,
            description,
        });
    } else {
        log.info(`Skipping ${hostname} project`);
    }
    await pushData(meta);
});