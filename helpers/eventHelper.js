const { sleep } = require('../utils');

const triggerDomEvent = async () => {
    for (let event of window.events) {
        console.log(`Triggering dom event ${event["eventName"]}`)
        let newEvent = document.createEvent('CustomEvent');
        newEvent.initCustomEvent(event["eventName"], true, true, null);
        event["element"].dispatchEvent(newEvent);
    }
}

const triggerInlineEvent = async (page) => {
    const inlineEvents = ["onclick", "onblur", "onchange", "onabort", "ondblclick", "onerror", "onfocus", "onkeydown", "onkeypress", "onkeyup", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onreset", "onresize", "onselect", "onsubmit", "onunload"];
    for (let eventName of inlineEvents) {
        let nodes = await page.$$(`[${eventName}]`);
        for (let node of nodes) {
            await triggerChildren(node, eventName, 0);
        }
    }
}

const triggerChildren = async (node, eventName, depth) => {
    if (depth === 3) {
        return;
    }
    await node.evaluate(fireInlineEvent, eventName.replace("on", ""), node);
    let children = await node.$$(':scope > *')
    await sleep(500); // sleep 500ms
    if (children.length > 0) {
        await triggerChildren(children[Math.floor(Math.random() * (children.length))], eventName, depth + 1);
    }
}

const fireInlineEvent = (node, eventName) => {
    console.log(`Triggering Inline event ${eventName}`)
    let event = document.createEvent("CustomEvent");
    event.initCustomEvent(eventName, false, true, null);
    try {
        node.dispatchEvent(event);
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    triggerDomEvent,
    triggerInlineEvent
}