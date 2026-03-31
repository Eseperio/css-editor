import { mount, unmount } from 'svelte';
import './styles/editor-panel.scss';
import { ElementPicker } from './element-picker';
import { generateUniqueSelector } from './selector-generator';
import CSSEditorComponent from './components/CSSEditor.svelte';
import { panelVisible } from './stores/ui';

/**
 * CSS Editor Options Interface
 */
export interface CSSEditorOptions {
  loadEndpoint?: string;
  saveEndpoint?: string;
  onSave?: (css: string) => void;
  onLoad?: () => Promise<string>;
  onChange?: (css: string) => void;
  stylesUrl?: string;
  fontFamilies?: string[];
  locale?: string;
  activatorSelector?: string;
  buttons?: {
    save?: { label?: string; visible?: boolean };
    load?: { label?: string; visible?: boolean };
    export?: { label?: string; visible?: boolean };
    clear?: { label?: string; visible?: boolean };
  };
  showGeneratedCSS?: boolean;
  iframeMode?: {
    url: string;
    viewportSizes?: {
      desktop?: number;
      tablet?: number;
      phone?: number;
    };
  };
}

/**
 * Main CSSEditor class - Wrapper around Svelte component
 * Maintains backwards compatibility with the vanilla TypeScript API
 */
type CSSEditorComponentProps = Omit<CSSEditorOptions, 'activatorSelector'>;

type CSSEditorComponentExports = {
  show: (selector: string, element?: Element | null) => void;
  hide: () => void;
  clear: () => void;
};

export class CSSEditor {
  private static readonly ACTIVATOR_TEXT_INACTIVE = 'Open style editor';
  private static readonly ACTIVATOR_TEXT_ACTIVE = 'Close style editor';
  
  private picker: ElementPicker;
  private component: CSSEditorComponentExports | null = null;
  private activateButton: HTMLElement | null = null;
  private options: CSSEditorOptions;
  private iframe: HTMLIFrameElement | null = null;
  private iframeContainer: HTMLElement | null = null;
  private containerElement: HTMLElement;
  private ownsActivateButton: boolean = false;
  private isPanelOpen: boolean = false;
  private unsubscribePanelVisible: (() => void) | null = null;

  constructor(options: CSSEditorOptions = {}) {
    this.options = options;
    this.picker = new ElementPicker();
    
    // Create a container for the Svelte component
    this.containerElement = document.createElement('div');
    this.containerElement.id = 'css-editor-svelte-container';
    document.body.appendChild(this.containerElement);
    
    // Initialize the Svelte component
    this.component = mount<CSSEditorComponentProps, CSSEditorComponentExports>(CSSEditorComponent, {
      target: this.containerElement,
      props: {
        loadEndpoint: options.loadEndpoint,
        saveEndpoint: options.saveEndpoint,
        onSave: options.onSave,
        onLoad: options.onLoad,
        onChange: options.onChange,
        stylesUrl: options.stylesUrl,
        fontFamilies: options.fontFamilies,
        locale: options.locale,
        buttons: options.buttons,
        showGeneratedCSS: options.showGeneratedCSS,
        iframeMode: options.iframeMode
      },
    });
    
    // Handle iframe mode if configured
    if (options.iframeMode) {
      window.addEventListener('viewportModeChange', this.handleViewportModeChange as EventListener);
    }

    this.unsubscribePanelVisible = panelVisible.subscribe((visible) => {
      this.isPanelOpen = visible;
      if (visible) {
        this.startPersistentPicking();
      } else {
        this.stopPicking();
      }
      this.updateActivateButtonLabel(visible);
    });
  }

  /**
   * Handle viewport mode changes for iframe
   */
  private handleViewportModeChange = (event: CustomEvent<{ mode: string }>): void => {
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
   * Initialize the CSS Editor
   */
  public init(): void {
    this.createActivateButton();

    if (this.options.iframeMode) {
      this.createIframe();
    }
  }

  /**
   * Start element picking mode
   */
  public startPicking(): void {
    this.picker.start((element: Element) => {
      this.handleElementSelection(element);
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
    if (element && this.component) {
      this.component.show(selector, element);
    } else {
      console.error(`Element not found for selector: ${selector}`);
    }
  }

  /**
   * Hide the editor panel
   */
  public hideEditor(): void {
    if (this.component) {
      this.component.hide();
    }
  }

  /**
   * Clear all changes
   */
  public clear(): void {
    if (this.component) {
      this.component.clear();
    }
  }

  /**
   * Destroy the editor and clean up
   */
  public destroy(): void {
    if (this.component) {
      unmount(this.component);
      this.component = null;
    }
    
    if (this.containerElement && this.containerElement.parentNode) {
      this.containerElement.parentNode.removeChild(this.containerElement);
    }
    
    if (this.ownsActivateButton && this.activateButton && this.activateButton.parentNode) {
      this.activateButton.parentNode.removeChild(this.activateButton);
    }
    this.activateButton = null;
    this.ownsActivateButton = false;
    
    if (this.iframeContainer && this.iframeContainer.parentNode) {
      this.iframeContainer.parentNode.removeChild(this.iframeContainer);
      this.iframeContainer = null;
      this.iframe = null;
    }
    
    this.picker.stop();

    if (this.unsubscribePanelVisible) {
      this.unsubscribePanelVisible();
      this.unsubscribePanelVisible = null;
    }
    
    if (this.options.iframeMode) {
      window.removeEventListener('viewportModeChange', this.handleViewportModeChange as EventListener);
    }
  }

  /**
   * Create iframe for iframe mode
   */
  private createIframe(): void {
    if (!this.options.iframeMode) return;
    
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
    
    this.iframe.addEventListener('load', () => {
      if (this.iframe?.contentDocument) {
        this.picker.setTargetDocument(this.iframe.contentDocument, this.iframe);
        if (this.isPanelOpen) {
          this.startPersistentPicking();
        }
      }
    });
    
    this.iframeContainer.appendChild(this.iframe);
    document.body.appendChild(this.iframeContainer);
    
  }

  /**
   * Create activator button
   */
  private createActivateButton(): void {
    if (this.activateButton) return;

    const selector = this.options.activatorSelector;
    
    if (selector) {
      this.activateButton = document.querySelector(selector);
      if (!this.activateButton) {
        console.warn(`Activator element not found: ${selector}`);
        return;
      }
      this.activateButton.setAttribute('data-css-editor-activator', 'true');
      this.ownsActivateButton = false;
    } else {
      this.activateButton = document.createElement('button');
      this.activateButton.id = 'css-editor-activator';
      this.activateButton.textContent = CSSEditor.ACTIVATOR_TEXT_INACTIVE;
      this.activateButton.setAttribute('data-css-editor-activator', 'true');
      this.activateButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        transition: all 0.3s ease;
      `;
      document.body.appendChild(this.activateButton);
      this.ownsActivateButton = true;
    }
    
    this.activateButton.addEventListener('click', () => {
      if (!this.component) return;

      if (this.isPanelOpen) {
        this.component.hide();
      } else {
        this.component.show('', null);
      }
    });

    this.updateActivateButtonLabel(this.isPanelOpen);
  }

  private startPersistentPicking(): void {
    if (this.options.iframeMode && !this.iframe?.contentDocument) {
      return;
    }
    this.picker.stop();
    this.picker.start((element: Element) => {
      this.handleElementSelection(element);
    }, { persistent: true });
  }

  private handleElementSelection(element: Element): void {
    const selector = generateUniqueSelector(element);
    if (this.component) {
      this.component.show(selector, element);
    }
  }

  private updateActivateButtonLabel(isActive: boolean): void {
    if (!this.activateButton || !this.ownsActivateButton) return;
    this.activateButton.textContent = isActive
      ? CSSEditor.ACTIVATOR_TEXT_ACTIVE
      : CSSEditor.ACTIVATOR_TEXT_INACTIVE;
  }
}

// Default export for UMD
export default CSSEditor;
