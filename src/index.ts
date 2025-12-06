import { ElementPicker } from './element-picker';
import { generateUniqueSelector } from './selector-generator';
import { CSSEditorPanel, CSSEditorOptions } from './editor-panel';

/**
 * Main CSSEditor class
 */
export class CSSEditor {
  // Task 2: Text constants for activator button
  private static readonly ACTIVATOR_TEXT_INACTIVE = 'Press here to enter style editor';
  private static readonly ACTIVATOR_TEXT_ACTIVE = 'Click any element to edit its styles';
  
  private picker: ElementPicker;
  private panel: CSSEditorPanel; 
  private activateButton: HTMLElement | null = null;
  private options: CSSEditorOptions; // Store options for reference

  constructor(options: CSSEditorOptions = {}) {
    this.options = options;
    this.picker = new ElementPicker();
    this.panel = new CSSEditorPanel(options);
  }

  /**
   * Initialize the CSS Editor with a button
   */
  public init(): void {
    this.createActivateButton();
  }

  /**
   * Start element picking mode
   */
  public startPicking(): void {
    this.picker.start((element: Element) => {
      const selector = generateUniqueSelector(element);
      this.panel.show(selector, element);
    });
  }

  /**
   * Stop element picking mode
   */
  public stopPicking(): void {
    this.picker.stop();
  }

  /**
   * Show the editor panel for a specific selector
   */
  public showEditor(selector: string): void {
    const element = document.querySelector(selector);
    if (element) {
      this.panel.show(selector, element);
    } else {
      console.error(`Element not found for selector: ${selector}`);
    }
  }

  /**
   * Hide the editor panel
   */
  public hideEditor(): void {
    this.panel.hide();
  }

  /**
   * Create a floating activate button or use custom element
   * Task 1: Support custom activator element via CSS selector
   * Task 2: Use fixed top bar instead of floating button
   */
  private createActivateButton(): void {
    // Task 1: If custom activator selector is provided, use that element
    if (this.options.activatorSelector) {
      const customElement = document.querySelector(this.options.activatorSelector);
      if (customElement) {
        this.activateButton = customElement as HTMLElement;
        this.attachActivatorListeners();
        return;
      } else {
        console.warn(`Custom activator element not found: ${this.options.activatorSelector}`);
        // Fall through to create default activator
      }
    }
    
    // Task 2: Create fixed top bar instead of floating button
    this.activateButton = document.createElement('div');
    this.activateButton.id = 'css-editor-activate';
    this.activateButton.textContent = CSSEditor.ACTIVATOR_TEXT_INACTIVE;
    this.activateButton.title = 'Activate CSS Editor';
    
    const style = document.createElement('style');
    style.textContent = `
      #css-editor-activate {
        position: fixed;
        top: 0;
        width: 100%;
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 10px 20px;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        z-index: 9998;
        transition: all 0.3s ease;
        text-align: center;
        user-select: none;
      }
      #css-editor-activate:hover {
        background: rgba(0, 0, 0, 0.95);
      }
      #css-editor-activate.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(this.activateButton);
    this.attachActivatorListeners();
  }

  /**
   * Attach click listeners to the activator element
   */
  private attachActivatorListeners(): void {
    if (!this.activateButton) return;
    
    this.activateButton.addEventListener('click', () => {
      if (this.picker.isPickerActive()) {
        this.stopPicking();
        this.activateButton?.classList.remove('active');
        // Task 2: Reset text when deactivating
        if (!this.options.activatorSelector) {
          this.activateButton!.textContent = CSSEditor.ACTIVATOR_TEXT_INACTIVE;
        }
      } else {
        this.startPicking();
        this.activateButton?.classList.add('active');
        // Task 2: Update text when activating
        if (!this.options.activatorSelector) {
          this.activateButton!.textContent = CSSEditor.ACTIVATOR_TEXT_ACTIVE;
        }
      }
    });
  }

  /**
   * Destroy the CSS Editor and clean up
   */
  public destroy(): void {
    this.picker.stop();
    this.panel.destroy();
    
    // Only remove if we created it (not custom activator)
    if (this.activateButton && !this.options.activatorSelector) {
      this.activateButton.remove();
      this.activateButton = null;
    }
  }
}

// Export all necessary classes and functions
export { ElementPicker } from './element-picker';
export { CSSEditorPanel, CSSEditorOptions } from './editor-panel';
export { generateUniqueSelector } from './selector-generator';
export { CSS_PROPERTIES, COMMON_PROPERTIES, getPropertyValues, getAdvancedProperties } from './css-properties';
export { setLocale, getLocale, getAvailableLocales, getLocaleName, detectBrowserLocale, Locale } from './i18n';
