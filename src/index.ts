import { ElementPicker } from './element-picker';
import { generateUniqueSelector } from './selector-generator';
import { CSSEditorPanel, CSSEditorOptions } from './editor-panel';

/**
 * Main CSSEditor class
 */
export class CSSEditor {
  private picker: ElementPicker;
  private panel: CSSEditorPanel;
  private activateButton: HTMLElement | null = null;

  constructor(options: CSSEditorOptions = {}) {
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
   * Create a floating activate button
   */
  private createActivateButton(): void {
    this.activateButton = document.createElement('button');
    this.activateButton.id = 'css-editor-activate';
    this.activateButton.innerHTML = '🎨';
    this.activateButton.title = 'Activate CSS Editor';
    
    const style = document.createElement('style');
    style.textContent = `
      #css-editor-activate {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        color: white;
        font-size: 28px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 9998;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #css-editor-activate:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0,0,0,0.4);
      }
      #css-editor-activate.active {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        animation: pulse 1.5s ease-in-out infinite;
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `;
    document.head.appendChild(style);

    this.activateButton.addEventListener('click', () => {
      if (this.picker.isPickerActive()) {
        this.stopPicking();
        this.activateButton?.classList.remove('active');
      } else {
        this.startPicking();
        this.activateButton?.classList.add('active');
      }
    });

    document.body.appendChild(this.activateButton);
  }

  /**
   * Destroy the CSS Editor and clean up
   */
  public destroy(): void {
    this.picker.stop();
    this.panel.destroy();
    
    if (this.activateButton) {
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
