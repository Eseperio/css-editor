/**
 * Lucide icon helpers for the CSS Editor
 * Roadmap Task 2: Replace emojis with Lucide icons
 */
import {
  Sun,
  Moon,
  Settings,
  Monitor,
  Tablet,
  Smartphone,
  X,
  Plus,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Languages,
  MoveVertical,
  MoveHorizontal,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown
} from 'lucide';

// In this package build, each icon is exported as an IconNode:
// an array of [tagName, attrs] tuples describing the SVG children.
type SVGProps = Record<string, string | number>;
export type IconNode = [tag: string, attrs: SVGProps][];

const SVG_NS = 'http://www.w3.org/2000/svg';

function applyAttrs(el: Element, attrs: SVGProps): void {
  Object.entries(attrs).forEach(([key, value]) => {
    // Lucide uses dashed attrs like 'stroke-width'
    el.setAttribute(key, String(value));
  });
}

/**
 * Create an SVG icon element from a Lucide icon node.
 */
export function createIcon(icon: IconNode, className?: string): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');

  // Reasonable default attrs matching lucide icons
  applyAttrs(svg, {
    xmlns: SVG_NS,
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round'
  });

  if (className) svg.setAttribute('class', className);

  icon.forEach(([tag, attrs]) => {
    const child = document.createElementNS(SVG_NS, tag);
    applyAttrs(child, attrs);
    svg.appendChild(child);
  });

  return svg;
}

/**
 * Get icon HTML string for inline use.
 */
export function getIconHTML(icon: IconNode, className?: string): string {
  return createIcon(icon, className).outerHTML;
}

// Export commonly used icons
export const icons = {
  sun: Sun,
  moon: Moon,
  settings: Settings,
  monitor: Monitor,
  tablet: Tablet,
  smartphone: Smartphone,
  close: X,
  plus: Plus,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  alertTriangle: AlertTriangle,
  languages: Languages,
  moveVertical: MoveVertical,
  moveHorizontal: MoveHorizontal,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown
};
