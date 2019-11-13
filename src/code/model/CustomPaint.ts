export default class implements SolidPaint {
  type: "SOLID" = "SOLID";
  color: RGB;
  visible?: boolean;
  opacity?: number;
  blendMode?: BlendMode;

  constructor(rgba: RGBA) {
    this.color = {
      r: rgba.r,
      g: rgba.g,
      b: rgba.b
    };
    this.opacity = rgba.a;
  }
}