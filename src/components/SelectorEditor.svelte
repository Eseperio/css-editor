<script lang="ts">
  import { onDestroy } from 'svelte';
  import {
    currentSelector,
    editorState,
    setCurrentSelector,
    setActiveElement,
    setSelectorParts,
    type SelectorPart,
  } from '../stores/editorState';
  import {
    toggleSelectorConfig,
    selectorConfigExpanded,
    addHighlightOverlay,
    clearHighlightOverlays,
  } from '../stores/ui';
  import { generateUniqueSelector } from '../selector-generator';
  import { icons } from '../icons';
  import Icon from './Icon.svelte';
  import { _ } from '../i18n/setup';

  let selectorInput = '';
  let selectorCountText = '';
  let selectorCountVisible = false;
  $: inputId = 'css-editor-selector-input';
  let selectorParts: SelectorPart[] = [];

  $: selectorInput = $currentSelector;

  $: {
    if (!$currentSelector) {
      selectorCountText = '';
      selectorCountVisible = false;
    } else {
      try {
        const doc = $editorState.currentElement?.ownerDocument || document;
        const count = doc.querySelectorAll($currentSelector).length;
        if (count > 1) {
          selectorCountText = $_('ui.panel.selectorMatchCount', { count: count.toString() });
          selectorCountVisible = true;
        } else if (count === 1) {
          selectorCountText = '';
          selectorCountVisible = false;
        } else {
          selectorCountText = $_('ui.panel.selectorInvalid');
          selectorCountVisible = true;
        }
      } catch {
        selectorCountText = $_('ui.panel.selectorInvalid');
        selectorCountVisible = true;
      }
    }
  }

  function handleSelectorChange(event: Event) {
    const target = event.target as HTMLInputElement;
    setCurrentSelector(target.value);
  }

  function regenerateSelector() {
    if (!$editorState.currentElement) return;
    const selector = generateUniqueSelector($editorState.currentElement);
    setActiveElement(selector, $editorState.currentElement);
  }

  function parseSelectorIntoParts(selector: string, element: Element | null): SelectorPart[] {
    if (!selector) return [];
    const parts = selector.split(/(\s*>\s*|\s+)/);
    let currentElement = element;
    const parsedParts: SelectorPart[] = [];

    for (let i = parts.length - 1; i >= 0; i -= 1) {
      const part = parts[i].trim();
      if (!part || part === '>' || part === ' ') continue;

      let combinator: '>' | ' ' = ' ';
      if (i > 0 && parts[i - 1].includes('>')) {
        combinator = '>';
      }

      let positionType: 'all' | 'even' | 'odd' | 'position' = 'all';
      let positionValue: number | undefined;
      let cleanSelector = part;

      const nthMatch = part.match(/:nth-of-type\((\d+|even|odd)\)|:nth-child\((\d+|even|odd)\)/);
      if (nthMatch) {
        const value = nthMatch[1] || nthMatch[2];
        if (value === 'even') {
          positionType = 'even';
        } else if (value === 'odd') {
          positionType = 'odd';
        } else {
          positionType = 'position';
          positionValue = parseInt(value, 10);
        }
        cleanSelector = part.replace(/:nth-of-type\((\d+|even|odd)\)|:nth-child\((\d+|even|odd)\)/, '');
      }

      let siblingCount = 0;
      if (currentElement && currentElement.parentElement) {
        let tagName = cleanSelector.split(/[.#:]/)[0];
        if (!tagName) {
          tagName = currentElement.tagName.toLowerCase();
        }
        const siblings = Array.from(currentElement.parentElement.children);
        siblingCount = siblings.filter((el) => el.tagName.toLowerCase() === tagName).length;
      }

      parsedParts.unshift({
        selector: cleanSelector,
        combinator,
        positionType,
        positionValue,
        siblingCount,
      });

      if (currentElement) {
        currentElement = currentElement.parentElement as Element;
      }
    }

    return parsedParts;
  }

  function rebuildSelector(parts: SelectorPart[]) {
    let selector = '';
    parts.forEach((part, index) => {
      if (index > 0) {
        selector += part.combinator === '>' ? ' > ' : ' ';
      }
      selector += part.selector;
      if (part.positionType === 'position' && part.positionValue) {
        selector += `:nth-of-type(${part.positionValue})`;
      } else if (part.positionType === 'even') {
        selector += ':nth-of-type(even)';
      } else if (part.positionType === 'odd') {
        selector += ':nth-of-type(odd)';
      }
    });

    setCurrentSelector(selector);
  }

  function handlePositionChange(index: number, value: string) {
    const nextParts = selectorParts.map((part, idx) => {
      if (idx !== index) return part;
      if (value === 'all') return { ...part, positionType: 'all', positionValue: undefined };
      if (value === 'even') return { ...part, positionType: 'even', positionValue: undefined };
      if (value === 'odd') return { ...part, positionType: 'odd', positionValue: undefined };
      if (value.startsWith('position-')) {
        return { ...part, positionType: 'position', positionValue: parseInt(value.replace('position-', ''), 10) };
      }
      return part;
    });
    selectorParts = nextParts;
    setSelectorParts(nextParts);
    rebuildSelector(nextParts);
  }

  function handleCombinatorChange(index: number, value: '>' | ' ') {
    const targetIndex = index + 1;
    const nextParts = selectorParts.map((part, idx) => {
      if (idx !== targetIndex) return part;
      return { ...part, combinator: value };
    });
    selectorParts = nextParts;
    setSelectorParts(nextParts);
    rebuildSelector(nextParts);
  }

  function highlightMatchingElements(selector: string) {
    clearHighlightOverlays();
    if (!selector) return;
    const doc = $editorState.targetDocument || document;
    let elements: NodeListOf<Element>;
    try {
      elements = doc.querySelectorAll(selector);
    } catch {
      return;
    }

    const iframe = document.querySelector('#css-editor-iframe') as HTMLIFrameElement | null;
    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      let top = rect.top;
      let left = rect.left;

      if (iframe) {
        const iframeRect = iframe.getBoundingClientRect();
        top += iframeRect.top;
        left += iframeRect.left;
      }

      const overlay = document.createElement('div');
      overlay.className = 'css-editor-selector-highlight';
      overlay.style.cssText = `
        position: fixed;
        top: ${top}px;
        left: ${left}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        background: rgba(255, 235, 59, 0.3);
        border: 2px solid rgba(255, 193, 7, 0.8);
        pointer-events: none;
        z-index: 9998;
        transition: all 0.2s ease;
      `;
      document.body.appendChild(overlay);
      addHighlightOverlay(overlay);
    });
  }

  function highlightSelectorUpToIndex(index: number) {
    let selector = '';
    for (let i = 0; i <= index; i += 1) {
      const part = selectorParts[i];
      if (!part) continue;
      if (i > 0) {
        selector += part.combinator === '>' ? ' > ' : ' ';
      }
      selector += part.selector;
      if (part.positionType === 'position' && part.positionValue) {
        selector += `:nth-of-type(${part.positionValue})`;
      } else if (part.positionType === 'even') {
        selector += ':nth-of-type(even)';
      } else if (part.positionType === 'odd') {
        selector += ':nth-of-type(odd)';
      }
    }

    highlightMatchingElements(selector);
  }

  $: if ($selectorConfigExpanded && $editorState.currentElement) {
    selectorParts = parseSelectorIntoParts($currentSelector, $editorState.currentElement);
    setSelectorParts(selectorParts);
  }
  $: if (!$selectorConfigExpanded) {
    clearHighlightOverlays();
  }

  onDestroy(() => {
    clearHighlightOverlays();
  });
</script>

<div class="css-editor-selector">
  <div class="selector-header">
    <label for={inputId}>{$_('ui.panel.selector')}:</label>
    <div class="selector-actions">
      <button
        class="selector-config-toggle"
        on:click={toggleSelectorConfig}
        title="Configure selector"
        type="button"
      >
        <Icon icon={icons.settings} />
      </button>
      <button
        class="selector-config-toggle"
        on:click={regenerateSelector}
        title="Regenerate selector"
        type="button"
      >
        <Icon icon={icons.refresh} />
      </button>
    </div>
  </div>
  <input
    id={inputId}
    class="selector-input"
    type="text"
    value={selectorInput}
    on:input={handleSelectorChange}
    on:mouseenter={() => highlightMatchingElements($currentSelector)}
    on:mouseleave={clearHighlightOverlays}
    placeholder="e.g., .my-class"
  />
  <div class="selector-count" style:display={selectorCountVisible ? 'block' : 'none'}>
    {selectorCountText}
  </div>
  <div class="selector-config-panel" style:display={$selectorConfigExpanded ? 'block' : 'none'}>
    <div class="selector-config-content">
      {#each selectorParts as part, index}
        <div class="selector-part-container">
          <div
            class="selector-part"
            data-index={index}
            role="button"
            tabindex="0"
            on:mouseenter={() => highlightSelectorUpToIndex(index)}
            on:mouseleave={clearHighlightOverlays}
            on:focus={() => highlightSelectorUpToIndex(index)}
            on:blur={clearHighlightOverlays}
          >
            <div class="selector-part-label">{part.selector}</div>
            <select
              class="selector-position-type"
              data-index={index}
              on:change={(event) => handlePositionChange(index, (event.target as HTMLSelectElement).value)}
            >
              <option value="all" selected={part.positionType === 'all'}>{$_('ui.selectorConfig.all')}</option>
              <option value="even" selected={part.positionType === 'even'}>{$_('ui.selectorConfig.even')}</option>
              <option value="odd" selected={part.positionType === 'odd'}>{$_('ui.selectorConfig.odd')}</option>
              {#if part.siblingCount}
                {#each Array(part.siblingCount) as unused, idx}
                  {@const positionValue = idx + 1}
                  <option
                    value={`position-${positionValue}`}
                    selected={part.positionType === 'position' && part.positionValue === positionValue}
                  >
                    {$_('ui.selectorConfig.onlyPosition', { n: positionValue.toString() })}
                  </option>
                {/each}
              {/if}
            </select>
          </div>
          {#if index < selectorParts.length - 1}
            <div class="selector-combinator">
              <div class="combinator-line"></div>
              <select
                class="selector-combinator-type"
                data-index={index}
                on:change={(event) => handleCombinatorChange(index, (event.target as HTMLSelectElement).value as '>' | ' ')}
              >
                <option value=">" selected={selectorParts[index + 1]?.combinator === '>'}>
                  {$_('ui.selectorConfig.children')}
                </option>
                <option value=" " selected={selectorParts[index + 1]?.combinator === ' '}>
                  {$_('ui.selectorConfig.descendants')}
                </option>
              </select>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
