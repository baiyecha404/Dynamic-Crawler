const getLink = (nodes) => {
    let result = [];
    for (let node of nodes) {
        let src = node.getAttribute("src");
        let href = node.getAttribute("href");
        if (src) {
            result.push(src)
        }
        if (href) {
            result.push(href);
        }
    }
    return result;
}

const parseComment = async (nodes) => {
    let result = [];
    for (let node of nodes) {
        let commentContent = await node.evaluate(node => node.textContent, node);
        const matches = matchURL(commentContent);
        if (matches !== null) {
            result = result.concat(matches);
        }
    }
    return result;
}

const matchURL = (content) => {
    // TODO: not able to match relative path
    //return content.match(/(https?|ftp|file):\/\/[^\s$.?#].[^\s]*|^[^\/]+\/[^\/].*$|^\/[^\/].*$/gmi); 
    return content.match(/(https?|ftp|file):\/\/[^\s$.?#].[^\s]*/gmi);
}


module.exports = {
    getLink,
    parseComment
}