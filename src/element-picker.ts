/**
 * Element Picker class for selecting elements on the page
 */
export class ElementPicker {
  private isActive: boolean = false;
  private overlay: HTMLElement | null = null;
  private onElementSelected: ((element: Element) => void) | null = null;
  private currentHighlighted: Element | null = null;
  private targetDocument: Document = document;
  private targetIframe: HTMLIFrameElement | null = null;

  /**
   * Set target document for picker (for iframe mode)
   */
  public setTargetDocument(doc: Document, iframe?: HTMLIFrameElement): void {
    this.targetDocument = doc;
    this.targetIframe = iframe || null;
  }

  /**
   * Start picking mode
   */
  public start(callback: (element: Element) => void): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.onElementSelected = callback;
    this.createOverlay();
    this.attachListeners();
    document.body.style.cursor = 'crosshair';
    if (this.targetIframe && this.targetDocument.body) {
      this.targetDocument.body.style.cursor = 'crosshair';
    }
  }

  /**
   * Stop picking mode
   */
  public stop(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.removeOverlay();
    this.detachListeners();
    document.body.style.cursor = '';
    if (this.targetIframe && this.targetDocument.body) {
      this.targetDocument.body.style.cursor = '';
    }
    this.currentHighlighted = null;
  }

  /**
   * Create overlay for highlighting elements
   */
  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.id = 'css-editor-picker-overlay';
    this.overlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      border: 2px solid #3498db;
      background: rgba(52, 152, 219, 0.1);
      z-index: 9999;
      transition: all 0.1s ease;
    `;
    document.body.appendChild(this.overlay);
  }

  /**
   * Remove overlay
   */
  private removeOverlay(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  /**
   * Attach event listeners
   */
  private attachListeners(): void {
    this.targetDocument.addEventListener('mouseover', this.handleMouseOver);
    this.targetDocument.addEventListener('click', this.handleClick, true);
    this.targetDocument.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Detach event listeners
   */
  private detachListeners(): void {
    this.targetDocument.removeEventListener('mouseover', this.handleMouseOver);
    this.targetDocument.removeEventListener('click', this.handleClick, true);
    this.targetDocument.removeEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Handle mouse over event
   */
  private handleMouseOver = (e: MouseEvent): void => {
    if (!this.isActive) return;
    
    const target = e.target as Element;
    
    // Ignore our own overlay and editor panel
    if (
      target.id === 'css-editor-picker-overlay' ||
      target.id === 'css-editor-panel' ||
      target.closest('#css-editor-panel')
    ) {
      return;
    }

    this.currentHighlighted = target;
    this.highlightElement(target);
  };

  /**
   * Handle click event
   */
  private handleClick = (e: MouseEvent): void => {
    if (!this.isActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const target = e.target as Element;
    
    // Ignore our own elements
    if (
      target.id === 'css-editor-picker-overlay' ||
      target.id === 'css-editor-panel' ||
      target.closest('#css-editor-panel')
    ) {
      return;
    }

    this.stop();
    
    if (this.onElementSelected) {
      this.onElementSelected(target);
    }
  };

  /**
   * Handle keydown event (ESC to cancel)
   */
  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.stop();
    }
  };

  /**
   * Highlight an element
   */
  private highlightElement(element: Element): void {
    if (!this.overlay) return;
    
    const rect = element.getBoundingClientRect();
    
    // Calculate position
    let scrollLeft, scrollTop, top, left;
    
    if (this.targetIframe) {
      // For iframe mode, position relative to main document
      const iframeRect = this.targetIframe.getBoundingClientRect();
      scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Adjust coordinates to be relative to iframe in main document
      left = rect.left + iframeRect.left + scrollLeft;
      top = rect.top + iframeRect.top + scrollTop;
    } else {
      // For normal mode
      scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      left = rect.left + scrollLeft;
      top = rect.top + scrollTop;
    }
    
    this.overlay.style.left = `${left}px`;
    this.overlay.style.top = `${top}px`;
    this.overlay.style.width = `${rect.width}px`;
    this.overlay.style.height = `${rect.height}px`;
  }

  /**
   * Check if picker is active
   */
  public isPickerActive(): boolean {
    return this.isActive;
  }
}
