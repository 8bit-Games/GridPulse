/**
 * ImageData utility for loading images and accessing pixel data
 * Used for collision maps and height maps
 * Modernized from bkcore.ImageData
 */

export interface PixelData {
  r: number;
  g: number;
  b: number;
  a: number;
}

export class ImageData {
  private image: HTMLImageElement | null;
  private pixels: ImageData | null;
  private canvas: HTMLCanvasElement | null;
  public loaded: boolean;

  constructor(path: string, callback?: () => void) {
    this.image = new Image();
    this.pixels = null;
    this.canvas = null;
    this.loaded = false;

    this.image.onload = () => {
      this.processImage();
      if (callback) {
        callback.call(this);
      }
    };

    this.image.onerror = () => {
      console.error(`Failed to load image: ${path}`);
    };

    this.image.crossOrigin = 'anonymous';
    this.image.src = path;
  }

  /**
   * Process the loaded image and extract pixel data
   */
  private processImage(): void {
    if (!this.image) return;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.image.width;
    this.canvas.height = this.image.height;

    const context = this.canvas.getContext('2d');
    if (!context) {
      console.error('Failed to get 2D context');
      return;
    }

    context.drawImage(this.image, 0, 0);
    this.pixels = context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.loaded = true;

    // Clean up to free memory
    this.canvas = null;
    this.image = null;
  }

  /**
   * Get pixel RGBA data at given coordinates
   * @param x - X coordinate in pixels
   * @param y - Y coordinate in pixels
   * @returns Pixel RGBA data
   */
  getPixel(x: number, y: number): PixelData {
    if (
      !this.pixels ||
      x < 0 ||
      y < 0 ||
      x >= this.pixels.width ||
      y >= this.pixels.height
    ) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }

    const index = (y * this.pixels.width + x) * 4;
    return {
      r: this.pixels.data[index],
      g: this.pixels.data[index + 1],
      b: this.pixels.data[index + 2],
      a: this.pixels.data[index + 3],
    };
  }

  /**
   * Get pixel RGBA data at float coordinates using bilinear interpolation
   * @param fx - X coordinate in subpixels
   * @param fy - Y coordinate in subpixels
   * @returns Interpolated pixel RGBA data
   */
  getPixelBilinear(fx: number, fy: number): PixelData {
    const x = Math.floor(fx);
    const y = Math.floor(fy);
    const rx = fx - x - 0.5;
    const ry = fy - y - 0.5;
    const ax = Math.abs(rx);
    const ay = Math.abs(ry);
    const dx = rx < 0 ? -1 : 1;
    const dy = ry < 0 ? -1 : 1;

    // Get the 4 surrounding pixels
    const c = this.getPixel(x, y);
    const cx = this.getPixel(x + dx, y);
    const cy = this.getPixel(x, y + dy);
    const cxy = this.getPixel(x + dx, y + dy);

    // Interpolate horizontally
    const cf1 = [
      (1 - ax) * c.r + ax * cx.r,
      (1 - ax) * c.g + ax * cx.g,
      (1 - ax) * c.b + ax * cx.b,
      (1 - ax) * c.a + ax * cx.a,
    ];

    const cf2 = [
      (1 - ax) * cy.r + ax * cxy.r,
      (1 - ax) * cy.g + ax * cxy.g,
      (1 - ax) * cy.b + ax * cxy.b,
      (1 - ax) * cy.a + ax * cxy.a,
    ];

    // Interpolate vertically
    return {
      r: (1 - ay) * cf1[0] + ay * cf2[0],
      g: (1 - ay) * cf1[1] + ay * cf2[1],
      b: (1 - ay) * cf1[2] + ay * cf2[2],
      a: (1 - ay) * cf1[3] + ay * cf2[3],
    };
  }

  /**
   * Get pixel data as 3-byte integer (for height map encoding)
   * Combines R + G*255 + B*255*255
   * @param x - X coordinate in pixels
   * @param y - Y coordinate in pixels
   * @returns Encoded height value
   */
  getPixelF(x: number, y: number): number {
    const c = this.getPixel(x, y);
    return c.r + c.g * 255 + c.b * 255 * 255;
  }

  /**
   * Get bilinear interpolated pixel data as 3-byte integer
   * @param fx - X coordinate in subpixels
   * @param fy - Y coordinate in subpixels
   * @returns Interpolated encoded height value
   */
  getPixelFBilinear(fx: number, fy: number): number {
    const c = this.getPixelBilinear(fx, fy);
    return c.r + c.g * 255 + c.b * 255 * 255;
  }

  /**
   * Get image dimensions
   */
  getDimensions(): { width: number; height: number } | null {
    if (!this.pixels) {
      return null;
    }
    return {
      width: this.pixels.width,
      height: this.pixels.height,
    };
  }
}
