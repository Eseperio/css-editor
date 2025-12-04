import { CSS_PROPERTIES, COMMON_PROPERTIES, PROPERTY_GROUPS, PropertyGroup, getPropertyValues, getAdvancedProperties, SPACING_PROPERTIES } from './css-properties';
import { 
  getPropertyInputType, 
  createColorInput, 
  createSizeInput, 
  createPercentageInput, 
  getPropertyInputStyles,
  parseCSSValue 
} from './property-inputs';

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
  private modifiedProperties: Set<string> = new Set(); // Track user-modified properties
  private advancedProperties: Set<string> = new Set(); // Track added advanced properties
  private collapsedGroups: Set<string> = new Set(
    PROPERTY_GROUPS.map(group => group.name)
  ); // Track collapsed property groups, default to collapsed
  private expandedSpacing: Map<string, boolean> = new Map(); // Track expanded spacing properties (margin/padding)
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
    this.modifiedProperties.clear(); // Reset modified properties for new element
    this.advancedProperties.clear(); // Reset advanced properties for new element
    
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
      <div class="css-editor-content">
        <div class="common-properties-section">
          <h4>Common Properties</h4>
          <div class="common-properties"></div>
        </div>
        <div class="advanced-properties-section">
          <h4>Advanced Properties</h4>
          <button class="add-property-btn" title="Add Property">
            <span class="plus-icon">+</span> Add Property
          </button>
          <div class="advanced-properties"></div>
        </div>
      </div>
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
      .css-editor-content {
        padding: 20px;
        min-height: 300px;
      }
      .common-properties-section,
      .advanced-properties-section {
        margin-bottom: 25px;
      }
      .common-properties-section h4,
      .advanced-properties-section h4 {
        margin: 0 0 15px;
        font-size: 14px;
        color: #95a5a6;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .add-property-btn {
        width: 100%;
        padding: 12px;
        background: #27ae60;
        border: none;
        color: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: background 0.2s;
        margin-bottom: 15px;
      }
      .add-property-btn:hover {
        background: #229954;
      }
      .plus-icon {
        font-size: 20px;
        font-weight: bold;
      }
      .css-property {
        margin-bottom: 15px;
        transition: opacity 0.3s;
      }
      .css-property.disabled {
        opacity: 0.5;
      }
      .css-property.active {
        opacity: 1;
      }
      .css-property label {
        display: block;
        margin-bottom: 5px;
        font-size: 13px;
        color: #bdc3c7;
      }
      .css-property input:not(.color-picker):not(.size-slider):not(.size-number-input):not(.color-text-input):not(.percentage-slider):not(.percentage-number-input),
      .css-property select:not(.size-unit-selector) {
        width: 100%;
        padding: 8px;
        background: #34495e;
        border: 1px solid #7f8c8d;
        color: #ecf0f1;
        border-radius: 4px;
        font-size: 13px;
      }
      .css-property.active input:not(.color-picker):not(.size-slider):not(.size-number-input):not(.color-text-input):not(.percentage-slider):not(.percentage-number-input),
      .css-property.active select:not(.size-unit-selector) {
        border-color: #3498db;
        background: #2c3e50;
      }
      .custom-property-input {
        margin-top: 8px;
      }
      .css-property input:focus,
      .css-property select:focus {
        outline: none;
        border-color: #3498db;
      }
      .property-remove-btn {
        margin-top: 5px;
        padding: 5px 10px;
        background: #e74c3c;
        border: none;
        color: white;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
      }
      .property-remove-btn:hover {
        background: #c0392b;
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
      
      /* Property group styles */
      .property-group {
        margin-bottom: 15px;
        background: #34495e;
        border-radius: 6px;
        overflow: hidden;
      }
      .property-group-header {
        display: flex;
        align-items: center;
        padding: 12px 15px;
        cursor: pointer;
        user-select: none;
        transition: background 0.2s;
        gap: 10px;
      }
      .property-group-header:hover {
        background: #3d5568;
      }
      .property-group-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: transparent;
        transition: background 0.2s;
        flex-shrink: 0;
      }
      .property-group-indicator.active {
        background: #3498db;
        box-shadow: 0 0 8px rgba(52, 152, 219, 0.6);
      }
      .property-group-title {
        flex: 1;
        font-size: 13px;
        font-weight: 600;
        color: #ecf0f1;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .property-group-toggle {
        font-size: 16px;
        color: #95a5a6;
        transition: transform 0.2s;
        flex-shrink: 0;
      }
      .property-group-toggle.collapsed {
        transform: rotate(-90deg);
      }
      .property-group-content {
        padding: 15px;
        border-top: 1px solid #2c3e50;
        max-height: 2000px;
        overflow: hidden;
        transition: max-height 0.3s ease, padding 0.3s ease;
      }
      .property-group-content.collapsed {
        max-height: 0;
        padding-top: 0;
        padding-bottom: 0;
        border-top: none;
      }
      
      /* Spacing expand/collapse buttons */
      .spacing-expand-btn {
        background: none;
        border: none;
        color: #95a5a6;
        cursor: pointer;
        font-size: 16px;
        padding: 0 4px;
        margin-left: 6px;
        transition: color 0.2s, transform 0.2s;
        vertical-align: middle;
      }
      .spacing-expand-btn:hover {
        color: #3498db;
        transform: scale(1.2);
      }
      .spacing-collapse-container {
        margin-top: 10px;
        margin-bottom: 10px;
        padding-top: 10px;
        border-top: 1px solid #2c3e50;
      }
      .spacing-collapse-btn {
        width: 100%;
        padding: 8px 12px;
        background: #7f8c8d;
        border: none;
        color: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      .spacing-collapse-btn:hover {
        background: #95a5a6;
      }
      .css-property.spacing-side {
        background: #2c3e50;
        padding: 10px;
        border-radius: 4px;
        margin-bottom: 10px;
      }
      
      /* Property input styles */
      ${getPropertyInputStyles()}
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

    // Add property button
    const addPropertyBtn = this.panel.querySelector('.add-property-btn');
    addPropertyBtn?.addEventListener('click', () => this.showPropertySelector());

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

    // Render common properties
    this.renderCommonProperties();
    
    // Render any advanced properties that were added
    this.renderAdvancedProperties();

    this.updatePreview();
  }

  /**
   * Render common properties section
   */
  private renderCommonProperties(): void {
    const container = this.panel?.querySelector('.common-properties');
    if (!container) return;

    container.innerHTML = PROPERTY_GROUPS.map(group => {
      // Check if any property in this group is modified (including side properties for spacing)
      const hasModifiedProperty = group.properties.some(prop => {
        if (this.modifiedProperties.has(prop)) return true;
        // Check if any side properties are modified
        const spacingProp = SPACING_PROPERTIES.find(sp => sp.general === prop);
        if (spacingProp) {
          return spacingProp.sides.some(side => this.modifiedProperties.has(side));
        }
        return false;
      });
      const isCollapsed = this.collapsedGroups.has(group.name);
      
      // Generate properties HTML for this group
      const propertiesHtml = group.properties.map(prop => {
        // Check if this is a spacing property (margin/padding)
        const spacingProp = SPACING_PROPERTIES.find(sp => sp.general === prop);
        const isExpanded = this.expandedSpacing.get(prop) || false;
        
        if (spacingProp && isExpanded) {
          // Render individual side properties
          return spacingProp.sides.map(sideProp => {
            return this.renderPropertyInput(sideProp, true);
          }).join('') + `
            <div class="spacing-collapse-container">
              <button class="spacing-collapse-btn" data-spacing="${prop}" title="Collapse to general">
                ⚙️ Collapse to ${prop}
              </button>
            </div>
          `;
        } else if (spacingProp) {
          // Render general spacing property with cog icon
          const currentValue = this.currentStyles.get(prop) || '';
          const isModified = this.modifiedProperties.has(prop) || 
            spacingProp.sides.some(side => this.modifiedProperties.has(side));
          const inputType = getPropertyInputType(prop);
          
          return `
            <div class="css-property ${isModified ? 'active' : 'disabled'}" data-property="${prop}">
              <label>
                ${prop}
                <button class="spacing-expand-btn" data-spacing="${prop}" title="Expand to individual sides">
                  ⚙️
                </button>
              </label>
              ${inputType === 'size' ? createSizeInput(prop, currentValue) : `<input type="text" data-property="${prop}" value="${currentValue}" placeholder="Enter value" />`}
            </div>
          `;
        } else {
          // Render normal property
          return this.renderPropertyInput(prop, false);
        }
      }).join('');
      
      return `
        <div class="property-group" data-group="${group.name}">
          <div class="property-group-header" data-group="${group.name}">
            <div class="property-group-indicator ${hasModifiedProperty ? 'active' : ''}"></div>
            <div class="property-group-title">${group.name}</div>
            <div class="property-group-toggle ${isCollapsed ? 'collapsed' : ''}">▼</div>
          </div>
          <div class="property-group-content ${isCollapsed ? 'collapsed' : ''}">
            ${propertiesHtml}
          </div>
        </div>
      `;
    }).join('');

    this.attachPropertyListeners(container);
    this.attachGroupToggleListeners();
    this.attachSpacingToggleListeners();
  }

  /**
   * Render a single property input
   */
  private renderPropertyInput(prop: string, isSpacingSide: boolean): string {
    const currentValue = this.currentStyles.get(prop) || '';
    const isModified = this.modifiedProperties.has(prop);
    const suggestions = getPropertyValues(prop);
    const inputType = getPropertyInputType(prop);
    const trimmedValue = currentValue.trim();
    const hasSuggestion = suggestions.includes(trimmedValue);
    const isCustomValue = !!trimmedValue && !hasSuggestion;
    
    // If property has predefined suggestions (like display, position), use dropdown
    if (suggestions.length > 0) {
      return `
        <div class="css-property ${isModified ? 'active' : 'disabled'} ${isSpacingSide ? 'spacing-side' : ''}" data-property="${prop}">
          <label>${prop}</label>
          <select data-property="${prop}">
            <option value="">-- Select --</option>
            ${suggestions.map(val => 
              `<option value="${val}" ${trimmedValue === val ? 'selected' : ''}>${val}</option>`
            ).join('')}
            <option value="custom" ${isCustomValue ? 'selected' : ''}>Custom value...</option>
          </select>
          <input type="text" class="custom-property-input" data-property="${prop}" placeholder="Enter custom value" value="${isCustomValue ? trimmedValue : ''}" ${isCustomValue ? '' : 'style="display:none;"'} />
        </div>
      `;
    } else if (inputType === 'color') {
      return `
        <div class="css-property ${isModified ? 'active' : 'disabled'} ${isSpacingSide ? 'spacing-side' : ''}" data-property="${prop}">
          <label>${prop}</label>
          ${createColorInput(prop, currentValue)}
        </div>
      `;
    } else if (inputType === 'size') {
      return `
        <div class="css-property ${isModified ? 'active' : 'disabled'} ${isSpacingSide ? 'spacing-side' : ''}" data-property="${prop}">
          <label>${prop}</label>
          ${createSizeInput(prop, currentValue)}
        </div>
      `;
    } else if (inputType === 'number') {
      return `
        <div class="css-property ${isModified ? 'active' : 'disabled'} ${isSpacingSide ? 'spacing-side' : ''}" data-property="${prop}">
          <label>${prop}</label>
          ${createPercentageInput(prop, currentValue)}
        </div>
      `;
    } else {
      return `
        <div class="css-property ${isModified ? 'active' : 'disabled'} ${isSpacingSide ? 'spacing-side' : ''}" data-property="${prop}">
          <label>${prop}</label>
          <input type="text" data-property="${prop}" value="${currentValue}" placeholder="Enter value" />
        </div>
      `;
    }
  }

  /**
   * Attach event listeners for spacing toggle buttons
   */
  private attachSpacingToggleListeners(): void {
    const expandButtons = this.panel?.querySelectorAll('.spacing-expand-btn');
    expandButtons?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const spacingProp = (e.target as HTMLElement).getAttribute('data-spacing');
        if (spacingProp) {
          this.expandSpacingProperty(spacingProp);
        }
      });
    });

    const collapseButtons = this.panel?.querySelectorAll('.spacing-collapse-btn');
    collapseButtons?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const spacingProp = (e.target as HTMLElement).getAttribute('data-spacing');
        if (spacingProp) {
          this.collapseSpacingProperty(spacingProp);
        }
      });
    });
  }

  /**
   * Expand a spacing property to show individual sides
   */
  private expandSpacingProperty(property: string): void {
    const spacingProp = SPACING_PROPERTIES.find(sp => sp.general === property);
    if (!spacingProp) return;

    // Get the current value of the general property
    const generalValue = this.currentStyles.get(property);
    
    // Apply the general value to all sides if it exists
    if (generalValue && generalValue.trim() !== '') {
      spacingProp.sides.forEach(side => {
        this.currentStyles.set(side, generalValue);
        this.modifiedProperties.add(side);
      });
    }
    
    // Remove the general property from modified properties
    this.modifiedProperties.delete(property);
    this.currentStyles.delete(property);
    
    // Mark as expanded
    this.expandedSpacing.set(property, true);
    
    // Re-render and apply
    this.renderCommonProperties();
    this.applyStyles();
    this.updatePreview();
  }

  /**
   * Collapse individual spacing properties back to general
   */
  private collapseSpacingProperty(property: string): void {
    const spacingProp = SPACING_PROPERTIES.find(sp => sp.general === property);
    if (!spacingProp) return;

    // Clear the side properties
    spacingProp.sides.forEach(side => {
      this.modifiedProperties.delete(side);
      this.currentStyles.delete(side);
    });
    
    // Mark as collapsed
    this.expandedSpacing.set(property, false);
    
    // Re-render and apply
    this.renderCommonProperties();
    this.applyStyles();
    this.updatePreview();
  }

  /**
   * Attach event listeners for group toggle
   */
  private attachGroupToggleListeners(): void {
    const headers = this.panel?.querySelectorAll('.property-group-header');
    headers?.forEach(header => {
      header.addEventListener('click', () => {
        const groupName = header.getAttribute('data-group');
        if (!groupName) return;
        
        const group = this.panel?.querySelector(`.property-group[data-group="${groupName}"]`);
        const content = group?.querySelector('.property-group-content');
        const toggle = header.querySelector('.property-group-toggle');
        
        if (this.collapsedGroups.has(groupName)) {
          this.collapsedGroups.delete(groupName);
          content?.classList.remove('collapsed');
          toggle?.classList.remove('collapsed');
        } else {
          this.collapsedGroups.add(groupName);
          content?.classList.add('collapsed');
          toggle?.classList.add('collapsed');
        }
      });
    });
  }

  /**
   * Render advanced properties section
   */
  private renderAdvancedProperties(): void {
    const container = this.panel?.querySelector('.advanced-properties');
    if (!container) return;

    if (this.advancedProperties.size === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = Array.from(this.advancedProperties).map(prop => {
      const currentValue = this.currentStyles.get(prop) || '';
      const suggestions = getPropertyValues(prop);
      const inputType = getPropertyInputType(prop);
      const trimmedValue = currentValue.trim();
      const hasSuggestion = suggestions.includes(trimmedValue);
      const isCustomValue = !!trimmedValue && !hasSuggestion;
      
      // If property has predefined suggestions, use dropdown
      if (suggestions.length > 0) {
        return `
          <div class="css-property active" data-property="${prop}">
            <label>${prop}</label>
            <select data-property="${prop}">
              <option value="">-- Select --</option>
              ${suggestions.map(val => 
                `<option value="${val}" ${trimmedValue === val ? 'selected' : ''}>${val}</option>`
              ).join('')}
              <option value="custom" ${isCustomValue ? 'selected' : ''}>Custom value...</option>
            </select>
            <input type="text" class="custom-property-input" data-property="${prop}" placeholder="Enter custom value" value="${isCustomValue ? trimmedValue : ''}" ${isCustomValue ? '' : 'style="display:none;"'} />
            <button class="property-remove-btn" data-remove="${prop}">Remove</button>
          </div>
        `;
      } else if (inputType === 'color') {
        return `
          <div class="css-property active" data-property="${prop}">
            <label>${prop}</label>
            ${createColorInput(prop, currentValue)}
            <button class="property-remove-btn" data-remove="${prop}">Remove</button>
          </div>
        `;
      } else if (inputType === 'size') {
        return `
          <div class="css-property active" data-property="${prop}">
            <label>${prop}</label>
            ${createSizeInput(prop, currentValue)}
            <button class="property-remove-btn" data-remove="${prop}">Remove</button>
          </div>
        `;
      } else if (inputType === 'number') {
        return `
          <div class="css-property active" data-property="${prop}">
            <label>${prop}</label>
            ${createPercentageInput(prop, currentValue)}
            <button class="property-remove-btn" data-remove="${prop}">Remove</button>
          </div>
        `;
      } else {
        return `
          <div class="css-property active" data-property="${prop}">
            <label>${prop}</label>
            <input type="text" data-property="${prop}" value="${currentValue}" placeholder="Enter value" />
            <button class="property-remove-btn" data-remove="${prop}">Remove</button>
          </div>
        `;
      }
    }).join('');

    this.attachPropertyListeners(container);
    
    // Attach remove button listeners
    const removeButtons = container.querySelectorAll('.property-remove-btn');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const property = (e.target as HTMLElement).getAttribute('data-remove');
        if (property) {
          this.removeAdvancedProperty(property);
        }
      });
    });
  }

  /**
   * Attach change listeners to property inputs
   */
  private attachPropertyListeners(container: Element): void {
    const inputs = container.querySelectorAll('input, select');
    inputs.forEach(input => {
      const target = input as HTMLInputElement | HTMLSelectElement;
      const property = target.getAttribute('data-property');
      
      if (!property) return;
      
      // Handle regular select dropdowns
      if (target.tagName === 'SELECT' && target.classList.contains('size-unit-selector')) {
        // Handle unit selector - combine with number input
        target.addEventListener('change', () => {
          this.handleSizeInputChange(property);
        });
      } else if (target.tagName === 'SELECT') {
        // Handle regular property dropdowns
        target.addEventListener('change', () => {
          const customInput = container.querySelector(`.custom-property-input[data-property="${property}"]`) as HTMLInputElement;
          if (target.value === 'custom') {
            if (customInput) {
              customInput.style.display = 'block';
              customInput.focus();
            }
            return;
          } else {
            if (customInput) {
              customInput.style.display = 'none';
              customInput.value = '';
            }
            this.updateProperty(property, target.value);
          }
        });
      } else if (target.classList.contains('custom-property-input')) {
        target.addEventListener('input', () => {
          this.updateProperty(property, target.value);
        });
      } else if (target.classList.contains('color-picker')) {
        // Handle color picker
        target.addEventListener('input', () => {
          this.updateProperty(property, target.value);
          // Also update the text input
          const textInput = container.querySelector(`.color-text-input[data-property="${property}"]`) as HTMLInputElement;
          if (textInput) {
            textInput.value = target.value;
          }
        });
      } else if (target.classList.contains('color-text-input')) {
        // Handle color text input
        target.addEventListener('input', () => {
          this.updateProperty(property, target.value);
        });
      } else if (target.classList.contains('size-slider')) {
        // Handle size slider
        target.addEventListener('input', () => {
          const numberInput = container.querySelector(`.size-number-input[data-property="${property}"]`) as HTMLInputElement;
          if (numberInput) {
            numberInput.value = target.value;
          }
          this.handleSizeInputChange(property);
        });
      } else if (target.classList.contains('size-number-input')) {
        // Handle size number input
        target.addEventListener('input', () => {
          const slider = container.querySelector(`.size-slider[data-property="${property}"]`) as HTMLInputElement;
          if (slider) {
            slider.value = target.value;
          }
          this.handleSizeInputChange(property);
        });
      } else if (target.classList.contains('percentage-slider')) {
        // Handle percentage slider
        target.addEventListener('input', () => {
          const numberInput = container.querySelector(`.percentage-number-input[data-property="${property}"]`) as HTMLInputElement;
          if (numberInput) {
            numberInput.value = target.value;
          }
          this.updateProperty(property, target.value);
        });
      } else if (target.classList.contains('percentage-number-input')) {
        // Handle percentage number input
        target.addEventListener('input', () => {
          const slider = container.querySelector(`.percentage-slider[data-property="${property}"]`) as HTMLInputElement;
          if (slider) {
            slider.value = target.value;
          }
          this.updateProperty(property, target.value);
        });
      } else if (target.tagName === 'INPUT') {
        // Handle regular text inputs
        target.addEventListener('input', () => {
          this.updateProperty(property, target.value);
        });
      }
    });
  }

  /**
   * Handle size input changes (combines number and unit)
   */
  private handleSizeInputChange(property: string): void {
    const container = this.panel?.querySelector('.common-properties, .advanced-properties');
    if (!container) return;
    
    const numberInput = container.querySelector(`.size-number-input[data-property="${property}"]`) as HTMLInputElement;
    const unitSelect = container.querySelector(`.size-unit-selector[data-property="${property}"]`) as HTMLSelectElement;
    
    if (numberInput && unitSelect) {
      // If unit is 'auto', just use 'auto' without the number
      const value = unitSelect.value === 'auto' ? 'auto' : `${numberInput.value}${unitSelect.value}`;
      this.updateProperty(property, value);
    }
  }

  /**
   * Show property selector modal
   */
  private showPropertySelector(): void {
    const availableProperties = getAdvancedProperties().filter(
      prop => !this.advancedProperties.has(prop)
    );

    if (availableProperties.length === 0) {
      alert('All advanced properties have been added!');
      return;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'property-selector-modal';
    modal.innerHTML = `
      <div class="property-selector-content">
        <h3>Select Property to Add</h3>
        <input type="text" class="property-search" placeholder="Search properties..." />
        <div class="property-list">
          ${availableProperties.map(prop => 
            `<button class="property-option" data-property="${prop}">${prop}</button>`
          ).join('')}
        </div>
        <button class="modal-close">Cancel</button>
      </div>
    `;

    // Add modal styles (reuse existing or create once)
    let style = document.getElementById('property-selector-modal-styles') as HTMLStyleElement;
    if (!style) {
      style = document.createElement('style');
      style.id = 'property-selector-modal-styles';
      style.textContent = `
      .property-selector-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
      }
      .property-selector-content {
        background: #2c3e50;
        padding: 30px;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
      }
      .property-selector-content h3 {
        margin: 0 0 20px;
        color: #ecf0f1;
      }
      .property-search {
        width: 100%;
        padding: 10px;
        margin-bottom: 15px;
        background: #34495e;
        border: 1px solid #7f8c8d;
        color: #ecf0f1;
        border-radius: 4px;
        font-size: 14px;
      }
      .property-list {
        flex: 1;
        overflow-y: auto;
        margin-bottom: 15px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 10px;
      }
      .property-option {
        padding: 10px;
        background: #34495e;
        border: 1px solid #7f8c8d;
        color: #ecf0f1;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }
      .property-option:hover {
        background: #3498db;
        border-color: #3498db;
      }
      .property-option.hidden {
        display: none;
      }
      .modal-close {
        padding: 10px 20px;
        background: #e74c3c;
        border: none;
        color: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      .modal-close:hover {
        background: #c0392b;
      }
    `;
      document.head.appendChild(style);
    }

    document.body.appendChild(modal);

    // Search functionality
    const searchInput = modal.querySelector('.property-search') as HTMLInputElement;
    const propertyOptions = modal.querySelectorAll('.property-option');
    
    searchInput?.addEventListener('input', () => {
      const searchTerm = searchInput.value.toLowerCase();
      propertyOptions.forEach(option => {
        const propertyName = option.textContent?.toLowerCase() || '';
        if (propertyName.includes(searchTerm)) {
          option.classList.remove('hidden');
        } else {
          option.classList.add('hidden');
        }
      });
    });

    // Property selection
    propertyOptions.forEach(option => {
      option.addEventListener('click', () => {
        const property = option.getAttribute('data-property');
        if (property) {
          this.addAdvancedProperty(property);
          modal.remove();
        }
      });
    });

    // Close button
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn?.addEventListener('click', () => modal.remove());

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Add an advanced property
   */
  private addAdvancedProperty(property: string): void {
    this.advancedProperties.add(property);
    this.modifiedProperties.add(property);
    this.renderAdvancedProperties();
    this.updatePreview();
  }

  /**
   * Remove an advanced property
   */
  private removeAdvancedProperty(property: string): void {
    this.advancedProperties.delete(property);
    this.modifiedProperties.delete(property);
    this.currentStyles.delete(property);
    this.renderAdvancedProperties();
    this.applyStyles();
    this.updatePreview();
  }

  /**
   * Update a CSS property
   */
  private updateProperty(property: string, value: string): void {
    if (value && value.trim() !== '') {
      this.currentStyles.set(property, value);
      this.modifiedProperties.add(property);
      
      // Update the visual state of the property
      const propertyElement = this.panel?.querySelector(`.css-property[data-property="${property}"]`);
      if (propertyElement) {
        propertyElement.classList.remove('disabled');
        propertyElement.classList.add('active');
      }
      
      // Update group indicator if this is a common property
      this.updateGroupIndicator(property);
    } else {
      this.currentStyles.delete(property);
      this.modifiedProperties.delete(property);
      
      // Update the visual state of the property (only for common properties)
      if (COMMON_PROPERTIES.includes(property)) {
        const propertyElement = this.panel?.querySelector(`.css-property[data-property="${property}"]`);
        if (propertyElement) {
          propertyElement.classList.remove('active');
          propertyElement.classList.add('disabled');
        }
      }
      
      // Update group indicator if this is a common property
      this.updateGroupIndicator(property);
    }
    this.applyStyles();
    this.updatePreview();
  }

  /**
   * Update group indicator for a property
   */
  private updateGroupIndicator(property: string): void {
    // Find which group this property belongs to
    const group = PROPERTY_GROUPS.find(g => g.properties.includes(property));
    if (!group) return;
    
    // Check if any property in this group is modified
    const hasModifiedProperty = group.properties.some(prop => this.modifiedProperties.has(prop));
    
    // Update the indicator
    const indicator = this.panel?.querySelector(`.property-group[data-group="${group.name}"] .property-group-indicator`);
    if (indicator) {
      if (hasModifiedProperty) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    }
  }

  /**
   * Apply styles to the page
   */
  private applyStyles(): void {
    const css = this.generateCSS();
    this.styleElement.textContent = css;
  }

  /**
   * Generate CSS from current styles (only modified properties)
   */
  private generateCSS(): string {
    if (this.modifiedProperties.size === 0) {
      return '';
    }

    const properties = Array.from(this.modifiedProperties)
      .map(prop => {
        const value = this.currentStyles.get(prop);
        return value ? `  ${prop}: ${value};` : null;
      })
      .filter(line => line !== null)
      .join('\n');

    return properties ? `${this.currentSelector} {\n${properties}\n}` : '';
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
      this.modifiedProperties.clear();
      this.advancedProperties.clear();
      this.styleElement.textContent = '';
      
      // Re-render the properties
      this.renderCommonProperties();
      this.renderAdvancedProperties();
      this.updatePreview();
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
