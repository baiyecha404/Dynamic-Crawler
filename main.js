const config = require('./config.json');
const randomUseragent = require('random-useragent');
const { Cluster } = require("puppeteer-cluster");
const { hookJS, urlParse, inScope } = require('./utils');
const { hookNavigation } = require('./helpers/navHelper');
const { getLink, parseComment } = require('./helpers/linkHelper');
const { handleForm, createFrame } = require('./helpers/formHelper');
const { triggerDomEvent, triggerInlineEvent } = require('./helpers/eventHelper');

async function initPage(page) {
    // set UA
    await page.setUserAgent(randomUseragent.getRandom());
    // hook js
    await page.evaluateOnNewDocument(hookJS);
    // set request interception
    await page.setRequestInterception(true);
    // enable js 
    await page.setJavaScriptEnabled(true);
    // disable cache
    await page.setCacheEnabled(false);
}

const getNavRedirects = () => {
    if (window.info) {
        let result = window.info.split("_-_");
        result.splice(0, 1);
        return result;
    }
    return [];
}

// urls worklist 
let WORK_LIST = new Set();

(async () => {
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        puppeteerOptions: config.puppeteerOptions,
        ...config.clusterOptions,
    });

    await cluster.task(async ({ page, data: url }) => {

        console.log(`Crawling ${url}`);

        await initPage(page);

        // TODO use appropriate cookie
        page.setCookie({
            domain: 'bycsec.top',
            name: 'session',
            value: '2lEXINmIkkiCCYrI5PvM1-Aok20Ng4TL9zBOYpXi13rzJ7xz',
        });

        let redirectURLs = [];
        page.on("request", async (req) => {
            const redirect = await hookNavigation(req, page);
            redirectURLs.concat(redirect);
        });

        page.on("response", async (res) => {
            let status = res.status();
            if (status.toString().substr(0, 2) === "30") {
                redirectURLs.push(urlParse(res.headers().location, url));
            }
        });

        await page.goto(url, {
            waitUntil: "networkidle2",
            timeout: 30000,
        });


        // get urls from src, href, etc.
        // get base url if base tag exists
        let baseURL;
        baseEl = await page.$('base');
        if (baseEl !== null) {
            baseURL = await baseEl.evaluate((el) => el.getAttribute("href"), baseEl);
        }
        const links = await page.$$eval('[src],[href],[action],[data-url],[longDesc],[lowsrc]', getLink);

        let linkURLS = [];
        for (let link of links) {
            let parsedURL = urlParse(link, baseURL == undefined ? page.url() : baseURL);
            if (parsedURL !== null) {
                linkURLS.push(parsedURL);
            }
        }

        let commentURLS = [];
        const comments = await parseComment(await page.$x("//comment()"));
        for (let comment of comments) {
            let parsedURL = urlParse(comment, page.url());
            if (parsedURL !== null) {
                commentURLS.push(parsedURL);
            }
        };

        //trigger DOM / Inline events    
        await triggerInlineEvent(page);
        await page.evaluate(triggerDomEvent);

        // form submission
        const formNodes = await page.$$('form');
        await page.evaluate(createFrame);
        await handleForm(formNodes);


        // js hook urls
        let urls = await page.evaluate(() => {
            return window.urls;
        })

        // redirect urls that are hooked by browser along with backend 302
        let navURLs = await page.evaluate(getNavRedirects)

        const ENV_URLS = urls.concat(linkURLS).concat(commentURLS).concat(redirectURLs).concat(navURLs);
        console.log(ENV_URLS);

        for (let target of ENV_URLS) {
            if (!WORK_LIST.has(target)) {
                if (inScope(target, url)) {
                    WORK_LIST.add(target);
                    cluster.execute(target);
                }
            }
        }
    });
    cluster.execute('http://127.0.0.1/test2.html');

    await cluster.idle();
    await cluster.close();
})();
