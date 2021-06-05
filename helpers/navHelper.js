const fs = require('fs-extra');
const { urlParse, checkRedirect } = require('../utils');

module.exports = {
    async hookNavigation(req, page) {
        let urls = [];
        let reqURL = req.url();
        let parsedURL = urlParse(reqURL, page.url());

        if (req.resourceType() === "image" || req.resourceType() === "media") {
            // load self image if encounter image/media resource
            let img = fs.readFileSync("./image/byc404.jpeg");
            req.respond({
                "status": 200,
                "contentType": "image/jpeg",
                "body": img,
            });

        } else if (req.isNavigationRequest() && !req.frame().parentFrame() && parsedURL != null) {
            // check backend redirect
            let res = await checkRedirect(parsedURL);
            if (res && res[0] !== null) {
                urls.push(res[1]);
                req.respond({
                    "status": 200,
                    "body": res[0], 
                })
            } else {
                req.continue();
            }
        } else if (parsedURL === null || reqURL.indexOf("logout") !== -1) { // incase cookie is lost 
            req.abort();
        } else {
            req.continue();
        }
        return urls;
    }
}