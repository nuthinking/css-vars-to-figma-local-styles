export const getTextWithinBounds = (text: string, startBound: string, endBound: string): string => {
  const start = text.indexOf(startBound);
  const end = text.indexOf(endBound);
  if (start === -1 || end === -1) {
    console.error(`Couldn't get extract text between "${startBound}" and "${endBound}". Text was "${text}"`);
    return text;
  }
  return text.substring(start + 1, end);
};

export const parseRGBAValue = (rawValue: string): RGBA => {
  const value = getTextWithinBounds(rawValue, '(', ')');
  const values = value.split(",");
  const r = parseFloat(values[0].trim()) / 255;
  const g = parseFloat(values[1].trim()) / 255;
  const b = parseFloat(values[2].trim()) / 255;
  const a = parseFloat(values[3].trim());
  return {
    r,
    g,
    b,
    a
  };
};

export const parseHexValue = (rawValue: string): RGBA => {
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
};