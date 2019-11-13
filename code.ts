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

  constructor(rgba: RGBA) {
    this.color = {
      r:rgba.r,
      g:rgba.g,
      b:rgba.b
    };
    this.opacity = rgba.a;
  }
}

class Variable {
  name: string;
  rawValue: string;
  color?: RGBA;
}

const parseRGBAValue = (rawValue: string): RGBA => {
  const regex = /\([0-9][^\)]*\)/;
  const match = rawValue.match(regex);
  if (match) {
    let value = match[0];
    value = value.substr(1);
    value = value.substring(0, value.length - 1);
    const values = value.split(',');
    const r = parseFloat(values[0].trim()) / 255;
    const g = parseFloat(values[1].trim()) / 255;
    const b = parseFloat(values[2].trim()) / 255;
    const a = parseFloat(values[3].trim());
    return {
      r, g, b, a
    }
  }
  console.error(`Couldn't parse RGBA value ${rawValue}`);
  return { r: 0, b: 0, g: 0, a: 0 };
}

const parseHexValue = (rawValue: string): RGBA => {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(rawValue);
  if (result) {
    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;
    const a = 1;
    return { r, g, b, a };
  }
  console.error(`Couldn't parse HEX value ${rawValue}`);
  return { r: 0, b: 0, g: 0, a: 0 };
}

const parseStyles = (content: string): Variable[] => {
  // remove comments
  const commentsReg = /\/\*[\s\S]*?\*\/|\/\/.*/g;
  content = content.replace(commentsReg, '');
  // console.log("Will parse block:" + content);
  let lines = content.split(/\r?\n/);
  // remove empty lines
  lines = lines.filter(line => line.trim().length > 0);
  console.log(`will parse ${lines.length} lines`);

  // save variables with raw value, overriding
  let map: { [key: string]: Variable } = {};
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
    if (rawValue.startsWith('rgba(')) {
      return parseRGBAValue(rawValue);
    }
    if (rawValue.startsWith('#')) {
      return parseHexValue(rawValue);
    }
    if (rawValue.startsWith('var(')) {
      const reg = /\((.|\n)[^\)]*\)/;
      const match = rawValue.match(reg);
      if (match) {
        let variableName = match[0];
        variableName = variableName.substr(1);
        variableName = variableName.substring(0, variableName.length - 1);
        variableName = variableName.trim();
        const variableRawValue = map[variableName].rawValue;
        return getVariableValue(variableRawValue);
      }
    }
    const comps = rawValue.split(',');
    if (comps.length > 2) {
      const r = parseInt(comps[0]) / 255;
      const g = parseInt(comps[1]) / 255;
      const b = parseInt(comps[2]) / 255;
      const a = comps.length > 3 ? parseFloat(comps[3]) : 1;
      return { r, b, g, a };
    }
    const browserColor = browserColors[rawValue.toLowerCase()];
    if(browserColor){
      return parseHexValue(browserColor);
    }
    console.error(`Couldn't parse rawValue "${rawValue}"`);
    return { r: 0, b: 0, g: 0, a: 0 };
  }

  var keys = Object.keys(map);
  let result:Variable[] = [];
  keys.forEach(key => {
    const variable = map[key];
    variable.color = getVariableValue(variable.rawValue);
    result.push(variable);
    // console.log(`${variable.name} - ${variable.rawValue} - {r:${variable.color.r}, g:${variable.color.g}, b:${variable.color.b}, a:${variable.color.a}}`);
  });

  return result;
}

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === 'update-styles') {
    const fileContent = msg.fileContent as string;
    const cleanName = msg.cleanName as boolean;
    const addStyles = msg.addStyles as boolean;

    // find block
    const blockReg = /{(.|\n)[^}]*}/;
    const block = fileContent.match(blockReg);
    let variables:Variable[];
    if (block) {
      let blockContent = block[0];
      blockContent = blockContent.substr(1);
      blockContent = blockContent.substring(0, blockContent.length - 1);
      variables = parseStyles(blockContent);
    } else {
      variables = parseStyles(fileContent);
    }


    const styles = figma.getLocalPaintStyles();
    variables.forEach( variable => {
      let variableName = variable.name;
      if(cleanName){
        // remove "--" prefix
        variableName = variableName.substr(2);
      }
      let hasStyle = false;
      for (let i=0; i<styles.length; i++){
        const style = styles[i];
        if(style.name.toLowerCase() === variableName.toLowerCase()){
          style.paints = [new CustomPaint(variable.color)];
          hasStyle = true;
          i = styles.length;
        }
      }
      if(!hasStyle && addStyles){
        const style = figma.createPaintStyle();
        style.name = variable.name;
        style.paints = [new CustomPaint(variable.color)];
      }
    });

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

const browserColors = {
  aliceblue: '#f0f8ff',
  antiquewhite: '#faebd7',
  aqua: '#00ffff',
  aquamarine: '#7fffd4',
  azure: '#f0ffff',
  beige: '#f5f5dc',
  bisque: '#ffe4c4',
  black: '#000000',
  blanchedalmond: '#ffebcd',
  blue: '#0000ff',
  blueviolet: '#8a2be2',
  brown: '#a52a2a',
  burlywood: '#deb887',
  cadetblue: '#5f9ea0',
  chartreuse: '#7fff00',
  chocolate: '#d2691e',
  coral: '#ff7f50',
  cornflowerblue: '#6495ed',
  cornsilk: '#fff8dc',
  crimson: '#dc143c',
  cyan: '#00ffff',
  darkblue: '#00008b',
  darkcyan: '#008b8b',
  darkgoldenrod: '#b8860b',
  darkgray: '#a9a9a9',
  darkgrey: '#a9a9a9',
  darkgreen: '#006400',
  darkkhaki: '#bdb76b',
  darkmagenta: '#8b008b',
  darkolivegreen: '#556b2f',
  darkorange: '#ff8c00',
  darkorchid: '#9932cc',
  darkred: '#8b0000',
  darksalmon: '#e9967a',
  darkseagreen: '#8fbc8f',
  darkslateblue: '#483d8b',
  darkslategray: '#2f4f4f',
  darkslategrey: '#2f4f4f',
  darkturquoise: '#00ced1',
  darkviolet: '#9400d3',
  deeppink: '#ff1493',
  deepskyblue: '#00bfff',
  dimgray: '#696969',
  dimgrey: '#696969',
  dodgerblue: '#1e90ff',
  firebrick: '#b22222',
  floralwhite: '#fffaf0',
  forestgreen: '#228b22',
  fuchsia: '#ff00ff',
  gainsboro: '#dcdcdc',
  ghostwhite: '#f8f8ff',
  gold: '#ffd700',
  goldenrod: '#daa520',
  gray: '#808080',
  grey: '#808080	',
  green: '#008000',
  greenyellow: '#adff2f	',
  honeydew: '#f0fff0',
  hotpink: '#ff69b4',
  indianred: '#cd5c5c',
  indigo: '#4b0082',
  ivory: '#fffff0',
  khaki: '#f0e68c',
  lavender: '#e6e6fa',
  lavenderblush: '#fff0f5',
  lawngreen: '#7cfc00',
  lemonchiffon: '#fffacd',
  lightblue: '#add8e6',
  lightcoral: '#f08080',
  lightcyan: '#e0ffff',
  lightgoldenrodyellow: '#fafad2',
  lightgray: '#d3d3d3',
  lightgrey: '#d3d3d3',
  lightgreen: '#90ee90',
  lightpink: '#ffb6c1',
  lightsalmon: '#ffa07a',
  lightseagreen: '#20b2aa',
  lightskyblue: '#87cefa',
  lightslategray: '#778899',
  lightslategrey: '#778899',
  lightsteelblue: '#b0c4de',
  lightyellow: '#ffffe0',
  lime: '#00ff00',
  limegreen: '#32cd32',
  linen: '#faf0e6',
  magenta: '#ff00ff',
  maroon: '#800000',
  mediumaquamarine: '#66cdaa',
  mediumblue: '#0000cd',
  mediumorchid: '#ba55d3',
  mediumpurple: '#9370db',
  mediumseagreen: '#3cb371',
  mediumslateblue: '#7b68ee',
  mediumspringgreen: '#00fa9a',
  mediumturquoise: '#48d1cc',
  mediumvioletred: '#c71585',
  midnightblue: '#191970',
  mintcream: '#f5fffa',
  mistyrose: '#ffe4e1',
  moccasin: '#ffe4b5',
  navajowhite: '#ffdead',
  navy: '#000080',
  oldlace: '#fdf5e6',
  olive: '#808000',
  olivedrab: '#6b8e23',
  orange: '#ffa500',
  orangered: '#ff4500',
  orchid: '#da70d6',
  palegoldenrod: '#eee8aa',
  palegreen: '#98fb98',
  paleturquoise: '#afeeee',
  palevioletred: '#db7093',
  papayawhip: '#ffefd5',
  peachpuff: '#ffdab9',
  peru: '#cd853f',
  pink: '#ffc0cb',
  plum: '#dda0dd',
  powderblue: '#b0e0e6',
  purple: '#800080',
  rebeccapurple: '#663399',
  red: '#ff0000',
  rosybrown: '#bc8f8f',
  royalblue: '#4169e1',
  saddlebrown: '#8b4513',
  salmon: '#fa8072',
  sandybrown: '#f4a460',
  seagreen: '#2e8b57',
  seashell: '#fff5ee',
  sienna: '#a0522d',
  silver: '#c0c0c0',
  skyblue: '#87ceeb',
  slateblue: '#6a5acd',
  slategray: '#708090',
  slategrey: '#708090',
  snow: '#fffafa',
  springgreen: '#00ff7f',
  steelblue: '#4682b4',
  tan: '#d2b48c',
  teal: '#008080',
  thistle: '#d8bfd8',
  tomato: '#ff6347',
  turquoise: '#40e0d0',
  violet: '#ee82ee',
  wheat: '#f5deb3',
  white: '#ffffff',
  whitesmoke: '#f5f5f5',
  yellow: '#ffff00',
  yellowgreen: '#9acd32'
} as {[key: string]: string}
