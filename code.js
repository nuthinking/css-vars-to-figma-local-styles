// This plugin will open a modal to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.
// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser enviroment (see documentation).
// This shows the HTML page in "ui.html".
figma.showUI(__html__);
class CustomPaint {
    constructor(rgb) {
        this.type = "SOLID";
        this.color = rgb;
    }
}
const parseStyles = (content) => {
    // remove comments
    const commentsReg = /\/\*[\s\S]*?\*\/|\/\/.*/g;
    content = content.replace(commentsReg, '');
    // console.log("Will parse block:" + content);
    let lines = content.split(/\r?\n/);
    // remove empty lines
    lines = lines.filter(line => line.trim().length > 0);
    console.log(`will parse ${lines.length} lines`);
    lines.forEach(line => {
        console.log(line);
    });
    // save variables with value, overriding
    // 1 by 1 retrieve value
};
// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.
    if (msg.type === 'update-styles') {
        const fileContent = msg.fileContent;
        // console.log("update styles with content: " + fileContent);
        // find block
        const blockReg = /{(.|\n)[^}]*}/;
        const block = fileContent.match(blockReg);
        if (block) {
            let blockContent = block[0];
            blockContent = blockContent.substr(1);
            blockContent = blockContent.substring(0, blockContent.length - 1);
            parseStyles(blockContent);
        }
        else {
            parseStyles(fileContent);
        }
        // const styles = figma.getLocalPaintStyles();
        // styles.forEach(s => {
        //   console.log("Style: " + s.name + ' - ' + s.type);
        //   if(s.name === "Red"){
        //     // 
        //     const p = new CustomPaint({r:1, g:0, b:0});
        //     s.paints = [p];
        //   }
        // });
        // const nodes: SceneNode[] = [];
        // for (let i = 0; i < msg.count; i++) {
        //   const rect = figma.createRectangle();
        //   rect.x = i * 150;
        //   rect.fills = [{type: 'SOLID', color: {r: 1, g: 0.0, b: 0}}];
        //   figma.currentPage.appendChild(rect);
        //   nodes.push(rect);
        // }
        // figma.currentPage.selection = nodes;
        // figma.viewport.scrollAndZoomIntoView(nodes);
    }
    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    figma.closePlugin();
};
