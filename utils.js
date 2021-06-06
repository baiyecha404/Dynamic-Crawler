const { URL } = require('url');
const fetch = require('node-fetch');

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const inScope = (url, scope) => {
    return new RegExp(new URL(scope).hostname,'gi').test(new URL(url).hostname)
}

const urlParse = (url, page) => {
    try {
        if (url.startsWith('//')) {
            url = new URL(page).protocol + "//" + url.substr(2);
        }
        url = new URL(url, page);
        
        // check if is http page
        if (!url.protocol.startsWith('http')) {
            return null;
        }

        let path = url.pathname;

        const staticSuffix = ['css', 'js', 'jpg', 'png', 'gif', 'svg', 'jpeg', 'ico'];

        if (path && path !== '/') {
            let pos = path.lastIndexOf('.');
            if (staticSuffix.includes(path.substr(pos + 1))) {
                return null;
            }
        }

        return url.href;
    } catch (err) {
        return null;
    }
}


const checkRedirect = async (url) => {
    let res = await fetch(url, {
        mode: 'no-cors',
        redirect: 'manual',
        follow: 1
    });
    if (res.status.toString().substr(0, 2) == '30') {
        const body = await res.text();
        if (body.length > 0) return [body, res.headers.get('location')];
    }
    return null;
}


const hookJS = async () => {
    window.urls = [];
    window.events = [];

    const hookAttrs = { "writable": false, "configurable": false };

    window.history.pushState = (_, __, url) => {
        window.urls.push(url);
    }
    Object.defineProperty(window.history, "pushState", hookAttrs);

    window.history.replaceState = (_, __, url) => {
        window.urls.push(url);
    }
    Object.defineProperty(window.history, "replaceState", hookAttrs);

    window.addEventListener("hashchange", function () {
        window.urls.push(document.location.href);
    });
    window.open = (url) => {
        window.urls.push(url);
    };
    Object.defineProperty(window, 'open', hookAttrs);

    window.close = () => {
        console.log(`trying to close page.`);
    };
    Object.defineProperty(window, "close", hookAttrs);

    let oldWebSocket = window.WebSocket;
    window.WebSocket = function (url, arg) {
        window.urls.push(url)
        console.log(`WebSocketURL: ${url}`);
        return new oldWebSocket(url, arg);
    }

    let oldEventStore = window.EventSource;
    window.EventSource = function (url) {
        window.urls.push(url);
        console.log(`EventStoreURL: ${url}`);
        return new oldEventStore(url);
    }

    let oldFetch = window.fetch;
    window.fetch = (url) => {
        window.urls.push(url);
        console.log(`Fetch URL: ${url}`);
        return oldFetch(url);
    }

    window.XMLHttpRequest.prototype.send = (data) => {
        console.log(`XMLHttpRequest send data: ${data}`);
    };
    window.XMLHttpRequest.prototype.open = (_, url) => {
        window.urls.push(url);
        console.log(`XMLHttpRequest open: ${url}`);
    };
    window.XMLHttpRequest.prototype.abort = () => { };

    let oldSetTimeout = window.setTimeout;
    window.setTimeout = (func, time) => {
        console.log(`setTimeout : ${time} ms`)
        return oldSetTimeout(func, 1500);
    }

    let oldSetInterVal = window.setInterval;
    window.setInterval = (func, time) => {
        console.log(`setInterVal: ${time} ms`);
        return oldSetInterVal(func, 1500);
    }

    // hook dom
    document.addEventListener('DOMNodeInserted', function (e) {
        let node = e.target;
        if (node.src) {
            window.urls.push(node.src);
        }
        if (node.href) {
            window.urls.push(node.href)
        }
    }, true);

    // hook dom0 event
    const dom0Hook = (that, eventName) => {
        console.log(eventName + ": " + that.tagName);
        window.events.push({ "element": that, "eventName": eventName })
    }

    Object.defineProperties(HTMLElement.prototype, {
        onclick: { set: function (newValue) { onclick = newValue; dom0Hook(this, "click"); } },
        onchange: { set: function (newValue) { onchange = newValue; dom0Hook(this, "change"); } },
        onblur: { set: function (newValue) { onblur = newValue; dom0Hook(this, "blur"); } },
        ondblclick: { set: function (newValue) { ondblclick = newValue; dom0Hook(this, "dblclick"); } },
        onfocus: { set: function (newValue) { onfocus = newValue; dom0Hook(this, "focus"); } },
    });

    // hook dom2 event
    let _addEventListener = Element.prototype.addEventListener;
    Element.prototype.addEventListener = function (eventName, func, capture) {
        console.log(eventName + ": " + this.tagName);
        window.events.push({ "element": this, "eventName": eventName });
        _addEventListener.apply(this, arguments);
    };

    // hook form reset
    HTMLFormElement.prototype.reset = function () {
        console.log("cancel reset form")
    };
    Object.defineProperty(HTMLFormElement.prototype, "reset", hookAttrs);

    // hook event
    for (let eventName of ["onclick", "onchange", "onblur", "onfocus", "ondblclick"]) {
        Object.defineProperty(HTMLElement.prototype, eventName, { "configurable": false });
    }
}


module.exports = {
    sleep,
    hookJS,
    inScope,
    urlParse,
    checkRedirect
};