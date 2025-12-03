/**
 * Generate a unique CSS selector for a given element
 */
export function generateUniqueSelector(element: Element): string {
  // If element has an ID, use it as it's the most specific
  if (element.id) {
    return `#${element.id}`;
  }

  // Build path from element to root
  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    
    // Add classes if available
    if (current.classList.length > 0) {
      selector += '.' + Array.from(current.classList).join('.');
    }
    
    // Check if we need to add nth-child to make it unique
    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children);
      const sameTagSiblings = siblings.filter(
        (sibling) => sibling.tagName === current!.tagName
      );
      
      if (sameTagSiblings.length > 1) {
        const index = sameTagSiblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }
    
    path.unshift(selector);
    current = current.parentElement;
  }

  // Always include body in the path for clarity
  path.unshift('body');

  // Build the full selector
  let fullSelector = path.join(' > ');

  // Verify the selector is unique
  const matches = document.querySelectorAll(fullSelector);
  if (matches.length === 1 && matches[0] === element) {
    return fullSelector;
  }

  // If not unique, fall back to a more specific selector with all attributes
  return generateFallbackSelector(element);
}

/**
 * Generate a fallback selector using more specific attributes
 */
function generateFallbackSelector(element: Element): string {
  const path: string[] = [];
  let current: Element | null = element;
  let iterations = 0;
  const maxIterations = 10;

  while (current && current !== document.body && iterations < maxIterations) {
    let selector = current.tagName.toLowerCase();
    
    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }
    
    if (current.classList.length > 0) {
      selector += '.' + Array.from(current.classList).join('.');
    }

    // Add nth-child for specificity
    if (current.parentElement) {
      const index = Array.from(current.parentElement.children).indexOf(current) + 1;
      selector += `:nth-child(${index})`;
    }
    
    path.unshift(selector);
    current = current.parentElement;
    iterations++;
  }

  return path.join(' > ');
}
