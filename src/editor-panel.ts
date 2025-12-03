import { CSS_PROPERTIES, getPropertyValues } from './css-properties';

/**
 * CSS Editor Panel Interface
 */
export interface CSSEditorOptions {
  loadEndpoint?: string;
  saveEndpoint?: string;
  onSave?: (css: string) => void;
  onLoad?: () => Promise<string>;
}

/**
 * CSS Editor Panel class
 */
export class CSSEditorPanel {
  private panel: HTMLElement | null = null;
  private currentSelector: string = '';
  private currentStyles: Map<string, string> = new Map();
  private options: CSSEditorOptions;
  private styleElement: HTMLStyleElement;

  constructor(options: CSSEditorOptions = {}) {
    this.options = options;
    this.styleElement = document.createElement('style');
    this.styleElement.id = 'css-editor-dynamic-styles';
    document.head.appendChild(this.styleElement);
  }

  /**
   * Show the editor panel for a specific element
   */
  public show(selector: string, element: Element): void {
    this.currentSelector = selector;
    this.loadCurrentStyles(element);
    
    if (!this.panel) {
      this.createPanel();
    }
    
    this.updatePanel();
    this.panel!.style.display = 'block';
  }

  /**
   * Hide the editor panel
   */
  public hide(): void {
    if (this.panel) {
      this.panel.style.display = 'none';
    }
  }

  /**
   * Load current styles from the element
   */
  private loadCurrentStyles(element: Element): void {
    this.currentStyles.clear();
    const computed = window.getComputedStyle(element);
    
    // Load all CSS properties
    const allProperties: string[] = [];
    Object.keys(CSS_PROPERTIES).forEach((category) => {
      const props = CSS_PROPERTIES[category as keyof typeof CSS_PROPERTIES];
      allProperties.push(...props);
    });
    
    allProperties.forEach((prop: string) => {
      const value = computed.getPropertyValue(prop);
      if (value) {
        this.currentStyles.set(prop, value);
      }
    });
  }

  /**
   * Create the editor panel UI
   */
  private createPanel(): void {
    this.panel = document.createElement('div');
    this.panel.id = 'css-editor-panel';
    this.panel.innerHTML = `
      <div class="css-editor-header">
        <h3>CSS Editor</h3>
        <button class="css-editor-close" title="Close">&times;</button>
      </div>
      <div class="css-editor-selector">
        <label>Selector:</label>
        <input type="text" class="selector-input" readonly />
      </div>
      <div class="css-editor-tabs">
        ${Object.keys(CSS_PROPERTIES).map(category => 
          `<button class="css-editor-tab" data-category="${category}">${this.capitalize(category)}</button>`
        ).join('')}
      </div>
      <div class="css-editor-content"></div>
      <div class="css-editor-footer">
        <button class="css-editor-save">Save CSS</button>
        ${this.options.loadEndpoint ? '<button class="css-editor-load">Load CSS</button>' : ''}
        <button class="css-editor-export">Export CSS</button>
        <button class="css-editor-clear">Clear Changes</button>
      </div>
      <div class="css-editor-preview">
        <h4>Generated CSS:</h4>
        <pre class="css-output"></pre>
      </div>
    `;

    this.addPanelStyles();
    this.attachEventListeners();
    document.body.appendChild(this.panel);
  }

  /**
   * Add styles for the panel
   */
  private addPanelStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      #css-editor-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: 400px;
        height: 100vh;
        background: #2c3e50;
        color: #ecf0f1;
        box-shadow: -2px 0 10px rgba(0,0,0,0.3);
        z-index: 10000;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: none;
      }
      .css-editor-header {
        padding: 20px;
        background: #34495e;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .css-editor-header h3 {
        margin: 0;
        font-size: 20px;
      }
      .css-editor-close {
        background: none;
        border: none;
        color: #ecf0f1;
        font-size: 28px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        line-height: 1;
      }
      .css-editor-close:hover {
        color: #e74c3c;
      }
      .css-editor-selector {
        padding: 15px 20px;
        background: #34495e;
      }
      .css-editor-selector label {
        display: block;
        margin-bottom: 5px;
        font-size: 12px;
        color: #95a5a6;
      }
      .selector-input {
        width: 100%;
        padding: 8px;
        background: #2c3e50;
        border: 1px solid #7f8c8d;
        color: #ecf0f1;
        border-radius: 4px;
        font-family: 'Monaco', 'Courier New', monospace;
        font-size: 12px;
      }
      .css-editor-tabs {
        display: flex;
        flex-wrap: wrap;
        padding: 10px 20px 0;
        gap: 5px;
        background: #34495e;
        border-bottom: 2px solid #2c3e50;
      }
      .css-editor-tab {
        padding: 8px 12px;
        background: #2c3e50;
        border: none;
        color: #ecf0f1;
        cursor: pointer;
        border-radius: 4px 4px 0 0;
        font-size: 12px;
        transition: background 0.2s;
      }
      .css-editor-tab:hover {
        background: #1abc9c;
      }
      .css-editor-tab.active {
        background: #3498db;
      }
      .css-editor-content {
        padding: 20px;
        min-height: 300px;
      }
      .css-property {
        margin-bottom: 15px;
      }
      .css-property label {
        display: block;
        margin-bottom: 5px;
        font-size: 13px;
        color: #bdc3c7;
      }
      .css-property input,
      .css-property select {
        width: 100%;
        padding: 8px;
        background: #34495e;
        border: 1px solid #7f8c8d;
        color: #ecf0f1;
        border-radius: 4px;
        font-size: 13px;
      }
      .css-property input:focus,
      .css-property select:focus {
        outline: none;
        border-color: #3498db;
      }
      .css-editor-footer {
        padding: 15px 20px;
        background: #34495e;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        border-top: 2px solid #2c3e50;
      }
      .css-editor-footer button {
        padding: 10px 15px;
        background: #3498db;
        border: none;
        color: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        flex: 1;
        min-width: 80px;
        transition: background 0.2s;
      }
      .css-editor-footer button:hover {
        background: #2980b9;
      }
      .css-editor-save {
        background: #27ae60 !important;
      }
      .css-editor-save:hover {
        background: #229954 !important;
      }
      .css-editor-clear {
        background: #e74c3c !important;
      }
      .css-editor-clear:hover {
        background: #c0392b !important;
      }
      .css-editor-preview {
        padding: 20px;
        background: #34495e;
        border-top: 2px solid #2c3e50;
      }
      .css-editor-preview h4 {
        margin: 0 0 10px;
        font-size: 14px;
        color: #95a5a6;
      }
      .css-output {
        background: #2c3e50;
        padding: 15px;
        border-radius: 4px;
        font-family: 'Monaco', 'Courier New', monospace;
        font-size: 12px;
        color: #1abc9c;
        overflow-x: auto;
        margin: 0;
        max-height: 200px;
        overflow-y: auto;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Attach event listeners to panel elements
   */
  private attachEventListeners(): void {
    if (!this.panel) return;

    // Close button
    const closeBtn = this.panel.querySelector('.css-editor-close');
    closeBtn?.addEventListener('click', () => this.hide());

    // Tab buttons
    const tabs = this.panel.querySelectorAll('.css-editor-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const category = tab.getAttribute('data-category');
        if (category) {
          this.showCategory(category);
        }
      });
    });

    // Save button
    const saveBtn = this.panel.querySelector('.css-editor-save');
    saveBtn?.addEventListener('click', () => this.saveCSS());

    // Load button
    const loadBtn = this.panel.querySelector('.css-editor-load');
    loadBtn?.addEventListener('click', () => this.loadCSS());

    // Export button
    const exportBtn = this.panel.querySelector('.css-editor-export');
    exportBtn?.addEventListener('click', () => this.exportCSS());

    // Clear button
    const clearBtn = this.panel.querySelector('.css-editor-clear');
    clearBtn?.addEventListener('click', () => this.clearChanges());
  }

  /**
   * Update panel content
   */
  private updatePanel(): void {
    if (!this.panel) return;

    const selectorInput = this.panel.querySelector('.selector-input') as HTMLInputElement;
    if (selectorInput) {
      selectorInput.value = this.currentSelector;
    }

    // Activate first tab by default
    const firstTab = this.panel.querySelector('.css-editor-tab') as HTMLElement;
    if (firstTab) {
      firstTab.click();
    }

    this.updatePreview();
  }

  /**
   * Show properties for a specific category
   */
  private showCategory(category: string): void {
    const content = this.panel?.querySelector('.css-editor-content');
    if (!content) return;

    const properties = CSS_PROPERTIES[category as keyof typeof CSS_PROPERTIES] || [];
    
    content.innerHTML = properties.map(prop => {
      const currentValue = this.currentStyles.get(prop) || '';
      const suggestions = getPropertyValues(prop);
      
      if (suggestions.length > 0) {
        return `
          <div class="css-property">
            <label>${prop}</label>
            <select data-property="${prop}">
              <option value="">-- Select --</option>
              ${suggestions.map(val => 
                `<option value="${val}" ${currentValue === val ? 'selected' : ''}>${val}</option>`
              ).join('')}
              <option value="custom">Custom value...</option>
            </select>
          </div>
        `;
      } else {
        return `
          <div class="css-property">
            <label>${prop}</label>
            <input type="text" data-property="${prop}" value="${currentValue}" placeholder="Enter value" />
          </div>
        `;
      }
    }).join('');

    // Attach change listeners
    const inputs = content.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement | HTMLSelectElement;
        const property = target.getAttribute('data-property');
        
        if (property) {
          if (target.tagName === 'SELECT' && target.value === 'custom') {
            const customValue = prompt(`Enter custom value for ${property}:`);
            if (customValue) {
              this.updateProperty(property, customValue);
            }
            target.value = '';
          } else {
            this.updateProperty(property, target.value);
          }
        }
      });

      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.tagName === 'INPUT') {
          const property = target.getAttribute('data-property');
          if (property) {
            this.updateProperty(property, target.value);
          }
        }
      });
    });
  }

  /**
   * Update a CSS property
   */
  private updateProperty(property: string, value: string): void {
    if (value) {
      this.currentStyles.set(property, value);
    } else {
      this.currentStyles.delete(property);
    }
    this.applyStyles();
    this.updatePreview();
  }

  /**
   * Apply styles to the page
   */
  private applyStyles(): void {
    const css = this.generateCSS();
    this.styleElement.textContent = css;
  }

  /**
   * Generate CSS from current styles
   */
  private generateCSS(): string {
    if (this.currentStyles.size === 0) {
      return '';
    }

    const properties = Array.from(this.currentStyles.entries())
      .map(([prop, value]) => `  ${prop}: ${value};`)
      .join('\n');

    return `${this.currentSelector} {\n${properties}\n}`;
  }

  /**
   * Update the CSS preview
   */
  private updatePreview(): void {
    const preview = this.panel?.querySelector('.css-output');
    if (preview) {
      const css = this.generateCSS();
      preview.textContent = css || '/* No styles applied yet */';
    }
  }

  /**
   * Save CSS (via endpoint or callback)
   */
  private async saveCSS(): Promise<void> {
    const css = this.generateCSS();
    
    if (this.options.saveEndpoint) {
      try {
        const response = await fetch(this.options.saveEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ css })
        });
        
        if (response.ok) {
          alert('CSS saved successfully!');
        } else {
          alert('Failed to save CSS');
        }
      } catch (error) {
        console.error('Error saving CSS:', error);
        alert('Error saving CSS');
      }
    }
    
    if (this.options.onSave) {
      this.options.onSave(css);
    }
  }

  /**
   * Load CSS (via endpoint or callback)
   */
  private async loadCSS(): Promise<void> {
    let css = '';
    
    if (this.options.loadEndpoint) {
      try {
        const response = await fetch(this.options.loadEndpoint);
        if (response.ok) {
          css = await response.text();
        }
      } catch (error) {
        console.error('Error loading CSS:', error);
      }
    }
    
    if (this.options.onLoad) {
      css = await this.options.onLoad();
    }
    
    if (css) {
      this.styleElement.textContent = css;
      alert('CSS loaded successfully!');
    }
  }

  /**
   * Export CSS to clipboard
   */
  private exportCSS(): void {
    const css = this.generateCSS();
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(css).then(() => {
        alert('CSS copied to clipboard!');
      }).catch((err) => {
        console.error('Failed to copy:', err);
        this.showCSSInModal(css);
      });
    } else {
      this.showCSSInModal(css);
    }
  }

  /**
   * Show CSS in a modal for manual copying (fallback)
   */
  private showCSSInModal(css: string): void {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10001;
      max-width: 600px;
      width: 90%;
    `;
    
    const textarea = document.createElement('textarea');
    textarea.value = css;
    textarea.style.cssText = `
      width: 100%;
      height: 200px;
      margin: 10px 0;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
    `;
    textarea.readOnly = true;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = `
      padding: 10px 20px;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `;
    closeBtn.onclick = () => modal.remove();
    
    const message = document.createElement('p');
    message.textContent = 'Copy the CSS below manually:';
    message.style.margin = '0 0 10px 0';
    
    modal.appendChild(message);
    modal.appendChild(textarea);
    modal.appendChild(closeBtn);
    document.body.appendChild(modal);
    
    textarea.select();
    textarea.focus();
  }

  /**
   * Clear all changes
   */
  private clearChanges(): void {
    if (confirm('Are you sure you want to clear all changes?')) {
      this.currentStyles.clear();
      this.styleElement.textContent = '';
      this.updatePreview();
      
      // Refresh the current tab
      const activeTab = this.panel?.querySelector('.css-editor-tab.active');
      if (activeTab) {
        const category = activeTab.getAttribute('data-category');
        if (category) {
          this.showCategory(category);
        }
      }
    }
  }

  /**
   * Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Destroy the panel
   */
  public destroy(): void {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
    if (this.styleElement) {
      this.styleElement.remove();
    }
  }
}
