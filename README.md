# CSS Editor

A powerful visual CSS editing tool for any HTML page. Pick elements interactively and modify their styles through an intuitive side panel interface. Perfect for customizing website styles and storing them in a custom backend.

## Features

- 🎯 **Element Picker**: Click any element on the page to start editing
- 🔍 **Smart Selector Generator**: Automatically generates the most unique CSS selector
- 🎨 **Visual Editor**: Comprehensive side panel with all CSS properties organized by category
- ⚡ **Real-time Preview**: See changes applied instantly as you edit
- 💾 **Save & Load**: Optional endpoints for loading and saving CSS to your backend
- 📋 **Export**: Copy generated CSS to clipboard
- 🎭 **Non-intrusive**: Floating button that stays out of your way
- 🌍 **Multi-language**: Built-in support for English and Spanish, easy to add more languages

## Installation

### NPM (when published)
```bash
npm install css-editor
```

### Local Development
```bash
git clone https://github.com/Eseperio/css-editor.git
cd css-editor
npm install
npm run build
```

## Usage

### Basic Setup

Include the library in your HTML:

```html
<script src="path/to/css-editor.js"></script>
<script>
  const editor = new CSSEditor.CSSEditor();
  editor.init();
</script>
```

### With Options

```javascript
const editor = new CSSEditor.CSSEditor({
  // Optional: Set language (en, es-ES)
  locale: 'es-ES',
  
  // Optional: Backend endpoint to save CSS
  saveEndpoint: '/api/save-css',
  
  // Optional: Backend endpoint to load CSS
  loadEndpoint: '/api/load-css',
  
  // Optional: Custom save callback
  onSave: (css) => {
    console.log('Generated CSS:', css);
    // Implement your custom save logic
    localStorage.setItem('custom-css', css);
  },
  
  // Optional: Custom load callback
  onLoad: async () => {
    // Return previously saved CSS
    return localStorage.getItem('custom-css') || '';
  }
});

editor.init();
```

### Programmatic Usage

```javascript
// Start element picking mode
editor.startPicking();

// Stop picking mode
editor.stopPicking();

// Show editor for a specific selector
editor.showEditor('.my-element');

// Hide the editor panel
editor.hideEditor();

// Clean up and remove the editor
editor.destroy();
```

## How It Works

1. **Click the floating 🎨 button** in the bottom-right corner to activate picker mode
2. **Hover over elements** - they will be highlighted with a blue overlay
3. **Click an element** to open the CSS editor panel
4. **Edit properties** using the tabbed interface (Layout, Box, Border, Background, Text, Flex, Grid, Effects)
5. **See real-time changes** applied to the page
6. **Save or export** your CSS when done

## API Reference

### CSSEditor

Main class for the CSS editor.

```typescript
constructor(options?: CSSEditorOptions)
```

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `locale` | `'en' \| 'es-ES'` | Language for the UI (default: 'en'). See [i18n docs](docs/i18n.md) |
| `saveEndpoint` | `string` | URL endpoint for saving CSS (POST request) |
| `loadEndpoint` | `string` | URL endpoint for loading CSS (GET request) |
| `onSave` | `(css: string) => void` | Callback function when save button is clicked |
| `onLoad` | `() => Promise<string>` | Callback function to load previously saved CSS |
| `onChange` | `(css: string) => void` | Callback fired on every CSS change (live typing) |
| `fontFamilies` | `string[]` | Optional list of font-family suggestions for the Typography panel |

#### Methods

- `init()` - Initialize the editor with the floating activate button
- `startPicking()` - Activate element picking mode
- `stopPicking()` - Deactivate element picking mode
- `showEditor(selector: string)` - Show editor for a specific CSS selector
- `hideEditor()` - Hide the editor panel
- `destroy()` - Remove the editor and clean up

### Backend Integration

#### Save Endpoint

The save endpoint should accept POST requests with JSON body:

```json
{
  "css": "selector {\n  property: value;\n}"
}
```

Example Express.js endpoint:
```javascript
app.post('/api/save-css', (req, res) => {
  const { css } = req.body;
  // Save CSS to database or file
  fs.writeFileSync('custom-styles.css', css);
  res.json({ success: true });
});
```

#### Load Endpoint

The load endpoint should return CSS as plain text:

```javascript
app.get('/api/load-css', (req, res) => {
  const css = fs.readFileSync('custom-styles.css', 'utf8');
  res.type('text/plain').send(css);
});
```

## Development

### Build

```bash
npm run build
```

This creates:
- `dist/css-editor.js` - UMD bundle for browsers
- `dist/css-editor.esm.js` - ES module bundle
- `dist/css-editor.d.ts` - TypeScript definitions

### Development Mode

```bash
npm run dev
```

Watches for changes and rebuilds automatically.

### Example

Open `example/index.html` in your browser to see a live demo.

### Internationalization

The CSS Editor supports multiple languages. See the [i18n documentation](docs/i18n.md) for details on:
- Available languages
- Setting and changing locale
- Adding new languages
- Translation file structure

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
