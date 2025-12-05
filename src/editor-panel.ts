import { CSS_PROPERTIES, COMMON_PROPERTIES, PROPERTY_GROUPS, PropertyGroup, getPropertyValues, getAdvancedProperties, SPACING_PROPERTIES } from './css-properties';
import { 
  getPropertyInputType, 
  createColorInput, 
  createSizeInput, 
  createPercentageInput, 
  createFilterInput,
  parseCSSValue,
  mapSizeSliderToValue,
  mapValueToSizeSlider,
  getFilterOption,
  formatFilterValue
} from './property-inputs';
import { setLocale, t, translateProperty, translatePropertyGroup, Locale, getLocale, getAvailableLocales, getLocaleName } from './i18n';
import './styles/editor-panel.scss';

/**
 * CSS Editor Panel Interface
 */
export interface CSSEditorOptions {
  loadEndpoint?: string;
  saveEndpoint?: string;
  onSave?: (css: string) => void;
  onLoad?: () => Promise<string>;
  onChange?: (css: string) => void;
  stylesUrl?: string;
  fontFamilies?: string[];
  locale?: Locale;
  activatorSelector?: string; // Task 1: Allow custom activator element selector
}

/**
 * Interface for selector part
 */
interface SelectorPart {
  selector: string;
  combinator: '>' | ' '; // > for children, space for descendants
  positionType: 'all' | 'even' | 'odd' | 'position';
  positionValue?: number; // Only used when positionType is 'position'
  siblingCount?: number; // Total number of siblings of this type
}

/**
 * CSS Editor Panel class
 */
export class CSSEditorPanel {
  private panel: HTMLElement | null = null;
  private currentSelector: string = '';
  private currentElement: Element | null = null; // Store current element for selector refinement
  private currentStyles: Map<string, string> = new Map();
  private modifiedProperties: Set<string> = new Set(); // Track user-modified properties
  private advancedProperties: Set<string> = new Set(); // Track added advanced properties
  private collapsedGroups: Set<string> = new Set(
    PROPERTY_GROUPS.map(group => group.name)
  ); // Track collapsed property groups, default to collapsed
  private expandedSpacing: Map<string, boolean> = new Map(); // Track expanded spacing properties (margin/padding)
  private anchorPosition: 'right' | 'left' | 'top' | 'bottom' = 'right';
  private options: CSSEditorOptions;
  private styleElement: HTMLStyleElement;
  private theme: 'light' | 'dark' = 'light'; // Theme state
  // Task 3: Store all element changes across different elements
  private allElementChanges: Map<string, { styles: Map<string, string>, modifiedProperties: Set<string> }> = new Map();
  // Task 4: Selector configuration
  private selectorParts: SelectorPart[] = [];
  private selectorConfigExpanded: boolean = false;

  constructor(options: CSSEditorOptions = {}) {
    this.options = options;
    // Set locale if provided
    if (options.locale) {
      setLocale(options.locale);
    }
    this.styleElement = document.createElement('style');
    this.styleElement.id = 'css-editor-dynamic-styles';
    document.head.appendChild(this.styleElement);
    
    // Load saved theme preference
    const savedTheme = localStorage.getItem('css-editor-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      this.theme = savedTheme;
    }
  }

  /**
   * Show the editor panel for a specific element
   */
  public show(selector: string, element: Element): void {
    // Task 3: Save current element changes before switching to a new element
    this.saveCurrentElementChanges();
    
    this.currentSelector = selector;
    this.currentElement = element; // Task 4: Store element for selector refinement
    this.loadCurrentStyles(element);
    
    // Task 4: Parse selector into parts
    this.parseSelectorIntoParts(selector, element);
    
    // Task 3: Load previous changes for this element if they exist
    this.loadPreviousElementChanges(selector);
    
    this.advancedProperties.clear(); // Reset advanced properties for new element
    
    if (!this.panel) {
      this.createPanel();
    }
    
    this.updatePanel();
    this.panel!.style.display = 'block';
    this.applyAnchorPosition();
  }

  /**
   * Load previous element changes from storage
   * Task 3: Helper method for better readability
   */
  private loadPreviousElementChanges(selector: string): void {
    const previousChanges = this.allElementChanges.get(selector);
    if (previousChanges) {
      this.modifiedProperties = new Set(previousChanges.modifiedProperties);
      // Override computed styles with previous modified styles (after loadCurrentStyles)
      previousChanges.modifiedProperties.forEach(prop => {
        const value = previousChanges.styles.get(prop);
        if (value) {
          this.currentStyles.set(prop, value);
        }
      });
    } else {
      this.modifiedProperties.clear(); // Reset modified properties for new element
    }
  }

  /**
   * Save current element changes to storage
   * Task 3: Helper method to avoid code duplication
   */
  private saveCurrentElementChanges(): void {
    if (this.currentSelector && this.modifiedProperties.size > 0) {
      this.allElementChanges.set(this.currentSelector, {
        styles: new Map(this.currentStyles),
        modifiedProperties: new Set(this.modifiedProperties)
      });
    }
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
    this.panel.classList.add(`anchor-${this.anchorPosition}`);
    
    // Build locale selector options
    const availableLocales = getAvailableLocales();
    const currentLocale = getLocale();
    const localeOptions = availableLocales.map(locale => 
      `<option value="${locale}" ${locale === currentLocale ? 'selected' : ''}>${getLocaleName(locale)}</option>`
    ).join('');
    
    this.panel.innerHTML = `
      <div class="css-editor-header">
        <div class="header-actions">
          <button class="theme-toggle" title="Toggle theme">
            <span class="theme-icon">${this.theme === 'dark' ? '☀️' : '🌙'}</span>
          </button>
          <select class="locale-select" title="${t('ui.panel.language')}">
            ${localeOptions}
          </select>
          <select class="anchor-select" title="${t('ui.panel.anchorPosition')}">
            <option value="right">${t('ui.panel.anchorRight')}</option>
            <option value="bottom">${t('ui.panel.anchorBottom')}</option>
            <option value="left">${t('ui.panel.anchorLeft')}</option>
            <option value="top">${t('ui.panel.anchorTop')}</option>
          </select>
          <button class="css-editor-close" title="${t('ui.panel.close')}">&times;</button>
        </div>
      </div>
      <div class="css-editor-content">
        <div class="properties-grid">
          <div class="css-editor-selector">
            <div class="selector-header">
              <label>${t('ui.panel.selector')}:</label>
              <button class="selector-config-toggle" title="Configure selector">⚙️</button>
            </div>
            <input type="text" class="selector-input" readonly />
            <div class="selector-count" aria-live="polite"></div>
            <div class="selector-config-panel" style="display: none;"></div>
          </div>
          <div class="common-properties-section">
            <div class="common-properties"></div>
          </div>
          <div class="advanced-properties-section">
            <button class="add-property-btn" title="${t('ui.panel.addProperty')}">
              <span class="plus-icon">+</span> ${t('ui.panel.addProperty')}
            </button>
            <div class="advanced-properties"></div>
          </div>
        </div>
      </div>
      <div class="css-editor-footer">
        <button class="css-editor-save">${t('ui.panel.saveCSS')}</button>
        ${this.options.loadEndpoint ? `<button class="css-editor-load">${t('ui.panel.loadCSS')}</button>` : ''}
        <button class="css-editor-export">${t('ui.panel.exportCSS')}</button>
        <button class="css-editor-clear">${t('ui.panel.clearChanges')}</button>
      </div>
      <div class="css-editor-preview">
        <h4>${t('ui.panel.generatedCSS')}</h4>
        <pre class="css-output"></pre>
      </div>
    `;

    this.addPanelStyles();
    this.applyTheme(); // Apply theme on creation
    this.attachEventListeners();
    document.body.appendChild(this.panel);
  }

  /**
   * Add styles for the panel
   */
  private addPanelStyles(): void {
    const existing = document.getElementById('css-editor-panel-stylesheet');
    if (existing) return;

    const link = document.createElement('link');
    link.id = 'css-editor-panel-stylesheet';
    link.rel = 'stylesheet';
    link.href = this.resolveStylesheetUrl();
    document.head.appendChild(link);
  }

  /**
   * Try to resolve the stylesheet URL for the panel.
   * Priority: explicit option -> sibling of script -> fallback relative path.
   */
  private resolveStylesheetUrl(): string {
    if (this.options.stylesUrl) {
      return this.options.stylesUrl;
    }

    const currentScript = document.currentScript as HTMLScriptElement | null;
    if (currentScript?.src) {
      return new URL('./css-editor.css', currentScript.src).href;
    }

    const scriptWithName = document.querySelector('script[src*="css-editor"]') as HTMLScriptElement | null;
    if (scriptWithName?.src) {
      return new URL('./css-editor.css', scriptWithName.src).href;
    }

    return 'css-editor.css';
  }

  /**
   * Attach event listeners to panel elements
   */
  private attachEventListeners(): void {
    if (!this.panel) return;

    // Close button
    const closeBtn = this.panel.querySelector('.css-editor-close');
    closeBtn?.addEventListener('click', () => this.hide());

    // Theme toggle button
    const themeToggleBtn = this.panel.querySelector('.theme-toggle');
    themeToggleBtn?.addEventListener('click', () => this.toggleTheme());

    // Locale selector
    const localeSelect = this.panel.querySelector('.locale-select') as HTMLSelectElement | null;
    if (localeSelect) {
      localeSelect.addEventListener('change', () => {
        const newLocale = localeSelect.value as Locale;
        this.changeLocale(newLocale);
      });
    }

    // Anchor selector
    const anchorSelect = this.panel.querySelector('.anchor-select') as HTMLSelectElement | null;
    if (anchorSelect) {
      anchorSelect.value = this.anchorPosition;
      anchorSelect.addEventListener('change', () => {
        const value = anchorSelect.value as 'right' | 'left' | 'top' | 'bottom';
        this.setAnchorPosition(value);
      });
    }

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

    // Task 4: Selector config toggle button
    const selectorConfigToggle = this.panel.querySelector('.selector-config-toggle');
    selectorConfigToggle?.addEventListener('click', () => this.toggleSelectorConfig());
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
    const selectorCount = this.panel.querySelector('.selector-count') as HTMLElement | null;
    if (selectorCount) {
      let count = 0;
      try {
        count = this.currentSelector ? document.querySelectorAll(this.currentSelector).length : 0;
      } catch {
        count = 0;
      }
      if (count > 1) {
        selectorCount.textContent = t('ui.panel.selectorMatchCount', { count: count.toString() });
        selectorCount.style.display = 'block';
      } else if (count === 1) {
        selectorCount.textContent = '';
        selectorCount.style.display = 'none';
      } else {
        selectorCount.textContent = this.currentSelector ? t('ui.panel.selectorInvalid') : '';
        selectorCount.style.display = this.currentSelector ? 'block' : 'none';
      }
    }

    // Render common properties
    this.renderCommonProperties();
    
    // Render any advanced properties that were added
    this.renderAdvancedProperties();

    this.updatePreview();
  }

  /**
   * Set anchor position explicitly
   */
  private setAnchorPosition(position: 'right' | 'left' | 'top' | 'bottom'): void {
    this.anchorPosition = position;
    this.applyAnchorPosition();
  }

  /**
   * Apply anchor position class to panel
   */
  private applyAnchorPosition(): void {
    if (!this.panel) return;
    const positions: Array<'right' | 'bottom' | 'left' | 'top'> = ['right', 'bottom', 'left', 'top'];
    positions.forEach(pos => this.panel!.classList.remove(`anchor-${pos}`));
    this.panel.classList.add(`anchor-${this.anchorPosition}`);
    const anchorSelect = this.panel.querySelector('.anchor-select') as HTMLSelectElement | null;
    if (anchorSelect) {
      anchorSelect.value = this.anchorPosition;
    }
  }

  /**
   * Change the locale and refresh the panel
   */
  private changeLocale(locale: Locale): void {
    if (!this.panel) return;
    
    setLocale(locale);
    
    // Remove and recreate the panel
    this.panel.remove();
    this.panel = null;
    
    // Recreate with new translations
    this.createPanel();
    
    // Restore the panel state - createPanel() guarantees this.panel is not null
    this.updatePanel();
    this.applyAnchorPosition();
    
    // Ensure the recreated panel is visible
    this.panel!.style.display = 'block';
  }

  /**
   * Toggle between light and dark theme
   */
  private toggleTheme(): void {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('css-editor-theme', this.theme);
    this.applyTheme();
    
    // Update theme toggle icon
    const themeIcon = this.panel?.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = this.theme === 'dark' ? '☀️' : '🌙';
    }
  }

  /**
   * Apply the current theme to the panel
   */
  private applyTheme(): void {
    if (!this.panel) return;
    
    if (this.theme === 'dark') {
      this.panel.classList.add('theme-dark');
    } else {
      this.panel.classList.remove('theme-dark');
    }
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
              <button class="spacing-collapse-btn" data-spacing="${prop}" title="${t('ui.spacing.collapseToGeneral', { property: translateProperty(prop) })}">
                ⚙️ ${t('ui.spacing.collapseToGeneral', { property: translateProperty(prop) })}
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
                ${translateProperty(prop)}
                <button class="spacing-expand-btn" data-spacing="${prop}" title="${t('ui.spacing.expandToSides')}">
                  ⚙️
                </button>
              </label>
              ${inputType === 'size' ? createSizeInput(prop, currentValue) : `<input type="text" data-property="${prop}" value="${currentValue}" placeholder="${t('ui.inputs.enterValue')}" />`}
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
            <div class="property-group-title">${translatePropertyGroup(group.name)}</div>
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
   * Suggestions for dropdowns, allowing custom font list
   */
  private getPropertySuggestions(prop: string): string[] {
    const base = getPropertyValues(prop);
    if (prop === 'font-family' && this.options.fontFamilies && this.options.fontFamilies.length > 0) {
      return Array.from(new Set([...base, ...this.options.fontFamilies]));
    }
    return base;
  }

  /**
   * Render a single property input
   */
  private renderPropertyInput(prop: string, isSpacingSide: boolean): string {
    const currentValue = this.currentStyles.get(prop) || '';
    const isModified = this.modifiedProperties.has(prop);
    const suggestions = this.getPropertySuggestions(prop);
    const inputType = getPropertyInputType(prop);
    const trimmedValue = currentValue.trim();
    const hasSuggestion = suggestions.includes(trimmedValue);
    const isCustomValue = !!trimmedValue && !hasSuggestion;
    const translatedProp = translateProperty(prop);
    
    // If property has predefined suggestions (like display, position), use dropdown
    if (suggestions.length > 0) {
      return `
        <div class="css-property ${isModified ? 'active' : 'disabled'} ${isSpacingSide ? 'spacing-side' : ''}" data-property="${prop}">
          <label>${translatedProp}</label>
          <select data-property="${prop}">
            <option value="">${t('ui.inputs.selectOption')}</option>
            ${suggestions.map(val => 
              `<option value="${val}" ${trimmedValue === val ? 'selected' : ''}>${val}</option>`
            ).join('')}
            <option value="custom" ${isCustomValue ? 'selected' : ''}>${t('ui.inputs.customValue')}</option>
          </select>
          <input type="text" class="custom-property-input" data-property="${prop}" placeholder="${t('ui.inputs.enterCustomValue')}" value="${isCustomValue ? trimmedValue : ''}" ${isCustomValue ? '' : 'style="display:none;"'} />
        </div>
      `;
    } else if (inputType === 'color') {
      return `
        <div class="css-property ${isModified ? 'active' : 'disabled'} ${isSpacingSide ? 'spacing-side' : ''}" data-property="${prop}">
          <label>${translatedProp}</label>
          ${createColorInput(prop, currentValue)}
        </div>
      `;
    } else if (inputType === 'size') {
      return `
        <div class="css-property ${isModified ? 'active' : 'disabled'} ${isSpacingSide ? 'spacing-side' : ''}" data-property="${prop}">
          <label>${translatedProp}</label>
          ${createSizeInput(prop, currentValue)}
        </div>
      `;
    } else if (inputType === 'filter') {
      return `
        <div class="css-property ${isModified ? 'active' : 'disabled'} ${isSpacingSide ? 'spacing-side' : ''}" data-property="${prop}">
          <label>${translatedProp}</label>
          ${createFilterInput(prop, currentValue)}
        </div>
      `;
    } else if (inputType === 'number') {
      return `
        <div class="css-property ${isModified ? 'active' : 'disabled'} ${isSpacingSide ? 'spacing-side' : ''}" data-property="${prop}">
          <label>${translatedProp}</label>
          ${createPercentageInput(prop, currentValue)}
        </div>
      `;
    } else {
      return `
        <div class="css-property ${isModified ? 'active' : 'disabled'} ${isSpacingSide ? 'spacing-side' : ''}" data-property="${prop}">
          <label>${translatedProp}</label>
          <input type="text" data-property="${prop}" value="${currentValue}" placeholder="${t('ui.inputs.enterValue')}" />
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
        const spacingProp = (e.currentTarget as HTMLElement).getAttribute('data-spacing');
        if (spacingProp) {
          this.expandSpacingProperty(spacingProp);
        }
      });
    });

    const collapseButtons = this.panel?.querySelectorAll('.spacing-collapse-btn');
    collapseButtons?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const spacingProp = (e.currentTarget as HTMLElement).getAttribute('data-spacing');
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
      const translatedProp = translateProperty(prop);
      
      // If property has predefined suggestions, use dropdown
      if (suggestions.length > 0) {
        return `
          <div class="css-property active" data-property="${prop}">
            <label>${translatedProp}</label>
            <select data-property="${prop}">
              <option value="">${t('ui.inputs.selectOption')}</option>
              ${suggestions.map(val => 
                `<option value="${val}" ${trimmedValue === val ? 'selected' : ''}>${val}</option>`
              ).join('')}
              <option value="custom" ${isCustomValue ? 'selected' : ''}>${t('ui.inputs.customValue')}</option>
            </select>
            <input type="text" class="custom-property-input" data-property="${prop}" placeholder="${t('ui.inputs.enterCustomValue')}" value="${isCustomValue ? trimmedValue : ''}" ${isCustomValue ? '' : 'style="display:none;"'} />
            <button class="property-remove-btn" data-remove="${prop}">${t('ui.inputs.remove')}</button>
          </div>
        `;
      } else if (inputType === 'color') {
        return `
          <div class="css-property active" data-property="${prop}">
            <label>${translatedProp}</label>
            ${createColorInput(prop, currentValue)}
            <button class="property-remove-btn" data-remove="${prop}">${t('ui.inputs.remove')}</button>
          </div>
        `;
      } else if (inputType === 'size') {
        return `
          <div class="css-property active" data-property="${prop}">
            <label>${translatedProp}</label>
            ${createSizeInput(prop, currentValue)}
            <button class="property-remove-btn" data-remove="${prop}">${t('ui.inputs.remove')}</button>
          </div>
        `;
      } else if (inputType === 'number') {
        return `
          <div class="css-property active" data-property="${prop}">
            <label>${translatedProp}</label>
            ${createPercentageInput(prop, currentValue)}
            <button class="property-remove-btn" data-remove="${prop}">${t('ui.inputs.remove')}</button>
          </div>
        `;
      } else {
        return `
          <div class="css-property active" data-property="${prop}">
            <label>${translatedProp}</label>
            <input type="text" data-property="${prop}" value="${currentValue}" placeholder="${t('ui.inputs.enterValue')}" />
            <button class="property-remove-btn" data-remove="${prop}">${t('ui.inputs.remove')}</button>
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
      
      // Handle filter select first to avoid generic select handler
      if (target.classList.contains('filter-select')) {
        target.addEventListener('change', () => {
          const select = target as HTMLSelectElement;
          const type = select.value as any;
          const slider = container.querySelector(`.filter-slider[data-property="${property}"]`) as HTMLInputElement;
          const numberInput = container.querySelector(`.filter-number-input[data-property="${property}"]`) as HTMLInputElement;
          const unitEl = container.querySelector(`.filter-unit[data-property="${property}"]`) as HTMLElement;
          const controls = container.querySelector(`.filter-controls[data-property="${property}"]`) as HTMLElement;
          const customInput = container.querySelector(`.filter-custom-input[data-property="${property}"]`) as HTMLInputElement;
          const optEl = select.selectedOptions[0];
          const unit = optEl?.getAttribute('data-unit') || '';
          const min = parseFloat(optEl?.getAttribute('data-min') || '0');
          const max = parseFloat(optEl?.getAttribute('data-max') || '0');
          const step = parseFloat(optEl?.getAttribute('data-step') || '1');
          const def = parseFloat(optEl?.getAttribute('data-default') || '0');

          if (type === 'custom') {
            if (controls) controls.style.display = 'none';
            if (customInput) {
              customInput.style.display = '';
              this.updateProperty(property, customInput.value);
            }
            return;
          }

          if (type === 'none') {
            if (controls) controls.style.display = 'none';
            if (customInput) customInput.style.display = 'none';
            this.updateProperty(property, 'none');
            return;
          }

          if (slider && numberInput) {
            slider.min = min.toString();
            slider.max = max.toString();
            slider.step = step.toString();
            numberInput.min = min.toString();
            numberInput.max = max.toString();
            numberInput.step = step.toString();

            if (controls) controls.style.display = '';
            if (unitEl) {
              unitEl.style.display = '';
              unitEl.textContent = unit;
            }
            if (customInput) {
              customInput.style.display = 'none';
            }

            const currentVal = parseFloat(numberInput.value);
            const valueToUse = Number.isNaN(currentVal) ? def : currentVal;
            slider.value = valueToUse.toString();
            numberInput.value = valueToUse.toString();
            this.updateProperty(property, formatFilterValue(type, valueToUse, unit));
          }
        });
      } else if (target.tagName === 'SELECT' && target.classList.contains('size-unit-selector')) {
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
        // Handle size slider (non-linear mapping)
        target.addEventListener('input', () => {
          const numberInput = container.querySelector(`.size-number-input[data-property="${property}"]`) as HTMLInputElement;
          const sliderVal = parseFloat((target as HTMLInputElement).value);
          const mappedValue = mapSizeSliderToValue(sliderVal);
          if (numberInput) {
            numberInput.value = mappedValue.toString();
          }
          this.handleSizeInputChange(property);
        });
      } else if (target.classList.contains('size-number-input')) {
        // Handle size number input
        target.addEventListener('input', () => {
          const slider = container.querySelector(`.size-slider[data-property="${property}"]`) as HTMLInputElement;
          const numeric = parseFloat((target as HTMLInputElement).value);
          if (slider && !Number.isNaN(numeric)) {
            slider.value = mapValueToSizeSlider(numeric).toString();
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
      } else if (target.classList.contains('filter-slider')) {
        target.addEventListener('input', () => {
          const slider = target as HTMLInputElement;
          const numberInput = container.querySelector(`.filter-number-input[data-property="${property}"]`) as HTMLInputElement;
          const select = container.querySelector(`.filter-select[data-property="${property}"]`) as HTMLSelectElement;
          const optEl = select?.selectedOptions[0];
          const unit = optEl?.getAttribute('data-unit') || '';
          const type = (select?.value || 'none') as any;
          const val = parseFloat(slider.value);
          if (numberInput) numberInput.value = slider.value;
          this.updateProperty(property, formatFilterValue(type, val, unit));
        });
      } else if (target.classList.contains('filter-number-input')) {
        target.addEventListener('input', () => {
          const numberInput = target as HTMLInputElement;
          const slider = container.querySelector(`.filter-slider[data-property="${property}"]`) as HTMLInputElement;
          const select = container.querySelector(`.filter-select[data-property="${property}"]`) as HTMLSelectElement;
          const optEl = select?.selectedOptions[0];
          const unit = optEl?.getAttribute('data-unit') || '';
          const type = (select?.value || 'none') as any;
          if (slider) slider.value = numberInput.value;
          const val = parseFloat(numberInput.value);
          this.updateProperty(property, formatFilterValue(type, val, unit));
        });
      } else if (target.classList.contains('filter-custom-input')) {
        target.addEventListener('input', () => {
          this.updateProperty(property, (target as HTMLInputElement).value);
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
    const sliderInput = container.querySelector(`.size-slider[data-property="${property}"]`) as HTMLInputElement;
    
    if (numberInput && unitSelect) {
      const numericValue = parseFloat(numberInput.value);
      if (sliderInput && !Number.isNaN(numericValue)) {
        sliderInput.value = mapValueToSizeSlider(numericValue).toString();
      }

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
      alert(t('ui.propertySelector.allAdded'));
      return;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'property-selector-modal';
    modal.innerHTML = `
      <div class="property-selector-content">
        <h3>${t('ui.propertySelector.title')}</h3>
        <input type="text" class="property-search" placeholder="${t('ui.propertySelector.search')}" />
        <div class="property-list">
          ${availableProperties.map(prop => 
            `<button class="property-option" data-property="${prop}">${translateProperty(prop)}</button>`
          ).join('')}
        </div>
        <button class="modal-close">${t('ui.propertySelector.cancel')}</button>
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
    this.emitChange(css);
  }

  /**
   * Generate CSS from current styles (only modified properties)
   * Task 3: Include all element changes, not just the current element
   */
  private generateCSS(): string {
    // Task 3: Save current element changes before generating CSS
    this.saveCurrentElementChanges();
    
    // Generate CSS for all elements with changes
    if (this.allElementChanges.size === 0) {
      return '';
    }
    
    const cssBlocks: string[] = [];
    
    this.allElementChanges.forEach((elementData, selector) => {
      const properties = Array.from(elementData.modifiedProperties)
        .map(prop => {
          const value = elementData.styles.get(prop);
          return value ? `  ${prop}: ${value};` : null;
        })
        .filter(line => line !== null)
        .join('\n');
      
      if (properties) {
        cssBlocks.push(`${selector} {\n${properties}\n}`);
      }
    });
    
    return cssBlocks.join('\n\n');
  }

  /**
   * Update the CSS preview
   */
  private updatePreview(): void {
    const preview = this.panel?.querySelector('.css-output');
    if (preview) {
      const css = this.generateCSS();
      preview.textContent = css || t('ui.panel.noStyles');
    }
  }

  /**
   * Emit onChange callback if provided
   */
  private emitChange(css: string): void {
    if (this.options.onChange) {
      this.options.onChange(css);
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
          alert(t('ui.messages.cssSaved'));
        } else {
          alert(t('ui.messages.failedSave'));
        }
      } catch (error) {
        console.error('Error saving CSS:', error);
        alert(t('ui.messages.errorSave'));
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
      alert(t('ui.messages.cssLoaded'));
    }
  }

  /**
   * Export CSS to clipboard
   */
  private exportCSS(): void {
    const css = this.generateCSS();
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(css).then(() => {
        alert(t('ui.messages.cssCopied'));
      }).catch((err) => {
        console.error(t('ui.messages.failedCopy'), err);
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
    closeBtn.textContent = t('ui.panel.close');
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
    message.textContent = t('ui.messages.copyManually');
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
   * Task 3: Also clear all element changes stored in memory
   */
  private clearChanges(): void {
    if (confirm(t('ui.messages.confirmClear'))) {
      this.currentStyles.clear();
      this.modifiedProperties.clear();
      this.advancedProperties.clear();
      this.allElementChanges.clear(); // Clear all stored element changes
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
   * Task 4: Parse selector into parts for configuration
   */
  private parseSelectorIntoParts(selector: string, element: Element): void {
    this.selectorParts = [];
    
    // Split by > or space (but preserve them)
    const parts = selector.split(/(\s+>|\s+)/);
    let currentElement = element;
    
    // Process in reverse (from element to root)
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i].trim();
      if (!part || part === '>' || part === ' ') continue;
      
      // Determine combinator (default to space for last element)
      let combinator: '>' | ' ' = ' ';
      if (i > 0 && parts[i - 1].includes('>')) {
        combinator = '>';
      }
      
      // Extract position info from selector
      let positionType: 'all' | 'even' | 'odd' | 'position' = 'all';
      let positionValue: number | undefined;
      let cleanSelector = part;
      
      // Check for :nth-of-type or :nth-child
      const nthMatch = part.match(/:nth-of-type\((\d+)\)|:nth-of-type\(even\)|:nth-of-type\(odd\)|:nth-child\((\d+)\)/);
      if (nthMatch) {
        if (nthMatch[0].includes('even')) {
          positionType = 'even';
        } else if (nthMatch[0].includes('odd')) {
          positionType = 'odd';
        } else {
          positionType = 'position';
          positionValue = parseInt(nthMatch[1] || nthMatch[2]);
        }
        cleanSelector = part.replace(/:nth-of-type\((\d+|even|odd)\)|:nth-child\(\d+\)/, '');
      }
      
      // Count siblings if we have the element
      let siblingCount = 0;
      if (currentElement && currentElement.parentElement) {
        // Extract tag name, handling selectors that start with class or ID
        let tagName = cleanSelector.split(/[.#:]/)[0];
        if (!tagName) {
          // If selector starts with . or #, use the element's tag name
          tagName = currentElement.tagName.toLowerCase();
        }
        const siblings = Array.from(currentElement.parentElement.children);
        siblingCount = siblings.filter(el => el.tagName.toLowerCase() === tagName).length;
      }
      
      this.selectorParts.unshift({
        selector: cleanSelector,
        combinator: combinator,
        positionType: positionType,
        positionValue: positionValue,
        siblingCount: siblingCount
      });
      
      // Move up the tree
      if (currentElement) {
        currentElement = currentElement.parentElement as Element;
      }
    }
  }

  /**
   * Task 4: Toggle selector configuration panel
   */
  private toggleSelectorConfig(): void {
    this.selectorConfigExpanded = !this.selectorConfigExpanded;
    const configPanel = this.panel?.querySelector('.selector-config-panel') as HTMLElement;
    
    if (configPanel) {
      if (this.selectorConfigExpanded) {
        configPanel.style.display = 'block';
        this.renderSelectorConfig();
      } else {
        configPanel.style.display = 'none';
      }
    }
  }

  /**
   * Task 4: Render selector configuration UI
   */
  private renderSelectorConfig(): void {
    const configPanel = this.panel?.querySelector('.selector-config-panel') as HTMLElement;
    if (!configPanel) return;
    
    let html = '<div class="selector-config-content">';
    
    this.selectorParts.forEach((part, index) => {
      const partId = `selector-part-${index}`;
      
      // Create position options
      const positionOptions = ['all', 'even', 'odd'];
      if (part.siblingCount) {
        for (let i = 1; i <= part.siblingCount; i++) {
          positionOptions.push(`position-${i}`);
        }
      }
      
      html += `
        <div class="selector-part-container">
          <div class="selector-part" data-index="${index}">
            <div class="selector-part-label">${part.selector}</div>
            <select class="selector-position-type" data-index="${index}">
              ${positionOptions.map(opt => {
                const isSelected = (opt === 'all' && part.positionType === 'all') ||
                                   (opt === 'even' && part.positionType === 'even') ||
                                   (opt === 'odd' && part.positionType === 'odd') ||
                                   (opt.startsWith('position-') && part.positionType === 'position' && 
                                    parseInt(opt.replace('position-', '')) === part.positionValue);
                
                const label = opt === 'all' ? t('ui.selectorConfig.all') :
                              opt === 'even' ? t('ui.selectorConfig.even') :
                              opt === 'odd' ? t('ui.selectorConfig.odd') :
                              t('ui.selectorConfig.onlyPosition', { n: opt.replace('position-', '') });
                
                return `<option value="${opt}" ${isSelected ? 'selected' : ''}>${label}</option>`;
              }).join('')}
            </select>
          </div>
      `;
      
      // Add combinator control between parts (except for the last one)
      if (index < this.selectorParts.length - 1) {
        html += `
          <div class="selector-combinator">
            <div class="combinator-line"></div>
            <select class="selector-combinator-type" data-index="${index}">
              <option value=">" ${part.combinator === '>' ? 'selected' : ''}>${t('ui.selectorConfig.children')}</option>
              <option value=" " ${part.combinator === ' ' ? 'selected' : ''}>${t('ui.selectorConfig.descendants')}</option>
            </select>
          </div>
        `;
      }
      
      html += '</div>';
    });
    
    html += '</div>';
    configPanel.innerHTML = html;
    
    // Attach event listeners
    this.attachSelectorConfigListeners();
  }

  /**
   * Task 4: Attach event listeners to selector config controls
   */
  private attachSelectorConfigListeners(): void {
    const configPanel = this.panel?.querySelector('.selector-config-panel');
    if (!configPanel) return;
    
    // Position type selects
    const positionSelects = configPanel.querySelectorAll('.selector-position-type');
    positionSelects.forEach(select => {
      select.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        const index = parseInt(target.dataset.index || '0');
        this.updateSelectorPartPosition(index, target.value);
      });
    });
    
    // Combinator selects
    const combinatorSelects = configPanel.querySelectorAll('.selector-combinator-type');
    combinatorSelects.forEach(select => {
      select.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        const index = parseInt(target.dataset.index || '0');
        this.updateSelectorPartCombinator(index, target.value as '>' | ' ');
      });
    });
  }

  /**
   * Task 4: Update selector part position
   */
  private updateSelectorPartPosition(index: number, value: string): void {
    const part = this.selectorParts[index];
    if (!part) return;
    
    if (value === 'all') {
      part.positionType = 'all';
      part.positionValue = undefined;
    } else if (value === 'even') {
      part.positionType = 'even';
      part.positionValue = undefined;
    } else if (value === 'odd') {
      part.positionType = 'odd';
      part.positionValue = undefined;
    } else if (value.startsWith('position-')) {
      part.positionType = 'position';
      part.positionValue = parseInt(value.replace('position-', ''));
    }
    
    this.rebuildSelector();
  }

  /**
   * Task 4: Update selector part combinator
   */
  private updateSelectorPartCombinator(index: number, value: '>' | ' '): void {
    const part = this.selectorParts[index];
    if (!part) return;
    
    part.combinator = value;
    this.rebuildSelector();
  }

  /**
   * Task 4: Rebuild selector from parts
   */
  private rebuildSelector(): void {
    // Store old selector before updating
    const oldSelector = this.currentSelector;
    
    let selector = '';
    
    this.selectorParts.forEach((part, index) => {
      // Add the selector part
      selector += part.selector;
      
      // Add position specifier
      if (part.positionType === 'position' && part.positionValue) {
        selector += `:nth-of-type(${part.positionValue})`;
      } else if (part.positionType === 'even') {
        selector += ':nth-of-type(even)';
      } else if (part.positionType === 'odd') {
        selector += ':nth-of-type(odd)';
      }
      
      // Add combinator (except for last part)
      if (index < this.selectorParts.length - 1) {
        selector += part.combinator === '>' ? ' > ' : ' ';
      }
    });
    
    this.currentSelector = selector;
    
    // Update the selector input
    const selectorInput = this.panel?.querySelector('.selector-input') as HTMLInputElement;
    if (selectorInput) {
      selectorInput.value = selector;
    }
    
    // Update selector count
    this.updateSelectorCount();
    
    // Update all element changes with new selector
    if (this.currentElement && oldSelector !== selector) {
      const oldChanges = this.allElementChanges.get(oldSelector);
      if (oldChanges) {
        // Remove old entry
        this.allElementChanges.delete(oldSelector);
        // Add with new selector
        this.allElementChanges.set(selector, oldChanges);
      }
    }
    
    // Apply styles with new selector
    this.applyStyles();
  }

  /**
   * Task 4: Update selector count display
   */
  private updateSelectorCount(): void {
    const selectorCount = this.panel?.querySelector('.selector-count') as HTMLElement | null;
    if (selectorCount) {
      try {
        const matches = document.querySelectorAll(this.currentSelector);
        const count = matches.length;
        
        if (count > 0) {
          selectorCount.textContent = t('ui.panel.selectorMatchCount', { count: count.toString() });
          selectorCount.style.display = 'block';
        } else {
          selectorCount.textContent = '';
          selectorCount.style.display = 'none';
        }
      } catch (e) {
        selectorCount.textContent = this.currentSelector ? t('ui.panel.selectorInvalid') : '';
        selectorCount.style.display = this.currentSelector ? 'block' : 'none';
      }
    }
  }

  /**
   * Destroy the panel
   * Task 3: Clean up all element changes to prevent memory leaks
   */
  public destroy(): void {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
    if (this.styleElement) {
      this.styleElement.remove();
    }
    // Clear all stored element changes to prevent memory leaks
    this.allElementChanges.clear();
  }
}
