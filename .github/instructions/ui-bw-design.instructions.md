---
applyTo: "**/*.component.ts,**/*.component.html,**/*.component.css,**/styles.css"
---

# Design System — Minimalist Black & White Abstract Elegance

## Tokens de color (CSS custom properties)

Define estos tokens en `styles.css` y úsalos siempre — nunca hardcodees colores.

```css
:root {
  /* Base */
  --ink:        #0a0a0a;   /* negro profundo — textos principales */
  --ink-muted:  #4a4a4a;   /* gris oscuro — textos secundarios */
  --ink-ghost:  #9a9a9a;   /* gris medio — placeholders, disabled */
  --paper:      #f8f8f6;   /* blanco cálido — fondo principal */
  --paper-soft: #f0efec;   /* off-white — fondo de cards/surfaces */
  --paper-dim:  #e8e7e3;   /* gris muy claro — borders, dividers */

  /* Acento (cambiá este valor por proyecto, solo este) */
  --accent:     #c8a96e;   /* dorado elegante — default */
  --accent-dim: #e8d5a8;   /* acento claro — hover states */

  /* Tipografía */
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body:    'DM Sans', system-ui, sans-serif;
  --font-mono:    'DM Mono', 'Courier New', monospace;

  /* Espaciado base */
  --space-xs:  0.25rem;
  --space-sm:  0.5rem;
  --space-md:  1rem;
  --space-lg:  2rem;
  --space-xl:  4rem;
  --space-2xl: 8rem;

  /* Bordes */
  --radius-sm: 2px;
  --radius-md: 6px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Sombras — solo en negro, sin color */
  --shadow-sm: 0 1px 3px rgba(10,10,10,0.08);
  --shadow-md: 0 4px 16px rgba(10,10,10,0.10);
  --shadow-lg: 0 12px 40px rgba(10,10,10,0.14);
  --shadow-sharp: 4px 4px 0px var(--ink); /* sombra brutalista */
}
```

---

## Tipografía

Importar siempre en `styles.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
```

**Jerarquía:**

| Uso | Font | Weight | Size |
|-----|------|--------|------|
| Títulos hero | `var(--font-display)` | 700 | clamp(2.5rem, 6vw, 5rem) |
| Títulos sección | `var(--font-display)` | 600 | clamp(1.5rem, 3vw, 2.5rem) |
| Subtítulos | `var(--font-body)` | 500 | 1.125rem |
| Cuerpo | `var(--font-body)` | 300 | 1rem |
| Labels / caps | `var(--font-body)` | 500 | 0.75rem, letter-spacing: 0.15em, uppercase |
| Código / datos | `var(--font-mono)` | 400 | 0.875rem |

---

## Componentes — patrones estándar

### Cards

```html
<div class="group relative overflow-hidden"
     style="background: var(--paper-soft);
            border: 1px solid var(--paper-dim);
            border-radius: var(--radius-md);
            padding: var(--space-lg);
            transition: box-shadow 0.3s ease, transform 0.3s ease;">
  <!-- Línea de acento superior — siempre presente en cards importantes -->
  <div style="position:absolute; top:0; left:0; right:0; height:2px;
              background: var(--ink); transform: scaleX(0);
              transition: transform 0.3s ease; transform-origin: left;"
       class="group-hover:scale-x-100">
  </div>

  <!-- Label categoría -->
  <span style="font-family: var(--font-body); font-size: 0.75rem;
               letter-spacing: 0.15em; text-transform: uppercase;
               color: var(--ink-ghost); font-weight: 500;">
    Categoría
  </span>

  <!-- Título -->
  <h3 style="font-family: var(--font-display); font-weight: 600;
             color: var(--ink); margin-top: var(--space-sm);">
    Título del card
  </h3>

  <!-- Cuerpo -->
  <p style="font-family: var(--font-body); font-weight: 300;
            color: var(--ink-muted); margin-top: var(--space-sm);
            line-height: 1.7;">
    Descripción
  </p>
</div>
```

### Botones

```html
<!-- Primario: fondo negro, texto blanco -->
<button style="background: var(--ink); color: var(--paper);
               font-family: var(--font-body); font-weight: 500;
               font-size: 0.875rem; letter-spacing: 0.08em;
               padding: 0.75rem 2rem; border: none;
               border-radius: var(--radius-sm); cursor: pointer;
               transition: opacity 0.2s ease;">
  Acción principal
</button>

<!-- Secundario: outline elegante -->
<button style="background: transparent; color: var(--ink);
               border: 1px solid var(--ink);
               font-family: var(--font-body); font-weight: 500;
               font-size: 0.875rem; letter-spacing: 0.08em;
               padding: 0.75rem 2rem; cursor: pointer;
               transition: background 0.2s ease, color 0.2s ease;">
  Acción secundaria
</button>

<!-- Ghost: solo texto con guión decorativo -->
<button style="background: none; border: none; color: var(--ink);
               font-family: var(--font-body); font-weight: 500;
               cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
  <span style="display:inline-block; width:1.5rem; height:1px;
               background: var(--ink); transition: width 0.3s ease;"></span>
  Ver más
</button>
```

### Inputs / Forms

```html
<div style="position: relative;">
  <label style="font-family: var(--font-body); font-size: 0.75rem;
                letter-spacing: 0.12em; text-transform: uppercase;
                color: var(--ink-ghost); font-weight: 500;
                display: block; margin-bottom: var(--space-xs);">
    Campo
  </label>
  <input style="width: 100%; background: transparent;
                border: none; border-bottom: 1px solid var(--paper-dim);
                padding: var(--space-sm) 0;
                font-family: var(--font-body); font-size: 1rem;
                color: var(--ink); outline: none;
                transition: border-color 0.2s ease;"
         placeholder="Texto de ejemplo" />
  <!-- Línea de foco animada -->
  <div style="position:absolute; bottom:0; left:0; width:0; height:1px;
              background: var(--ink); transition: width 0.3s ease;"
       class="focus-line">
  </div>
</div>
```

---

## Elementos decorativos abstractos

Usá estos elementos para dar carácter sin agregar ruido visual:

```html
<!-- Círculo de fondo — decoración sutil -->
<div style="position:absolute; width:300px; height:300px; border-radius:50%;
            border: 1px solid var(--paper-dim); opacity:0.5;
            pointer-events:none; top:-100px; right:-100px;">
</div>

<!-- Línea decorativa diagonal -->
<div style="width:100%; height:1px; background: linear-gradient(
            90deg, transparent 0%, var(--paper-dim) 30%, var(--paper-dim) 70%, transparent 100%);
            margin: var(--space-xl) 0;">
</div>

<!-- Grid de puntos como textura de fondo -->
<div style="position:absolute; inset:0; pointer-events:none; opacity:0.03;
            background-image: radial-gradient(var(--ink) 1px, transparent 1px);
            background-size: 24px 24px;">
</div>

<!-- Número grande decorativo (para sections numeradas) -->
<span style="font-family: var(--font-display); font-size: clamp(6rem, 15vw, 12rem);
             font-weight:700; color: var(--paper-dim); line-height:1;
             position:absolute; top:-1rem; left:-1rem; pointer-events:none;
             user-select:none;">
  01
</span>
```

---

## Animaciones estándar

```css
/* Entrada suave — aplicar a cualquier elemento que aparece */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Línea que se expande — para underlines y separadores */
@keyframes expandLine {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}

/* Parpadeo sutil — para cursores o elementos de atención */
@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

/* Uso estándar */
.animate-in {
  animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

---

## Lo que NUNCA generar

- Gradientes de colores (purple-to-pink, blue-to-teal, etc.)
- Íconos de emoji como decoración
- Sombras de color (box-shadow con color)
- Bordes redondeados excesivos (> 12px en containers)
- Fondos oscuros con texto de colores neón
- Cards con imagen + gradiente overlay como hero
- Tipografía genérica: Inter, Roboto, Arial, system-ui como fuente principal
- Layouts centrados y simétricos sin intención — buscar asimetría controlada
