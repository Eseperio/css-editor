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
  AlertTriangle
} from 'lucide';

/**
 * Create an SVG icon element from a Lucide icon
 */
export function createIcon(icon: any, className?: string): HTMLElement {
  const iconElement = icon.create({
    width: 16,
    height: 16,
    class: className || ''
  });
  return iconElement;
}

/**
 * Get icon HTML string for inline use
 */
export function getIconHTML(icon: any, className?: string): string {
  const iconElement = icon.create({
    width: 16,
    height: 16,
    class: className || ''
  });
  return iconElement.outerHTML;
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
  alertTriangle: AlertTriangle
};
