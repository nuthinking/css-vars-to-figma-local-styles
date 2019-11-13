export const getTextWithinBounds = (text: string, startBound: string, endBound: string): string => {
  const start = text.indexOf(startBound);
  const end = text.indexOf(endBound);
  if (start === -1 || end === -1) {
    console.error(`Couldn't get extract text between "${startBound}" and "${endBound}". Text was "${text}"`);
    return text;
  }
  return text.substring(start + 1, end);
};