// This plugin will open a modal to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser enviroment (see documentation).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

class CustomPaint implements SolidPaint {
  type: "SOLID" = "SOLID";
  color: RGB;
  visible?: boolean;
  opacity?: number;
  blendMode?: BlendMode;

  constructor(rgb: RGB){
    this.color = rgb;
  }
}

class Variable {
  name: string;
  rawValue: string;
  color?: RGBA;
}

const parseRGBAValue = (rawValue: string):RGBA => {
  const regex = /\([0-9][^\)]*\)/;
  const match = rawValue.match(regex);
  if(match){
    let value = match[0];
    value = value.substr(1);
    value = value.substring(0, value.length - 1);
    const values = value.split(',');
    const r = parseFloat(values[0].trim())/255;
    const g = parseFloat(values[1].trim())/255;
    const b = parseFloat(values[2].trim())/255;
    const a = parseFloat(values[3].trim());
    return {
      r,g,b,a
    }
  }
  console.error(`Couldn't parse RGBA value ${rawValue}`);
  return {r:0,b:0,g:0,a:0};
}

const parseHexValue = (rawValue: string):RGBA => {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(rawValue);
  if(result){
    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;
    const a = 1;
    return {r,g,b,a};
  }
  console.error(`Couldn't parse HEX value ${rawValue}`);
  return {r:0,b:0,g:0,a:0};
}

const parseStyles = (content: string):Variable[] => {
  // remove comments
  const commentsReg = /\/\*[\s\S]*?\*\/|\/\/.*/g;
  content = content.replace(commentsReg, '');
  // console.log("Will parse block:" + content);
  let lines = content.split(/\r?\n/);
  // remove empty lines
  lines = lines.filter(line => line.trim().length>0);
  console.log(`will parse ${lines.length} lines`);
  
  // save variables with raw value, overriding
  let map: {[key: string]: Variable} = {};
  lines.forEach(line => {
    line = line.trim();
    const comp = line.split(':');
    const name = comp[0].trim();
    let rawValue = comp[1].trim();
    // remove ':'
    rawValue = rawValue.substring(0, rawValue.length - 1);
    const variable = new Variable();
    variable.name = name;
    variable.rawValue = rawValue;
    map[name] = variable;
  });

  const getVariableValue = (rawValue: string): RGBA => {
    if(rawValue.startsWith('rgba(')){
      return parseRGBAValue(rawValue);
    }
    if(rawValue.startsWith('#')){
      return parseHexValue(rawValue);
    }
    if(rawValue.startsWith('var(')){
      const reg = /\((.|\n)[^\)]*\)/;
      const match = rawValue.match(reg);
      if(match){
        let variableName = match[0];
        variableName = variableName.substr(1);
        variableName = variableName.substring(0, variableName.length - 1);
        variableName = variableName.trim();
        const variableRawValue = map[variableName].rawValue;
        return getVariableValue(variableRawValue);
      }
    }
    const comps = rawValue.split(',');
    if(comps.length>2){
      const r = parseInt(comps[0])/255;
      const g = parseInt(comps[1])/255;
      const b = parseInt(comps[2])/255;
      const a = comps.length>3 ? parseFloat(comps[3]) : 1;
      return {r,b,g,a};
    }
    console.error(`Couldn't parse rawValue "${rawValue}"`);
    return {r:0,b:0,g:0,a:0};
  }

  var keys = Object.keys(map);
  keys.forEach( key => {
    const variable = map[key];
    variable.color = getVariableValue(variable.rawValue);
    console.log(`${variable.name} - ${variable.rawValue} - {r:${variable.color.r}, g:${variable.color.g}, b:${variable.color.b}, a:${variable.color.a}}`);
  });

  // 1 by 1 retrieve value
  return [];
}

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === 'update-styles') {
    const fileContent = msg.fileContent as string;
    // console.log("update styles with content: " + fileContent);

    // find block
    const blockReg = /{(.|\n)[^}]*}/;
    const block = fileContent.match(blockReg);
    if(block){
      let blockContent = block[0];
      blockContent = blockContent.substr(1);
      blockContent = blockContent.substring(0, blockContent.length - 1);
      parseStyles(blockContent);
    }else{
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
