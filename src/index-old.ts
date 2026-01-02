import { ElementPicker } from './element-picker';
import { generateUniqueSelector } from './selector-generator';
import { CSSEditorPanel, CSSEditorOptions, ViewportMode } from './editor-panel';

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
  private iframe: HTMLIFrameElement | null = null;
  private iframeContainer: HTMLElement | null = null;

  constructor(options: CSSEditorOptions = {}) {
    this.options = options;
    this.picker = new ElementPicker();
    this.panel = new CSSEditorPanel(options);
    
    // Listen for viewport mode changes
    if (options.iframeMode) {
      window.addEventListener('viewportModeChange', this.handleViewportModeChange as EventListener);
    }
  }

  /**
   * Handle viewport mode changes from the panel
   */
  private handleViewportModeChange = (event: CustomEvent<{ mode: ViewportMode }>): void => {
    if (!this.iframe || !this.options.iframeMode) return;
    
    const mode = event.detail.mode;
    const sizes = this.options.iframeMode.viewportSizes || {
      desktop: window.innerWidth,
      tablet: 768,
      phone: 480
    };
    
    let width: number;
    switch (mode) {
      case 'tablet':
        width = sizes.tablet || 768;
        break;
      case 'phone':
        width = sizes.phone || 480;
        break;
      default:
        width = sizes.desktop || window.innerWidth;
    }
    
    this.iframe.style.width = `${width}px`;
    this.iframe.style.margin = mode === 'desktop' ? '0' : '0 auto';
  };

  /**
   * Initialize the CSS Editor with a button
   */
  public init(): void {
    // Create iframe if in iframe mode
    if (this.options.iframeMode) {
      this.createIframe();
    } else {
      this.createActivateButton();
    }
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
    const targetDoc = this.iframe?.contentDocument || document;
    const element = targetDoc.querySelector(selector);
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
   * Create iframe for iframe mode
   */
  private createIframe(): void {
    if (!this.options.iframeMode) return;
    
    // Create container for iframe
    this.iframeContainer = document.createElement('div');
    this.iframeContainer.id = 'css-editor-iframe-container';
    this.iframeContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #f0f0f0;
      z-index: 9990;
      overflow: auto;
    `;
    
    // Create iframe
    this.iframe = document.createElement('iframe');
    this.iframe.id = 'css-editor-iframe';
    const sizes = this.options.iframeMode.viewportSizes || {
      desktop: window.innerWidth,
      tablet: 768,
      phone: 480
    };
    
    this.iframe.style.cssText = `
      display: block;
      width: ${sizes.desktop || window.innerWidth}px;
      height: 100%;
      border: none;
      background: white;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
    `;
    
    this.iframe.src = this.options.iframeMode.url;
    
    // Wait for iframe to load
    this.iframe.addEventListener('load', () => {
      if (!this.iframe || !this.iframe.contentDocument) return;
      
      // Set target document for panel
      this.panel.setTargetDocument(this.iframe.contentDocument);
      
      // Set target document for picker
      this.picker.setTargetDocument(this.iframe.contentDocument, this.iframe);
      
      // Inject style element into iframe
      const iframeStyleElement = this.iframe.contentDocument.createElement('style');
      iframeStyleElement.id = 'css-editor-dynamic-styles';
      this.iframe.contentDocument.head.appendChild(iframeStyleElement);
      
      // Create activator button after iframe loads
      this.createActivateButton();
    });
    
    this.iframeContainer.appendChild(this.iframe);
    document.body.appendChild(this.iframeContainer);
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
    
    // Clean up iframe
    if (this.iframeContainer) {
      this.iframeContainer.remove();
      this.iframeContainer = null;
      this.iframe = null;
    }
    
    // Remove viewport mode change listener
    if (this.options.iframeMode) {
      window.removeEventListener('viewportModeChange', this.handleViewportModeChange as EventListener);
    }
  }
}

// Export all necessary classes and functions
export { ElementPicker } from './element-picker';
export { CSSEditorPanel, CSSEditorOptions, ViewportMode } from './editor-panel';
export { generateUniqueSelector } from './selector-generator';
export { CSS_PROPERTIES, COMMON_PROPERTIES, getPropertyValues, getAdvancedProperties } from './css-properties';
export { setLocale, getLocale, getAvailableLocales, getLocaleName, detectBrowserLocale, Locale } from './i18n';
