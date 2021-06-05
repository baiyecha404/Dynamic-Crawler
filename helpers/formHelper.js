const createFrame = () => {
    // create a form for submission
    const iframe = document.createElement('iframe');
    iframe.name = "formTarget";
    //iframe.display = "none";
    document.body.appendChild(iframe);
}

const handleForm = async (formNodes) => {
    for (let formNode of formNodes) {
        // set target to self iframe
        await formNode.evaluate(form => form.setAttribute("target", "formTarget"), formNode);

        const nodes = await formNode.$$("input, select, textarea, datalist");
        for (let node of nodes) {
            const nodeName = await node.evaluate(el => el.nodeName.toLowerCase(), node);
            if (nodeName === "input") {
                const type = await node.evaluate((node) => node.getAttribute("type"), node);
                await handleNode(node, "input", type);
            } else {
                await handleNode(node, nodeName, null);
            }
        }

        try {
            await formNode.evaluate(form => form.submit(), formNode);
        } catch (err) {
            try {
                let submit = await formNode.$("input[type=submit]");
                submit.click();
            } catch (err) {
                try {
                    let button = await formNode.$("button");
                    button.click();
                } catch (err) {
                    console.log("Form Submission Error!");
                }
            }
        } 
    }
}

const inputValue = async (node, type) => {
    switch (type) {
        case "email":
            await node.type("404@bycsec.top");
            break;
        case "username":
            await node.type("' or '1'='1");
            break;
        case "password":
            await node.type("' or 1#");
            break;
        case "url":
            await node.type("https://www.baidu.com");
            break;
        case "tel":
            await node.type("17340424043");
            break;
        case "date":
            await node.type("2021-06-05");
            break;
        case "file":
            await node.evaluate(node => node.removeAttribute('accept'), node);
            await node.evaluate(node => node.removeAttribute('required'), node);
            await node.uploadFile("./image/byc404.jpeg");
            break;
        case "radio":
            await node.click();
            break;
        case "checkbox":
            await node.click();
            break;
        case "submit":
            break;
        default:
            await node.type("' or 1#", { delay: 100 });
    }
}


const selectValue = async (node) => {
    await node.evaluate((node) => {
        node.children[Math.floor(Math.random() * (node.children.length))].selected = true;
    }, node);
}


const handleNode = async (node, name, type) => {
    switch (name) {
        case "input":
            if (type == 'text') {
                const typeList = ["email", "username", "password", "url", "tel", "date"];
                let possibleType = [];

                possibleType.push(await node.evaluate((node) => node.getAttribute('id'), node));
                possibleType.push(await node.evaluate((node) => node.getAttribute('name'), node));
                possibleType.push(await node.evaluate((node) => node.getAttribute('class'), node));

                possibleType.forEach((guess) => {
                    if (typeList.includes(guess)) {
                        type = guess;
                    }
                });
            }
            await inputValue(node, type);
            break;
        case "select": await selectValue(node);
            break;
        case "textarea": await node.type("' or 1#", { delay: 100 });
            break;
        case "datalist": await selectValue(node);
            break;
    }
}




module.exports = {
    createFrame,
    handleForm,
    handleNode
};