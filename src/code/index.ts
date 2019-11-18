// This plugin will open a modal to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser enviroment (see documentation).

import Token from './model/Token';
import browserColors from './browserColors';
import {
  getTextWithinBounds,
  parseRGBAValue,
  parseHexValue
} from '../utils/index';
import TokenType from './model/TokenType';
import CustomPaint from './model/CustomPaint';
import MessageType from '../messages/MessageType';
import drawTokens from './drawTokens';
import { humanSort } from '../utils/index';
const clientStoragePrefix = 'css-2-local-vars-';

(async () => {
  const elements = ['cleanName', 'addStyles', 'createTree'];
  let msg = { type: MessageType.InitializeUI };
  for (var i = 0; i < elements.length; i++) {
    const id = elements[i];
    msg[id] = await figma.clientStorage.getAsync(clientStoragePrefix + id);
  }
  figma.ui.postMessage(msg);
  console.log('UI Restored');
})();

// This shows the HTML page in "ui.html".
figma.showUI(__html__);
figma.ui.resize(300, 230);

const parseStyles = (content: string): Token[] => {
  // remove comments
  const commentsReg = /\/\*[\s\S]*?\*\/|\/\/.*/g;
  content = content.replace(commentsReg, '');
  // console.log("Will parse block:" + content);
  let lines = content.split(/\r?\n/);
  // remove empty lines
  lines = lines.filter(line => line.trim().length > 0);
  console.log(`will parse ${lines.length} lines`);

  // save variables with raw value, overriding
  let tokensDict: { [key: string]: Token } = {};
  lines.forEach(line => {
    line = line.trim();
    const comp = line.split(':');
    const name = comp[0].trim();
    let rawValue = comp[1].trim();
    // remove ':'
    rawValue = rawValue.substring(0, rawValue.length - 1);
    const token = new Token();
    token.name = name;
    token.rawValue = rawValue;
    tokensDict[name] = token;
  });

  const retrieveTokenValue = (token: Token) => {
    const rawValue = token.rawValue;
    if (rawValue.startsWith('rgba(')) {
      token.type = TokenType.Color;
      token.color = parseRGBAValue(rawValue);
      return;
    }
    if (rawValue.startsWith('#')) {
      token.type = TokenType.Color;
      token.color = parseHexValue(rawValue);
      return;
    }
    if (rawValue.startsWith('var(')) {
      const variableName = getTextWithinBounds(rawValue, '(', ')').trim();
      if (tokensDict[variableName]) {
        const parentToken = tokensDict[variableName];
        retrieveTokenValue(parentToken);
        token.parent = parentToken;
        token.type = parentToken.type;
        if (token.type === TokenType.Color) {
          token.color = parentToken.color;
        }
      } else {
        console.error(`Token ${variableName} is not present in the file`);
      }
      return;
    }
    const comps = rawValue.split(',');
    if (comps.length > 2) {
      const r = parseInt(comps[0]) / 255;
      const g = parseInt(comps[1]) / 255;
      const b = parseInt(comps[2]) / 255;
      const a = comps.length > 3 ? parseFloat(comps[3]) : 1;
      token.type = TokenType.Color;
      token.color = { r, b, g, a };
      return;
    }
    const browserColor = browserColors[rawValue.toLowerCase()];
    if (browserColor) {
      token.type = TokenType.Color;
      token.color = parseHexValue(browserColor);
      return;
    }
    console.error(`Couldn't parse rawValue "${rawValue}"`);
  };

  var keys = Object.keys(tokensDict);
  console.log(`Imported ${keys.length} tokens`);
  let result: Token[] = [];
  keys.forEach(name => {
    const token = tokensDict[name];
    retrieveTokenValue(token);
    result.push(token);
    // console.log(`${variable.name} - ${variable.rawValue} - {r:${variable.color.r}, g:${variable.color.g}, b:${variable.color.b}, a:${variable.color.a}}`);
  });

  return result;
};

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {
  switch (msg.type) {
    case MessageType.SetLocalStorageItem:
      figma.clientStorage
        .setAsync(clientStoragePrefix + msg.key, msg.value)
        .then(() => console.log(`Updated ${msg.key} to ${msg.value} `));
      break;
    case MessageType.ImportStyles:
      const fileContent = msg.fileContent as string;
      const cleanName = msg.cleanName as boolean;
      const addStyles = msg.addStyles as boolean;
      const createTree = msg.createTree as boolean;

      let tokens: Token[] = [];
      const hasBlock = fileContent.indexOf('{') > -1;
      if (hasBlock) {
        const blockContent = getTextWithinBounds(fileContent, '{', '}');
        tokens = parseStyles(blockContent);
      } else {
        tokens = parseStyles(fileContent);
      }
      if (cleanName) {
      tokens.forEach(token => {
        let tokenName = token.name;
          // remove "--" prefix
          token.name = token.name.substr(2);
        });
      }

      if (createTree) {
        tokens = tokens.sort(humanSort);
        drawTokens(tokens);
      }

      let updatedStylesCount = 0;
      let addedStylesCount = 0;
      const styles = figma.getLocalPaintStyles();
      tokens.forEach(token => {
        let tokenName = token.name;
        if (token.type !== TokenType.Color) {
          console.log(
            `Can't create style for ${tokenName} type ${token.type} because only Colors are supported`
          );
          return;
        }

        let hasStyle = false;
        for (let i = 0; i < styles.length; i++) {
          const style = styles[i];
          if (style.name.toLowerCase() === tokenName.toLowerCase()) {
            style.paints = [new CustomPaint(token.color)];
            hasStyle = true;
            i = styles.length;
            updatedStylesCount++;
          }
        }
        if (!hasStyle && addStyles) {
          const style = figma.createPaintStyle();
          style.name = token.name;
          style.paints = [new CustomPaint(token.color)];
          addedStylesCount++;
        }
      });
      alert(
        `Updated ${updatedStylesCount} styles and added ${addedStylesCount}.`
      );
      // console.log(`Updated ${updatedStylesCount} styles`);
      // console.log(`Added ${addedStylesCount} styles`);
      // Make sure to close the plugin when you're done. Otherwise the plugin will
      // keep running, which shows the cancel button at the bottom of the screen.
      figma.closePlugin();
      break;
  }
};
