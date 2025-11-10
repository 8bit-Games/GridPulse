/**
 * General utility functions for GridPulse
 * Modernized from bkcore.Utils
 */

/**
 * Parse URL parameters from the current location
 */
export class URLParameters {
  private static cache: Record<string, string> | null = null;

  static get(name: string): string | undefined {
    if (this.cache === null) {
      this.cache = {};
      window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (_, key, val) => {
        this.cache![key] = val;
        return '';
      });
    }
    return this.cache[name];
  }

  static clear(): void {
    this.cache = null;
  }
}

/**
 * Check if the device supports touch input
 */
export function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    (navigator as any).MaxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * Get the top offset of an element
 */
export function getOffsetTop(element: HTMLElement): number {
  let offset = element.offsetTop;
  let parent = element.offsetParent as HTMLElement;

  while (parent) {
    offset += parent.offsetTop;
    parent = parent.offsetParent as HTMLElement;
  }

  return offset;
}

/**
 * Scroll page to element with given ID
 */
export function scrollToElement(id: string): void {
  const element = document.getElementById(id);
  if (element) {
    window.scroll(0, getOffsetTop(element));
  }
}

/**
 * Add or remove a CSS class from an element
 */
export function updateClass(id: string, cssClass: string, active: boolean): void {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  if (active) {
    element.classList.add(cssClass);
  } else {
    element.classList.remove(cssClass);
  }
}

/**
 * Modern fetch-based HTTP request
 * Replaces the old XMLHttpRequest implementation
 */
export async function request(
  url: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(url, options);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

/**
 * Map a value from one range to another
 */
export function map(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Generate a random number between min and max
 */
export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(random(min, max + 1));
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}
