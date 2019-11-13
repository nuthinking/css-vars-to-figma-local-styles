import TokenType from "./TokenType";

class Token {
  name: string;
  type: TokenType = TokenType.Unknown;
  rawValue: string;
  parent?: Token;
  color?: RGBA;
}


export default Token;