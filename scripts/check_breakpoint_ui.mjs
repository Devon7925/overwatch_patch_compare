// Run against a built, locally served site with Playwright installed externally.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
    for (const mode of ['Overwatch 2', 'Overwatch 2 6v6']) {
        for (const width of [1440, 390]) {
            const page = await browser.newPage({ viewport: { width, height: 1000 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            const query = new URLSearchParams({ after_patch: `${mode}:latest`, show_calculated_properties: 'true', show_breakpoints: 'true' });
            await page.goto(`${process.env.SITE_URL || 'http://127.0.0.1:8765'}/?${query}`);
            const text = 'Breakpoint for Plasma Saber 4x Total normal damage reduced from 250 to 225.';
            await page.waitForFunction(text => document.body.innerText.includes(text), text);
            assert.equal(await page.locator('#patch_type_after').inputValue(), mode);
            const body = await page.locator('body').innerText();
            assert.ok(body.includes('Spread for firing both guns increased from 4 to 5 degrees.'));
            assert.ok(body.includes('Dual-gun spread multiplier relative to preview increased by 25%.'));
            assert.ok(!body.includes('488.24%'));
            for (const hero of ['Domina', 'Hazard', 'Roadhog', 'Ashe', 'Anran']) {
                const card = page.locator('.PatchNotesHeroUpdate').filter({ has: page.locator('.PatchNotesHeroUpdate-name', { hasText: new RegExp(`^${hero}$`) }) });
                assert.ok(!(await card.allTextContents()).join('').includes('Breakpoint for'), hero);
            }
            assert.deepEqual(errors, []);
            console.log(`${mode}, ${width}px: breakpoint and spread rendering passed`);
            await page.close();
        }
    }
    if (process.env.AUDIT_ALL_PATCHES === '1') {
        const review = JSON.parse(readFileSync('audits/breakpoint-review.json', 'utf8'));
        const page = await browser.newPage();
        let errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (/Missing .*units|Cannot find units/.test(message.text())) errors.push(message.text()); });
        for (const entry of review) {
            errors = [];
            const query = new URLSearchParams({ after_patch: `${entry.mode}:${entry.after}`, show_calculated_properties: 'true', show_breakpoints: 'true', apply_to_armor: String(entry.armor) });
            await page.goto(`${process.env.SITE_URL || 'http://127.0.0.1:8765'}/?${query}`, { waitUntil: 'domcontentloaded' });
            await page.waitForFunction(date => document.querySelector('#patch_after')?.value === date && document.querySelector('.PatchNotes-section-hero_update')?.textContent.trim(), entry.after);
            const rendered = await page.locator('.PatchNotesHeroUpdate').evaluateAll(cards => Object.fromEntries(cards.flatMap(card => {
                const count = [...card.querySelectorAll('li')].filter(li => /breakpoint for/i.test(li.textContent)).length;
                return count ? [[card.querySelector('h5').textContent.replace(/^\(NEW\) /, ''), count]] : [];
            })));
            const label = `${entry.mode} ${entry.after}, armor=${entry.armor}`;
            assert.deepEqual(errors, [], label);
            assert.deepEqual(rendered, entry.breakpointChanges, label);
            console.log(`${label}: all calculated breakpoint rows rendered`);
        }
        await page.close();
    }
} finally {
    await browser.close();
}
