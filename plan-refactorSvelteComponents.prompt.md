# Plan Completo de Componentes Svelte para CSS Editor

## 📋 Índice
1. [Estructura General](#estructura-general)
2. [Componentes Principales](#componentes-principales)
3. [Componentes de UI Reutilizables](#componentes-de-ui-reutilizables)
4. [Componentes de Propiedades CSS](#componentes-de-propiedades-css)
5. [Sistemas de Gestión](#sistemas-de-gestion)
6. [Flujo de Datos](#flujo-de-datos)

---

## Estructura General

```
src/
├── components/
│   ├── CSSEditor.svelte (componente raíz)
│   ├── EditorPanel.svelte (panel general)
│   ├── PanelHeader.svelte (opciones configuración)
│   ├── SelectorEditor.svelte (editor selector CSS)
│   ├── PropertyGroups.svelte (contenedor grupos)
│   ├── PropertyCard.svelte (tarjeta colapsable)
│   ├── CSSPropertyEditor.svelte (editor propiedades genérico)
│   ├── ViewportModeButtons.svelte (botones viewport)
│   ├── MediaQueryManager.svelte (gestor media queries)
│   ├── CSSVariablesPanel.svelte (panel variables CSS)
│   │
│   ├── property-editors/
│   │   ├── NumericCSSPropertyEditor.svelte
│   │   ├── SelectCSSPropertyEditor.svelte
│   │   ├── ColorCSSPropertyEditor.svelte
│   │   ├── ColorUsedList.svelte
│   │   ├── SpacingPropertyEditor.svelte (margin/padding)
│   │   ├── BorderPropertyEditor.svelte (border completo)
│   │   ├── BorderRadiusPropertyEditor.svelte
│   │   ├── ShadowPropertyEditor.svelte
│   │   ├── ShadowItemEditor.svelte
│   │   └── FilterPropertyEditor.svelte
│   │
│   └── ui/
│       ├── SliderPopover.svelte (popover con slider)
│       ├── IconButton.svelte
│       ├── IconDropdown.svelte
│       ├── MediaQueryIcon.svelte
│       ├── VariableIcon.svelte
│       └── DependencyWarning.svelte
│
├── stores/
│   ├── cssStore.ts (estado CSS)
│   ├── viewportStore.ts (viewport activo)
│   ├── mediaQueryStore.ts (media queries)
│   ├── variablesStore.ts (variables CSS)
│   └── uiStore.ts (estado UI:  collapsed cards, etc)
│
├── utils/
│   ├── selector-generator.ts
│   ├── element-picker.ts
│   ├── css-parser.ts
│   ├── color-extractor.ts
│   └── property-helpers.ts
│
└── types/
    ├── css-properties.ts
    └── editor-types.ts

old/ (copia vanilla JS para referencia)
```

---

## Componentes Principales

### 1. **CSSEditor.svelte** (Componente Raíz)
**Responsabilidad**: Componente principal que inicializa todo el sistema

**Props**:
```typescript
export let options: CSSEditorOptions = {
  locale?:  'en' | 'es-ES',
  saveEndpoint?: string,
  loadEndpoint?: string,
  onSave?: (css: string) => void,
  onLoad?:  () => Promise<string>,
  onChange?: (css: string) => void,
  fontFamilies?: string[],
  iframeMode?: {
    url: string,
    viewportSizes:  {
      desktop: number,
      tablet: number,
      phone: number
    }
  }
}
```

**Estado Local**:
- `isActive:  boolean` - Si el editor está activado
- `isPicking: boolean` - Si está en modo selección de elemento
- `selectedElement: HTMLElement | null` - Elemento seleccionado
- `targetDocument: Document` - Documento objetivo (página o iframe)

**Funcionalidades**:
- Renderiza el botón flotante de activación (🎨)
- Gestiona el `ElementPicker`
- Renderiza el `EditorPanel` cuando hay elemento seleccionado
- Gestiona el modo iframe si está habilitado
- Expone métodos públicos:  `init()`, `startPicking()`, `stopPicking()`, `showEditor()`, `hideEditor()`, `destroy()`

---

### 2. **EditorPanel.svelte** (Panel General Contenedor)
**Responsabilidad**: Panel lateral que contiene todo el editor

**Props**:
```typescript
export let position: 'left' | 'right' | 'top' | 'bottom' = 'right'
export let isResizable:  boolean = true
export let element: HTMLElement | null
export let selector: string
export let targetDocument: Document
```

**Estado Local**:
- `width: number` - Ancho del panel (si vertical)
- `height: number` - Alto del panel (si horizontal)
- `isDragging: boolean` - Si se está redimensionando

**Estructura**:
```svelte
<div class="css-editor-panel {position}" style="width: {width}px">
  <!-- Drag handle para redimensionar -->
  <div class="resize-handle" on:mousedown={startResize}></div>
  
  <!-- Header con configuración -->
  <PanelHeader {position} {selector} />
  
  <!-- Editor de selector -->
  <SelectorEditor {selector} {element} />
  
  <!-- Botones de viewport (solo en iframe mode) -->
  {#if iframeMode}
    <ViewportModeButtons />
  {/if}
  
  <!-- Grupos de propiedades -->
  <PropertyGroups {element} {selector} />
  
  <!-- Panel de variables CSS -->
  <CSSVariablesPanel />
</div>
```

**Funcionalidades**:
- Redimensionable arrastrando el borde
- Puede anclarse a cualquier lado (left, right, top, bottom)
- Guarda el tamaño en localStorage
- Scroll interno cuando el contenido es muy largo

---

### 3. **PanelHeader.svelte** (Opciones de Configuración)
**Responsabilidad**: Muestra las opciones de configuración del panel

**Props**:
```typescript
export let position: 'left' | 'right' | 'top' | 'bottom'
export let selector: string
```

**Estructura Visual**:
```
┌─────────────────────────────────────┐
│ [Anchor Icon ▼] [Lang Icon ▼] [ ]  │
└─────────────────────────────────────┘
```

**Funcionalidades**:
- **Dropdown de Ancla**: Cambia posición del panel (left/right/top/bottom)
    - Icono:  Lucide `PanelLeft`, `PanelRight`, `PanelTop`, `PanelBottom`
- **Dropdown de Idioma**: Cambia entre EN y ES
    - Icono:  Lucide `Languages`
- **Botón Cerrar**: Cierra el editor
    - Icono: Lucide `X`
- **Botón Guardar**: Guarda el CSS
    - Icono:  Lucide `Save`
- **Botón Copiar**: Copia CSS al portapapeles
    - Icono: Lucide `Copy`

---

### 4. **SelectorEditor.svelte** (Editor de Selector CSS)
**Responsabilidad**: Permite editar el selector CSS del elemento

**Props**:
```typescript
export let selector: string
export let element: HTMLElement
```

**Estructura Visual**:
```
┌─────────────────────────────────────┐
│ CSS Selector:                        │
│ ┌─────────────────────────────┐     │
│ │ . my-class > div:first-child │ 🔄  │
│ └─────────────────────────────┘     │
└─────────────────────────────────────┘
```

**Funcionalidades**:
- Input editable con el selector actual
- Botón de regenerar selector (Lucide `RefreshCw`)
- Valida el selector en tiempo real
- Aplica el CSS al nuevo selector si cambia

---

### 5. **ViewportModeButtons.svelte** (Botones de Viewport)
**Responsabilidad**:  Botones para cambiar entre Desktop/Tablet/Phone

**Props**:
```typescript
export let currentViewport: 'desktop' | 'tablet' | 'phone'
```

**Estructura Visual**:
```
┌────────────────────────────────┐
│  [🖥️]  [📱]  [📱]           │
│ Desktop Tablet Phone          │
└────────────────────────────────┘
```

**Funcionalidades**:
- 3 botones con iconos Lucide:  `Monitor`, `Tablet`, `Smartphone`
- Resalta el viewport activo
- Al cambiar viewport, actualiza el store y redimensiona el iframe
- Las propiedades editadas en Tablet/Phone se envuelven en media queries

---

### 6. **PropertyGroups.svelte** (Contenedor de Grupos)
**Responsabilidad**:  Renderiza todos los grupos de propiedades CSS

**Props**:
```typescript
export let element: HTMLElement
export let selector: string
```

**Estructura**:
```svelte
{#each PROPERTY_GROUPS as group}
  <PropertyCard 
    groupName={group.name} 
    properties={group.properties}
    dependsOn={group.dependsOn}
    {element}
    {selector} />
{/each}
```

**Grupos de Propiedades** (desde `css-properties.ts`):
1. **Spacing**: margin, padding
2. **Border**: border, border-radius
3. **Shadow**: box-shadow
4. **Size**: width, height, min-*, max-*
5. **Typography**: color, font-*, text-*, line-height, letter-spacing
6. **Layout**: display, position, top, right, bottom, left, z-index, overflow, float, clear
7. **Flexbox**: (con dependencia de display:  flex)
8. **Grid**: (con dependencia de display:  grid)
9. **Background**: background-*
10. **Effects**: opacity, filter, transform, transition, cursor

---

### 7. **PropertyCard.svelte** (Tarjeta Colapsable)
**Responsabilidad**: Tarjeta de grupo de propiedades colapsable

**Props**:
```typescript
export let groupName: string
export let properties: string[]
export let dependsOn?:  PropertyDependency
export let element: HTMLElement
export let selector: string
```

**Estado Local**:
- `isCollapsed: boolean` - Si está colapsada (guardado en uiStore)
- `hasModifiedProperties: boolean` - Si alguna propiedad ha sido modificada

**Estructura Visual**:
```
┌─────────────────────────────────────┐
│ ● Spacing                           │  <- punto si hay cambios
├─────────────────────────────────────┤
│  margin: [input]                    │
│  padding: [input]                   │
└─────────────────────────────────────┘
```

**Funcionalidades**:
- Click en el header para colapsar/expandir (NO usa chevron)
- Muestra un punto (●) delante del título si alguna propiedad ha sido modificada
- Si tiene `dependsOn`, muestra warning cuando no se cumple la dependencia
- Animación suave al colapsar/expandir

---

## Componentes de Propiedades CSS

### 8. **CSSPropertyEditor.svelte** (Editor Genérico)
**Responsabilidad**: Decide qué sub-editor usar según la propiedad

**Props**:
```typescript
export let property: string
export let value: string
export let element: HTMLElement
export let selector:  string
```

**Lógica**:
```svelte
<script>
  import NumericCSSPropertyEditor from './property-editors/NumericCSSPropertyEditor.svelte'
  import SelectCSSPropertyEditor from './property-editors/SelectCSSPropertyEditor.svelte'
  import ColorCSSPropertyEditor from './property-editors/ColorCSSPropertyEditor. svelte'
  import SpacingPropertyEditor from './property-editors/SpacingPropertyEditor. svelte'
  import BorderPropertyEditor from './property-editors/BorderPropertyEditor.svelte'
  import BorderRadiusPropertyEditor from './property-editors/BorderRadiusPropertyEditor.svelte'
  import ShadowPropertyEditor from './property-editors/ShadowPropertyEditor.svelte'
  import FilterPropertyEditor from './property-editors/FilterPropertyEditor.svelte'
  
  import { SPACING_PROPERTIES, COMPOUND_PROPERTIES, MULTI_VALUE_PROPERTIES, getPropertyValues } from '$lib/types/css-properties'
  
  function getEditorComponent(property) {
    // Caso especial:  box-shadow
    if (property === 'box-shadow') {
      return ShadowPropertyEditor
    }
    
    // Caso especial: border
    if (property === 'border') {
      return BorderPropertyEditor
    }
    
    // Caso especial: border-radius
    if (property === 'border-radius') {
      return BorderRadiusPropertyEditor
    }
    
    // Caso especial: margin/padding
    const spacingProp = SPACING_PROPERTIES. find(sp => sp.general === property)
    if (spacingProp) {
      return SpacingPropertyEditor
    }
    
    // Caso especial: filter
    if (property === 'filter') {
      return FilterPropertyEditor
    }
    
    // Propiedades de color
    if (COLOR_PROPERTIES.includes(property)) {
      return ColorCSSPropertyEditor
    }
    
    // Propiedades con select
    const options = getPropertyValues(property)
    if (options && options.length > 0) {
      return SelectCSSPropertyEditor
    }
    
    // Propiedades numéricas
    if (SIZE_PROPERTIES.includes(property) || PERCENTAGE_PROPERTIES.includes(property)) {
      return NumericCSSPropertyEditor
    }
    
    // Por defecto, input de texto
    return NumericCSSPropertyEditor
  }
  
  $: editorComponent = getEditorComponent(property)
</script>

<svelte:component this={editorComponent} {property} {value} {element} {selector} />
```

---

### 9. **NumericCSSPropertyEditor.svelte**
**Responsabilidad**: Editor para propiedades numéricas con unidad

**Props**:
```typescript
export let property: string
export let value: string
export let element: HTMLElement
export let selector:  string
```

**Estructura Visual**:
```
┌─────────────────────────────────────┐
│ width:   [100] [px ▼]  [📱] [🔧]    │
└─────────────────────────────────────┘
```

**Componentes**:
- Input numérico (con click abre SliderPopover)
- Select de unidad (px, %, em, rem, vw, vh, auto)
- `MediaQueryIcon` - para aplicar a viewport específico
- `VariableIcon` - para vincular a variable CSS

**Funcionalidades**:
- Click en el input abre `SliderPopover` con slider
- Slider con escala logarítmica para rangos grandes
- Sincronización bidireccional input ↔ slider
- Parsing de valor existente (`parseCSSValue`)

---

### 10. **SelectCSSPropertyEditor.svelte**
**Responsabilidad**: Editor para propiedades con opciones predefinidas

**Props**:
```typescript
export let property: string
export let value: string
export let options: string[]
export let element:  HTMLElement
export let selector: string
```

**Estructura Visual**:
```
┌─────────────────────────────────────┐
│ display: [flex ▼]  [📱] [🔧]       │
└─────────────────────────────────────┘
```

**Componentes**:
- Dropdown con opciones
- `MediaQueryIcon`
- `VariableIcon`

---

### 11. **ColorCSSPropertyEditor.svelte**
**Responsabilidad**: Editor para propiedades de color

**Props**:
```typescript
export let property: string
export let value:  string
export let element: HTMLElement
export let selector: string
```

**Estructura Visual**:
```
┌─────────────────────────────────────┐
│ color: [🎨] [#FF5733] [📱] [🔧]    │
                                  │
│ Used colors:                        │
│ [#000] [#FFF] [#FF5733] [#00A]     │
└─────────────────────────────────────┘
```

**Componentes**:
- Input tipo color
- Input texto para valor (hex, rgb, rgba, color name)
- `ColorUsedList` - lista de colores usados en la página
- `MediaQueryIcon`
- `VariableIcon`

**Funcionalidades**:
- Extrae colores usados en el CSS de la página
- Click en un color de la lista lo aplica
- Conversión entre formatos (hex ↔ rgb ↔ rgba)

---

### 12. **ColorUsedList.svelte**
**Responsabilidad**: Lista de colores usados en la página

**Props**:
```typescript
export let targetDocument: Document
export let onColorSelect: (color: string) => void
```

**Estructura Visual**:
```
┌─────────────────────────────────────┐
│ ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● │
└─────────────────────────────────────┘
```

**Funcionalidades**:
- Extrae todos los colores del CSS de la página
- Muestra círculos con los colores
- Click en un color llama a `onColorSelect`

---

### 13. **SpacingPropertyEditor.svelte**
**Responsabilidad**: Editor para margin/padding con opción de lados individuales

**Props**:
```typescript
export let property: 'margin' | 'padding' | 'border-radius'
export let value: string
export let element: HTMLElement
export let selector: string
```

**Estructura Visual (colapsado)**:
```
┌─────────────────────────────────────┐
│ margin: [10] [px ▼]  [📱] [🔧] [⚙️]│
└─────────────────────────────────────┘
```

**Estructura Visual (expandido)**:
```
┌─────────────────────────────────────┐
│ margin: [all]  [📱] [🔧] [⚙️]      │
├─────────────────────────────────────┤
top:     [10] [px ▼]  [📱] [🔧]   │
right:  [10] [px ▼]  [📱] [🔧]   │
bottom: [10] [px ▼]  [📱] [🔧]   │
left:   [10] [px ▼]  [📱] [🔧]   │
└─────────────────────────────────────┘
```

**Funcionalidades**:
- Por defecto muestra input general
- Botón ⚙️ (Lucide `Settings`) despliega opciones por lado
- Cada lado usa `NumericCSSPropertyEditor`
- Si se edita un lado individual, se desactiva el general

---

### 14. **BorderPropertyEditor.svelte**
**Responsabilidad**: Editor completo para border con lados individuales

**Props**:
```typescript
export let property: 'border'
export let value: string
export let element: HTMLElement
export let selector: string
```

**Estructura Visual (colapsado)**:
```
┌─────────────────────────────────────┐
│ border-width:   [2] [px ▼] [⚙️]     │
│ border-style:   [solid ▼]  [⚙️]     │
│ border-color:  [🎨] [#000] [⚙️]    │
└─────────────────────────────────────┘
```

**Estructura Visual (width expandido)**:
```
┌─────────────────────────────────────┐
│ border-width:  [all] [⚙️]          │
├─────────────────────────────────────┤
top:    [2] [px ▼]  [📱] [🔧]    │
right:  [2] [px ▼]  [📱] [🔧]    │
bottom: [2] [px ▼]  [📱] [🔧]    │
left:   [2] [px ▼]  [📱] [🔧]    │
└─────────────────────────────────────┘
```

**Funcionalidades**:
- 3 secciones: width, style, color
- Cada sección tiene botón ⚙️ para expandir lados individuales
- Usa los sub-editores correspondientes (Numeric, Select, Color)

---

### 15. **BorderRadiusPropertyEditor.svelte**
**Responsabilidad**:  Editor para border-radius con esquinas individuales

**Props**:
```typescript
export let property: 'border-radius'
export let value: string
export let element: HTMLElement
export let selector: string
```

**Estructura Visual (colapsado)**:
```
┌─────────────────────────────────────┐
│ border-radius:  [10] [px ▼]  [⚙️]   │
└─────────────────────────────────────┘
```

**Estructura Visual (expandido)**:
```
┌─────────────────────────────────────┐
│ border-radius:  [all]  [⚙️]         │
├─────────────────────────────────────┤
top-left:     [10] [px ▼]        │
top-right:     [10] [px ▼]        │
bottom-right: [10] [px ▼]        │
bottom-left:  [10] [px ▼]        │
└─────────────────────────────────────┘
```

**Funcionalidades**:
- Similar a SpacingPropertyEditor pero para esquinas
- Botón ⚙️ para expandir

---

### 16. **ShadowPropertyEditor.svelte**
**Responsabilidad**: Editor para múltiples sombras (box-shadow)

**Props**:
```typescript
export let property: 'box-shadow'
export let value:  string
export let element: HTMLElement
export let selector: string
```

**Estructura Visual**:
```
┌─────────────────────────────────────┐
│ box-shadow:                          │
                                  │
│ Shadow 1:  [×]                      │
x:       [2] [px ▼]                │
y:      [4] [px ▼]                │
blur:   [6] [px ▼]                │
spread: [0] [px ▼]                │
color:  [🎨] [rgba(0,0,0,0.5)]   │
inset:  [☐]                       │
                                  │
│ Shadow 2:  [×]                      │
...                                │
                                  │
│ [+ Add Shadow]                      │
└─────────────────────────────────────┘
```

**Funcionalidades**:
- Lista de sombras (cada una con `ShadowItemEditor`)
- Botón "Add Shadow" para añadir nueva sombra
- Parsea el valor CSS y crea un array de sombras
- Genera el CSS final concatenando todas las sombras

---

### 17. **ShadowItemEditor.svelte**
**Responsabilidad**: Editor individual para una sombra

**Props**:
```typescript
export let shadow: ShadowConfig
export let onUpdate: (shadow: ShadowConfig) => void
export let onRemove: () => void
```

**Tipos**:
```typescript
interface ShadowConfig {
  x: number
  y: number
  blur: number
  spread:  number
  color: string
  inset: boolean
}
```

**Estructura**:
- 4 inputs numéricos para x, y, blur, spread
- 1 color picker para color
- 1 checkbox para inset
- Botón de eliminar (Lucide `X`)

---

### 18. **FilterPropertyEditor.svelte**
**Responsabilidad**: Editor para la propiedad filter

**Props**:
```typescript
export let property: 'filter'
export let value: string
export let element: HTMLElement
export let selector: string
```

**Estructura Visual**:
```
┌─────────────────────────────────────┐
│ filter: [Blur ▼]                    │
                                  │
│ [====••---------]  [5] px           │
└─────────────────────────────────────┘
```

**Opciones**:
- none
- blur
- grayscale
- sepia
- brightness
- contrast
- saturate
- invert
- hue-rotate
- custom (input de texto libre)

**Funcionalidades**:
- Dropdown para seleccionar tipo de filtro
- Slider + input numérico para el valor
- Input de texto para "custom"

---

## Componentes de UI Reutilizables

### 19. **SliderPopover.svelte**
**Responsabilidad**: Popover con slider que aparece al hacer click en inputs numéricos

**Props**:
```typescript
export let value: number
export let min: number
export let max: number
export let step: number
export let useLogarithmic: boolean = false
export let onInput: (value: number) => void
export let anchorElement: HTMLElement
```

**Estructura Visual**:
```
┌─────────────────────────────┐
│ [====•----------]  [42]     │
└─────────────────────────────┘
```

**Funcionalidades**:
- Se posiciona encima/debajo del input según espacio disponible
- Slider con escala logarítmica opcional
- Muestra el valor actual
- Se cierra al hacer click fuera

---

### 20. **MediaQueryIcon.svelte**
**Responsabilidad**: Icono para aplicar propiedad solo a viewport específico

**Props**:
```typescript
export let property: string
export let currentViewport: 'desktop' | 'tablet' | 'phone'
export let appliedTo: 'desktop' | 'tablet' | 'phone' | 'all' = 'all'
```

**Estructura Visual**:
```
[📱] <- icono que cambia según el viewport aplicado
```

**Funcionalidades**:
- Click abre dropdown con opciones:  Desktop, Tablet, Phone, All
- Icono cambia según viewport aplicado:
    - Desktop:  Lucide `Monitor`
    - Tablet: Lucide `Tablet`
    - Phone: Lucide `Smartphone`
    - All: Lucide `Layers`
- Si está aplicado a viewport específico, envuelve la propiedad en media query

---

### 21. **VariableIcon.svelte**
**Responsabilidad**:  Icono para vincular propiedad a variable CSS

**Props**:
```typescript
export let property: string
export let value:  string
export let onVariableLink: (varName: string) => void
```

**Estructura Visual**:
```
[🔧] <- Lucide `Variable`
```

**Funcionalidades**:
- Click abre modal con lista de variables CSS existentes
- Permite crear nueva variable
- Permite desvincular variable
- Si está vinculada, el icono se resalta

---

### 22. **IconButton.svelte**
**Responsabilidad**: Botón reutilizable con icono de Lucide

**Props**:
```typescript
export let icon: LucideIcon
export let title: string
export let onClick: () => void
export let variant: 'default' | 'primary' | 'danger' = 'default'
export let size: 'sm' | 'md' | 'lg' = 'md'
```

---

### 23. **IconDropdown.svelte**
**Responsabilidad**: Dropdown activado por icono

**Props**:
```typescript
export let icon: LucideIcon
export let options: Array<{ value: string, label: string, icon?:  LucideIcon }>
export let onSelect: (value: string) => void
export let selectedValue: string
```

---

### 24. **DependencyWarning.svelte**
**Responsabilidad**: Muestra advertencia cuando una dependencia no se cumple

**Props**:
```typescript
export let dependency: PropertyDependency
export let currentValue: string
```

**Estructura Visual**:
```
┌─────────────────────────────────────┐
│ ⚠️ This property only applies when  │
 display is flex or inline-flex   │
└─────────────────────────────────────┘
```

---

## Sistemas de Gestión

### 25. **MediaQueryManager.svelte**
**Responsabilidad**: Gestiona las media queries del CSS generado

**Store**:  `mediaQueryStore`

**Funcionalidades**:
- Agrupa propiedades por viewport
- Genera media queries automáticamente:
  ```css
  @media (max-width: 768px) { ... }
  @media (max-width: 480px) { ... }
  ```
- Parsea CSS existente con media queries

---

### 26. **CSSVariablesPanel.svelte**
**Responsabilidad**: Panel de gestión de variables CSS

**Estructura Visual**:
```
┌─────────────────────────────────────┐
│ CSS Variables                       │
├─────────────────────────────────────┤
│ --primary-color: #FF5733  [×] [✎]  │
│ --spacing-md: 16px        [×] [✎]  │
│ --font-size-lg: 18px      [×] [✎]  │
                                  │
│ [+ New Variable]                    │
└─────────────────────────────────────┘
```

**Funcionalidades**:
- Lista de variables CSS definidas
- Crear nueva variable
- Editar variable
- Eliminar variable
- Detecta variables usadas en la página

---

## Flujo de Datos

### Stores Centralizados

#### **cssStore. ts**
```typescript
interface CSSState {
  selector: string
  properties: Record<string, string>
  originalProperties: Record<string, string>
  modifiedProperties: Set<string>
}

export const cssStore = writable<CSSState>({
  selector: '',
  properties:  {},
  originalProperties: {},
  modifiedProperties: new Set()
})

// Métodos
export function updateProperty(property: string, value: string)
export function resetProperty(property: string)
export function resetAll()
export function generateCSS(): string
```

#### **viewportStore.ts**
```typescript
export const viewportStore = writable<'desktop' | 'tablet' | 'phone'>('desktop')
```

#### **mediaQueryStore.ts**
```typescript
interface MediaQueryState {
  desktop: Record<string, string>
  tablet: Record<string, string>
  phone: Record<string, string>
}

export const mediaQueryStore = writable<MediaQueryState>({
  desktop: {},
  tablet: {},
  phone:  {}
})

export function setPropertyForViewport(viewport, property, value)
export function generateMediaQueryCSS(): string
```

#### **variablesStore.ts**
```typescript
interface CSSVariable {
  name: string
  value: string
  usedBy: string[] // propiedades que usan esta variable
}

export const variablesStore = writable<CSSVariable[]>([])

export function createVariable(name: string, value:  string)
export function updateVariable(name: string, value:  string)
export function deleteVariable(name: string)
export function linkPropertyToVariable(property: string, varName: string)
```

#### **uiStore.ts**
```typescript
interface UIState {
  collapsedGroups: Set<string>
  panelWidth: number
  panelHeight: number
  panelPosition: 'left' | 'right' | 'top' | 'bottom'
}

export const uiStore = writable<UIState>({
  collapsedGroups: new Set(),
  panelWidth: 400,
  panelHeight: 600,
  panelPosition: 'right'
})
```

---

## Detalles Visuales Importantes

### Aspecto del Panel Original

1. **Panel Anclado Derecha (por defecto)**:
    - Fondo blanco con sombra
    - Borde izquierdo con barra de drag (gris claro)
    - Scroll vertical interno
    - Ancho redimensionable (300-800px)

2. **Tarjetas de Propiedades**:
    - Fondo gris muy claro (#f8f9fa)
    - Borde redondeado (8px)
    - Margen entre tarjetas (12px)
    - Header con padding (12px)
    - Transición suave al colapsar

3. **Inputs**:
    - Inputs numéricos:  ancho 60px, alineados a la derecha
    - Selects de unidad: ancho 60px
    - Color pickers: cuadrado 32x32px
    - Todos con borde sutil y border-radius 4px

4. **Iconos**:
    - Tamaño:  16px
    - Color: gris (#6c757d)
    - Hover: color primario (#007bff)
    - Spacing: 8px entre iconos

5. **Punto de Modificación**:
    - Círculo de 6px
    - Color: azul (#007bff)
    - Positioned absolutamente a la izquierda del título

---

## Notas de Implementación

### Prioridades de Migración

**Fase 1** (Core):
1. CSSEditor. svelte
2. EditorPanel.svelte
3. PanelHeader.svelte
4. SelectorEditor.svelte
5. cssStore

**Fase 2** (Propiedades Básicas):
6. PropertyGroups.svelte
7. PropertyCard.svelte
8. CSSPropertyEditor.svelte
9. NumericCSSPropertyEditor.svelte
10. SelectCSSPropertyEditor.svelte
11. ColorCSSPropertyEditor. svelte

**Fase 3** (Propiedades Avanzadas):
12. SpacingPropertyEditor.svelte
13. BorderPropertyEditor.svelte
14. BorderRadiusPropertyEditor.svelte
15. ShadowPropertyEditor.svelte
16. ShadowItemEditor.svelte
17. FilterPropertyEditor.svelte

**Fase 4** (Features Avanzados):
18. SliderPopover.svelte
19. MediaQueryManager.svelte
20. mediaQueryStore
21. ViewportModeButtons.svelte
22. MediaQueryIcon.svelte

**Fase 5** (Variables CSS):
23. CSSVariablesPanel.svelte
24. variablesStore
25. VariableIcon.svelte

---

## Consideraciones Técnicas

### Manejo de Estilos
- Usar SCSS modules o `<style>` scoped en cada componente
- Importar variables globales de colores/tamaños
- Mantener consistencia con el diseño original

### Accesibilidad
- Labels para todos los inputs
- Aria-labels para iconos
- Keyboard navigation en dropdowns
- Focus visible

### Performance
- Debounce en inputs para evitar updates excesivos
- Virtual scrolling si hay muchas propiedades
- Lazy loading de paneles colapsados

### Testing
- Unit tests para utils (parser, generator, etc)
- Component tests para editores individuales
- Integration tests para flujo completo

---

## Referencias Visuales del Código Original

### Localización en `editor-panel.ts`:

- **Redimensionado del panel**:  Líneas ~500-600
- **Generación de tarjetas colapsables**: Líneas ~1000-1200
- **Creación de inputs numéricos**: Líneas ~1500-1700
- **Sistema de media queries**: Líneas ~2000-2200
- **Gestión de variables CSS**: Líneas ~2500-2700
- **Slider popover**: Líneas ~1800-2000
- **Shadow editor**: Líneas ~3000-3200

---

## Checklist de Funcionalidades

### ✅ Debe Mantener:
- [ ] Redimensionamiento del panel
- [ ] Anclaje a cualquier lado
- [ ] Tarjetas colapsables sin chevron
- [ ] Punto de modificación visible
- [ ] Inputs numéricos con slider popover
- [ ] Escala logarítmica en sliders grandes
- [ ] Editor de selector CSS editable
- [ ] Múltiples sombras (box-shadow)
- [ ] Border con lados individuales
- [ ] Padding/Margin con lados individuales
- [ ] Border-radius con esquinas individuales
- [ ] Media queries para tablet/phone
- [ ] Variables CSS vinculables
- [ ] Lista de colores usados
- [ ] Filtros con dropdown y slider
- [ ] Guardar/Cargar CSS
- [ ] Copiar al portapapeles
- [ ] Multiidioma (EN/ES)
- [ ] Modo iframe para responsive

### 🎨 Mejoras en Svelte:
- Reactividad nativa en lugar de listeners manuales
- Stores centralizados en lugar de estado interno
- Componentes reutilizables y modulares
- Transiciones Svelte nativas
- Mejor gestión de memoria
- Código más declarativo y legible

---

**Este documento debe servir como fuente única de verdad para la migración a Svelte.**
