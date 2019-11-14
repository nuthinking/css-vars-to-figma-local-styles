import Token from './model/Token';
import TokenType from './model/TokenType';

const PAGE_NAME = '🎨 Design Tokens';
const FONT_SIZE = 15;
const SWATCH_SIZE = 24;
const PRIMARY_LABEL_COLOR: RGBA = { r: 0, g: 0, b: 0, a: 0.95 };
const SECONDARY_LABEL_COLOR: RGBA = { r: 0, g: 0, b: 0, a: 0.4 };
const HORIZONTAL_SPACING = 8;
const VERTICAL_SPACING = 16;
const PADDING = 40;

enum TokenLevel {
  PRIMARY,
  SECONDARY
}

(async () => {
  const text = figma.createText();
  const defaultFont = text.fontName as FontName;
  await figma.loadFontAsync(defaultFont);
  console.log(`Font ${defaultFont.family} now ready to use.`);
  text.remove();
})();

const getTreePage = (): PageNode => {
  let treePage: PageNode = null;
  let documentPages = figma.root.children;

  documentPages.forEach(page => {
    if (page.name == PAGE_NAME) {
      while (page.children.length > 0) {
        page.children[0].remove();
      }
      treePage = page;
    }
  });

  if (treePage === null) {
    treePage = figma.createPage();
    treePage.name = PAGE_NAME;
  }
  figma.currentPage = treePage;

  return treePage;
};

const createArrow = (): TextNode => {
  let arrowNode = figma.createText();
  arrowNode.name = 'arrow';
  arrowNode.characters = '🡢';

  arrowNode.resize(arrowNode.width, SWATCH_SIZE);
  arrowNode.textAlignVertical = 'CENTER';

  arrowNode.fills = [
    {
      type: 'SOLID',
      color: {
        r: SECONDARY_LABEL_COLOR.r,
        g: SECONDARY_LABEL_COLOR.g,
        b: SECONDARY_LABEL_COLOR.b
      },
      opacity: SECONDARY_LABEL_COLOR.a
    }
  ];

  return arrowNode;
};

const createToken = (name: string, tokenType: TokenLevel): TextNode => {
  let labelText = figma.createText();
  labelText.fontSize = FONT_SIZE;
  labelText.characters = name;
  labelText.resize(labelText.width, SWATCH_SIZE);
  labelText.textAlignVertical = 'CENTER';

  let activeLabelColor: RGBA;

  switch (tokenType) {
    case TokenLevel.PRIMARY:
      activeLabelColor = PRIMARY_LABEL_COLOR;
      break;
    case TokenLevel.SECONDARY:
      activeLabelColor = SECONDARY_LABEL_COLOR;
      break;
  }

  labelText.fills = [
    {
      type: 'SOLID',
      color: {
        r: activeLabelColor.r,
        g: activeLabelColor.g,
        b: activeLabelColor.b
      },
      opacity: activeLabelColor.a
    }
  ];

  return labelText;
};

const createColorSwatch = (color: RGBA): RectangleNode => {
  let swatchRectangle = figma.createRectangle();

  swatchRectangle.resize(SWATCH_SIZE, SWATCH_SIZE);

  swatchRectangle.fills = [
    {
      type: 'SOLID',
      color: { r: color.r, g: color.g, b: color.b },
      opacity: color.a
    }
  ];
  swatchRectangle.strokes = [
    { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0.08 }
  ];

  swatchRectangle.strokeWeight = 1;
  swatchRectangle.strokeAlign = 'INSIDE';
  swatchRectangle.cornerRadius = 2;

  return swatchRectangle;
};

const addParent = (frame: FrameNode, text: string) => {
  let x = frame.width;

  //Create and place arrow
  const arrowNode = createArrow();
  arrowNode.x = x + HORIZONTAL_SPACING;

  let currentLabel = createToken(text, TokenLevel.SECONDARY);

  x = arrowNode.x + arrowNode.width;
  currentLabel.x = x + HORIZONTAL_SPACING;

  frame.appendChild(arrowNode);
  frame.appendChild(currentLabel);

  frame.resize(currentLabel.x + currentLabel.width, frame.height);
};

export default (tokens: Token[], originX: number = 0, originY: number = 0) => {
  const page = getTreePage();
  const artboard = figma.createFrame();

  let currentY = PADDING;
  let maxWidth: number = 0;

  tokens.forEach(token => {
    if (token.type !== TokenType.Color) {
      return;
    }
    const frame = figma.createFrame();
    frame.clipsContent = false;
    frame.backgrounds = [];

    //move the
    frame.x = PADDING;
    frame.y = currentY;

    //name the frame
    frame.name = token.name;

    //Create and place swatch
    let colorSwatch = createColorSwatch(token.color);
    colorSwatch.constraints = { horizontal: 'MIN', vertical: 'MIN' };

    //Create and place token
    let currentLabel = createToken(token.name, TokenLevel.PRIMARY);
    currentLabel.constraints = { horizontal: 'MIN', vertical: 'MIN' };

    //put the elements inside the frame
    frame.appendChild(colorSwatch);
    colorSwatch.x = 0;
    colorSwatch.y = 0;

    frame.appendChild(currentLabel);
    currentLabel.x = SWATCH_SIZE + HORIZONTAL_SPACING;
    currentLabel.y = 0;

    //resize frame to content
    frame.resize(currentLabel.x + currentLabel.width, colorSwatch.height);

    let lastToken = token;
    let currentAncestor = token.parent;
    while (currentAncestor) {
      lastToken = currentAncestor;
      addParent(frame, currentAncestor.name);
      currentAncestor = currentAncestor.parent;
    }
    addParent(frame, lastToken.rawValue);

    maxWidth = Math.max(maxWidth, frame.width);

    artboard.appendChild(frame);
    currentY = frame.y + frame.height + VERTICAL_SPACING;
  });
  artboard.x = originX;
  artboard.y = originY;
  artboard.resize(maxWidth + PADDING * 2, currentY + PADDING);
  page.appendChild(artboard);
  figma.viewport.scrollAndZoomIntoView([artboard]);
};
