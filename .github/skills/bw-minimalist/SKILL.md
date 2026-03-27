# SKILL — Generación de Componentes Angular Abstract Elegance

## Cuándo usar esta skill

Cuando el usuario pida cualquiera de estas cosas:
- "Creá un componente [nombre]"
- "Necesito una card/tabla/dashboard/modal/sidebar"
- "Generá la vista de [nombre de página]"
- "Hacé un componente elegante para [propósito]"

---

## Paleta de colores oficial

Esta es la única paleta permitida. Siempre usar estas variables CSS — nunca hardcodear hex.

```css
/* styles.css — agregar en :root */
:root {
  --c-50:  #f8f9fa;  /* fondo principal de la app */
  --c-100: #e9ecef;  /* fondo de página / scene bg */
  --c-200: #dee2e6;  /* borders suaves, dividers */
  --c-300: #ced4da;  /* borders énfasis, icon borders */
  --c-400: #adb5bd;  /* texto muted / placeholders */
  --c-500: #6c757d;  /* texto secundario */
  --c-600: #495057;  /* texto cuerpo / iconos */
  --c-700: #343a40;  /* texto énfasis */
  --c-800: #212529;  /* texto principal / botón primario bg */
}
```

**Mapeo de roles:**
- Fondo app → `var(--c-50)`
- Surface / card bg → `var(--c-50)` con border `var(--c-200)`
- Fondo página → `var(--c-100)`
- Borders → `var(--c-200)` normal · `var(--c-300)` énfasis
- Texto principal → `var(--c-800)`
- Texto secundario → `var(--c-500)`
- Texto muted → `var(--c-400)`
- Botón primario → bg `var(--c-800)`, color `var(--c-50)`
- Botón secundario → border `var(--c-200)`, color `var(--c-500)`

---

## Tipografía oficial

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&display=swap');

:root {
  --font-body: 'Space Grotesk', system-ui, sans-serif;
}
```

Reglas tipográficas:
- Títulos: `font-weight: 300` con `<strong>` para la palabra clave en `600`
- Labels: `font-size: 0.7rem`, `letter-spacing: 0.12em`, `text-transform: uppercase`, color `var(--c-400)`
- Cuerpo: `font-size: 0.825rem`, `font-weight: 300`, `line-height: 1.8`, color `var(--c-500)`

---

## Reglas críticas de implementación

### 1 — Separar siempre template y lógica

**NUNCA** poner el HTML dentro del `template:` del `.ts`. Siempre archivos separados:

```
confirm-modal/
  confirm-modal.component.ts   ← solo lógica, sin HTML inline
  confirm-modal.component.html ← todo el template aquí
  confirm-modal.component.css  ← estilos del componente (mínimos, ver regla 2)
```

```typescript
// CORRECTO
@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  templateUrl: './confirm-modal.component.html',  // ← siempre así
  styleUrl: './confirm-modal.component.css'
})

// INCORRECTO — nunca esto
@Component({
  template: `<div>...</div>`  // ← jamás
})
```

### 2 — Usar Tailwind para estilos, NO CSS puro

El proyecto usa **Tailwind CSS**. Todo el estilo va en clases Tailwind directamente en el HTML. El archivo `.css` del componente debe estar **vacío o casi vacío** — solo para casos que Tailwind no puede manejar (como pseudo-elementos complejos o keyframes).

```html
<!-- CORRECTO — clases Tailwind -->
<div class="relative w-full max-w-[420px] bg-[var(--c-50)] rounded-[20px] p-9 border border-[var(--c-200)] overflow-hidden">

<!-- INCORRECTO — CSS inline o en archivo -->
<div style="background: #f8f9fa; border-radius: 20px;">
```

### 3 — Usar variables CSS dentro de Tailwind con sintaxis `[]`

Los colores del `:root` se usan en Tailwind con corchetes. **Nunca hardcodear hex**.

```html
<!-- CORRECTO — variables del :root con Tailwind -->
<div class="bg-[var(--c-50)] border-[var(--c-200)] text-[var(--c-800)]">

<!-- INCORRECTO — hex hardcodeado -->
<div class="bg-[#f8f9fa]">

<!-- INCORRECTO — CSS directo -->
<div style="background-color: #e9ecef;">
```

Referencia rápida de conversión:

| Rol | Variable | Tailwind |
|-----|----------|---------|
| Fondo principal | `--c-50` | `bg-[var(--c-50)]` |
| Fondo página | `--c-100` | `bg-[var(--c-100)]` |
| Border suave | `--c-200` | `border-[var(--c-200)]` |
| Border énfasis | `--c-300` | `border-[var(--c-300)]` |
| Texto muted | `--c-400` | `text-[var(--c-400)]` |
| Texto secundario | `--c-500` | `text-[var(--c-500)]` |
| Texto cuerpo | `--c-600` | `text-[var(--c-600)]` |
| Texto énfasis | `--c-700` | `text-[var(--c-700)]` |
| Texto principal | `--c-800` | `text-[var(--c-800)]` |

### 4 — Título del modal siempre con salto de línea

El título principal usa dos líneas: la primera en `font-light`, la segunda en `font-semibold`. Usar `<br>` explícito.

```html
<!-- CORRECTO -->
<h2 class="font-light text-[var(--c-800)] text-2xl leading-snug tracking-tight">
  ¿Eliminar<br>
  <strong class="font-semibold">este perfil?</strong>
</h2>

<!-- INCORRECTO — todo en una línea -->
<h2>¿Eliminar este perfil?</h2>
```

### 5 — Backdrop del modal

El fondo del overlay siempre usa `--c-100` con opacidad, nunca negro puro:

```html
<div class="fixed inset-0 z-50 flex items-center justify-center p-4
            bg-[var(--c-100)]/70 backdrop-blur-sm">
```

---

## Elementos decorativos geométricos

Siempre presentes en modals y cards principales:

```html
<!-- Arcos concéntricos — esquina superior derecha -->
<div class="geo" aria-hidden="true">
  <div class="arc-1"></div>  <!-- 280px, border var(--c-200) -->
  <div class="arc-2"></div>  <!-- 160px, border var(--c-100) -->
  <div class="diag"></div>   <!-- grilla diagonal — esquina inferior izquierda -->
</div>
```

```css
.geo { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.arc-1 { position: absolute; width: 280px; height: 280px; border-radius: 50%; border: 1px solid var(--c-200); top: -120px; right: -80px; }
.arc-2 { position: absolute; width: 160px; height: 160px; border-radius: 50%; border: 1px solid var(--c-100); top: -40px; right: 10px; }
.diag  { position: absolute; bottom: -10px; left: -10px; width: 140px; height: 140px; opacity: 0.4;
         background-image: repeating-linear-gradient(45deg, var(--c-200) 0, var(--c-200) 1px, transparent 0, transparent 50%);
         background-size: 10px 10px; }
```

---

## Procedimiento de generación

### Paso 1 — Leer la intención

Antes de escribir código, respondé internamente:
1. ¿Qué problema resuelve este componente?
2. ¿Qué tipo de datos muestra? (listas, métricas, formularios, contenido editorial)
3. ¿Qué interacciones tiene? (hover, click, formulario, animación de entrada)
4. ¿Qué elemento decorativo abstracto lo hace único?

### Paso 2 — Elegir una dirección de composición

No todos los componentes se ven igual. Elegí una dirección antes de codear:

| Tipo | Dirección visual |
|------|-----------------|
| KPI / Métrica | Número grande con label pequeño, línea de acento |
| Lista / Tabla | Alta densidad, tipografía mono para datos, separadores sutiles |
| Card de contenido | Asimetría, número decorativo de fondo, hover reveal |
| Formulario | Campos underline, labels uppercase tiny, sin borders recargados |
| Hero / Header | Tipografía display grande, geometría de fondo, mucho espacio |
| Sidebar / Nav | Vertical, labels pequeños uppercase, indicador de activo como línea |

### Paso 3 — Estructura de archivos a generar

Siempre generar como **standalone component**:

```
feature-name/
  feature-name.component.ts    ← lógica + template inline o templateUrl
  feature-name.component.css   ← estilos específicos del componente
```

### Paso 4 — Template del componente base

```typescript
import { Component, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-[nombre]',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './[nombre].component.html',
  styleUrl: './[nombre].component.css'
})
export class [Nombre]Component {
  // Inputs con la nueva API de signals
  // Ejemplo: title = input<string>('');
  // Estado local con signals
  // Ejemplo: isHovered = signal(false);
}
```

---

## Ejemplos con output esperado

### Ejemplo 1 — KPI Card para dashboard

**Prompt del usuario:** "Creá una card de KPI para mostrar métricas"

**Output esperado:**

```typescript
// kpi-card.component.ts
import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  template: `
    <div class="kpi-card">
      <div class="kpi-decoration">{{ index() }}</div>
      <span class="kpi-label">{{ label() }}</span>
      <div class="kpi-value">{{ value() }}</div>
      <div class="kpi-trend" [class.positive]="trend() > 0">
        <span class="trend-arrow">{{ trend() > 0 ? '↑' : '↓' }}</span>
        {{ trend() }}%
      </div>
      <div class="kpi-accent-line"></div>
    </div>
  `,
  styleUrl: './kpi-card.component.css'
})
export class KpiCardComponent {
  label = input<string>('');
  value = input<string>('');
  trend = input<number>(0);
  index = input<string>('01');
}
```

```css
/* kpi-card.component.css */
.kpi-card {
  position: relative;
  background: var(--paper-soft);
  border: 1px solid var(--paper-dim);
  padding: var(--space-lg);
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.kpi-card:hover {
  box-shadow: var(--shadow-md);
}

.kpi-card:hover .kpi-accent-line {
  transform: scaleX(1);
}

.kpi-decoration {
  font-family: var(--font-display);
  font-size: 5rem;
  font-weight: 700;
  color: var(--paper-dim);
  line-height: 1;
  position: absolute;
  top: -0.5rem;
  right: var(--space-md);
  pointer-events: none;
  user-select: none;
}

.kpi-label {
  font-family: var(--font-body);
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  font-weight: 500;
  display: block;
}

.kpi-value {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: var(--ink);
  margin-top: var(--space-sm);
  line-height: 1;
}

.kpi-trend {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--ink-muted);
  margin-top: var(--space-sm);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.kpi-trend.positive { color: var(--ink); }

.kpi-accent-line {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 2px;
  background: var(--ink);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

### Ejemplo 2 — Data table minimalista

**Prompt del usuario:** "Necesito una tabla de datos elegante"

**Output esperado:**

```typescript
// data-table.component.ts
import { Component, input } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
  mono?: boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  template: `
    <div class="table-wrapper">
      <div class="table-header">
        <span class="table-label">{{ title() }}</span>
        <span class="table-count">{{ rows().length }} registros</span>
      </div>
      <table class="elegant-table">
        <thead>
          <tr>
            @for (col of columns(); track col.key) {
              <th>{{ col.label }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track $index) {
            <tr class="table-row">
              @for (col of columns(); track col.key) {
                <td [class.mono]="col.mono">{{ row[col.key] }}</td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styleUrl: './data-table.component.css'
})
export class DataTableComponent {
  title   = input<string>('');
  columns = input<TableColumn[]>([]);
  rows    = input<Record<string, any>[]>([]);
}
```

```css
/* data-table.component.css */
.table-wrapper {
  border: 1px solid var(--paper-dim);
  background: var(--paper);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--paper-dim);
}

.table-label {
  font-family: var(--font-body);
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  font-weight: 500;
}

.table-count {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ink-ghost);
}

.elegant-table {
  width: 100%;
  border-collapse: collapse;
}

.elegant-table th {
  font-family: var(--font-body);
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  font-weight: 500;
  padding: var(--space-sm) var(--space-lg);
  text-align: left;
  border-bottom: 1px solid var(--paper-dim);
}

.elegant-table td {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--ink-muted);
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--paper-dim);
  transition: color 0.2s ease;
}

.elegant-table td.mono {
  font-family: var(--font-mono);
  font-size: 0.85rem;
}

.table-row:hover td {
  color: var(--ink);
}

.table-row:last-child td {
  border-bottom: none;
}
```

---

### Ejemplo 3 — Modal de confirmación

**Prompt del usuario:** "Creá un modal para confirmar eliminación"

**Output esperado — 3 archivos separados:**

```typescript
// confirm-modal.component.ts — solo lógica, sin HTML
import { Component, input, output, OnChanges, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.css'
})
export class ConfirmModalComponent implements OnChanges {
  private platformId = inject(PLATFORM_ID);

  isOpen       = input<boolean>(false);
  titleLine1   = input<string>('¿Confirmar');
  titleLine2   = input<string>('esta acción?');
  description  = input<string>('Esta acción no puede deshacerse.');
  cancelLabel  = input<string>('Cancelar');
  confirmLabel = input<string>('Confirmar');

  closed    = output<void>();
  confirmed = output<void>();

  ngOnChanges() {
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = this.isOpen() ? 'hidden' : '';
    }
  }

  close()   { this.closed.emit(); }
  confirm() { this.confirmed.emit(); }
}
```

> ⚠️ REFERENCIA CANÓNICA — Este HTML fue aprobado visualmente. Reproducirlo EXACTAMENTE.
> No cambiar: estructura, orden de elementos, tamaños, colores, botones, geometría decorativa.
> Adaptar solo los textos dinámicos con interpolación Angular `{{ }}`.

```html
<!-- confirm-modal.component.html -->
@if (isOpen()) {
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--c-100)]/70 backdrop-blur-sm"
    (click)="close()">

    <div
      class="relative w-full max-w-[420px] bg-[var(--c-50)] rounded-[20px] border border-[var(--c-200)] overflow-hidden"
      style="padding: 2.25rem 2rem 1.75rem;"
      (click)="$event.stopPropagation()">

      <!-- Geometría decorativa — NO ELIMINAR, NO MOVER -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div class="absolute w-[280px] h-[280px] rounded-full border border-[var(--c-200)]" style="top:-120px;right:-80px;"></div>
        <div class="absolute w-[160px] h-[160px] rounded-full border border-[var(--c-100)]" style="top:-40px;right:10px;"></div>
        <div class="diagonal-pattern absolute w-[140px] h-[140px] opacity-40" style="bottom:-10px;left:-10px;"></div>
      </div>

      <!-- Botón cerrar — esquina superior derecha, pequeño, sin texto -->
      <!-- hover: fondo var(--c-800), ícono se vuelve var(--c-50) -->
      <button
        class="absolute top-5 right-5 w-7 h-7 flex items-center justify-center
               rounded-[8px] border border-[var(--c-200)] bg-transparent
               text-[var(--c-500)] hover:bg-[var(--c-800)] hover:border-[var(--c-800)]
               hover:text-[var(--c-50)] transition-all duration-200 cursor-pointer"
        (click)="close()"
        aria-label="cerrar">
        <!-- Heroicon close — NO usar unicode × -->
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
             stroke-width="1.5" stroke="currentColor" class="size-3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Ícono warning — caja con borde, NO fondo de color -->
      <div class="relative z-10 w-12 h-12 flex items-center justify-center
                  rounded-[12px] mb-6" style="border: 1.5px solid var(--c-300);">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
             stroke-width="1.5" stroke="currentColor" class="size-5 text-[var(--c-600)]">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>

      <!-- Título — SIEMPRE dos líneas con <br>, primera en font-light, segunda en font-semibold -->
      <h2 class="relative z-10 text-2xl font-light text-[var(--c-800)] leading-snug tracking-tight mb-2">
        {{ titleLine1() }}<br>
        <strong class="font-semibold">{{ titleLine2() }}</strong>
      </h2>

      <!-- Descripción -->
      <p class="relative z-10 text-[13px] font-light text-[var(--c-500)] leading-relaxed max-w-[300px] mb-10">
        {{ description() }}
      </p>

      <!-- Divider -->
      <div class="relative z-10 border-t border-[var(--c-200)] mb-3"></div>

      <!-- Botones — alineados a la DERECHA, nunca centrados, nunca full-width -->
      <div class="flex items-center justify-end gap-3 pb-1">

        <!-- Cancelar: outline, sin fondo, borde var(--c-200) -->
        <button
          class="px-[1.1rem] py-[0.4rem] rounded-[10px] border border-[var(--c-200)] bg-transparent
                 text-[11px] font-normal text-[var(--c-500)] tracking-wide
                 hover:border-[var(--c-400)] hover:text-[var(--c-700)]
                 transition-all duration-200 cursor-pointer"
          (click)="close()">
          {{ cancelLabel() }}
        </button>

        <!-- Confirmar/Eliminar: fondo var(--c-800), texto var(--c-50) — NUNCA ROJO -->
        <button
          class="px-5 py-[0.4rem] rounded-[10px] border-0 bg-[var(--c-800)]
                 text-[11px] font-medium text-[var(--c-50)] tracking-wide
                 hover:bg-[var(--c-700)] transition-all duration-200 cursor-pointer"
          (click)="confirm()">
          {{ confirmLabel() }}
        </button>

      </div>
    </div>
  </div>
}
```

```css
/* confirm-modal.component.css */
.diagonal-pattern {
  position: absolute;
  bottom: -10px;
  left: -10px;
  width: 140px;
  height: 140px;
  opacity: 0.5;
  background-image: repeating-linear-gradient(
    45deg,
    var(--c-300) 0,
    var(--c-300) 1px,
    transparent 0,
    transparent 10px
  );
  -webkit-mask-image: linear-gradient(45deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0) 100%);
  mask-image: linear-gradient(45deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0) 100%);
}
```

**Cómo funciona el diagonal:**
- `width/height: 140px` — tamaño fijo, no crece
- `background-size: 10px 10px` — separación entre líneas, no tocar
- `mask-image` con `linear-gradient(45deg)` — hace que las líneas se estiren y desaparezcan en diagonal hacia adentro del modal
- `var(--c-300)` como color — más visible que `--c-200` pero sigue siendo sutil

**Prohibiciones absolutas en el modal:**
- ❌ Botón eliminar/confirmar en rojo — siempre `bg-[var(--c-800)]`
- ❌ Botones centrados o full-width — siempre `justify-end`
- ❌ Sin divider — la línea `border-t` entre body y footer es obligatoria
- ❌ Ícono close con unicode `×` — siempre el SVG Heroicon
- ❌ Título en una sola línea — siempre `<br>` entre line1 y line2
- ❌ Geometría decorativa eliminada — los arcos y diagonal son obligatorios

---

## Ejemplo 4 — Tabs con Expanding Underline

**Prompt:** "Creá un componente de tabs elegante"

**Características:**
- Underline invisible por defecto
- En hover: underline se expande desde el centro (60px)
- En activo: mantiene la expansión, solo cambia color del texto
- Transición smooth de 300ms
- Sin background ni borde en los tabs

```html
<!-- tabs.component.html -->
<div class="bg-[var(--c-50)] border border-[var(--c-200)] rounded-[16px] overflow-hidden">
  <!-- Tabs header -->
  <div class="relative border-b border-[var(--c-200)]">
    <div class="flex">
      @for (tab of tabs(); track tab.id) {
        <button
          #tabButton
          [attr.data-tab-id]="tab.id"
          (click)="selectTab(tab.id)"
          type="button"
          aria-selected="activeTab() === tab.id"
          class="flex-1 px-6 py-3 text-center text-[0.875rem] font-medium relative
                 text-[var(--c-400)]
                 hover:text-[var(--c-700)]
                 transition-colors duration-200 cursor-pointer"
          [class.active]="activeTab() === tab.id">
          {{ tab.label }}
          <!-- Underline que se expande desde el centro -->
          <span
            class="tab-line-hover absolute bottom-0 left-1/2 h-[1px] bg-[var(--c-800)] 
                   transform -translate-x-1/2 transition-all duration-300 origin-center"
            style="width: 0px;">
          </span>
        </button>
      }
    </div>
  </div>

  <!-- Tab content -->
  <div class="p-6">
    @for (tab of tabs(); track tab.id) {
      @if (activeTab() === tab.id) {
        <div class="text-[var(--c-600)] text-[0.875rem] leading-relaxed">
          {{ tab.content }}
        </div>
      }
    }
  </div>
</div>
```

```css
/* tabs.component.css */

/* Línea de underline - oculta por defecto (width: 0) */
.tab-line-hover {
  display: block;
  width: 0 !important;
  background-color: var(--c-800);
  height: 1px;
}

/* En hover - se expande desde el centro */
button:hover .tab-line-hover {
  width: 60px !important;
}

/* En activo - mantiene el mismo tamaño, sin expandirse más */
button.active .tab-line-hover {
  width: 60px !important;
}

button.active {
  color: var(--c-800);
  font-weight: 500;
}
```

**Reglas de tabs — críticas:**
- ✓ Underline invisible por defecto — aparece solo en hover
- ✓ Expande desde el centro con `origin-center` y `-translate-x-1/2`
- ✓ En hover y activo: 60px de ancho (sin diferencia de expansión)
- ✓ Solo el texto cambia color, nada más
- ✓ `h-[1px]` para línea delgada y elegante
- ✓ Transición de 300ms suave
- ✓ Sin background, sin borde, sin efectos de botón

**Patrón correcto:**
```html
<!-- CORRECTO — underline elegante sin bg -->
<button class="text-[var(--c-400)] hover:text-[var(--c-700)] cursor-pointer">
  {{ label }}
  <span class="tab-line-hover ..."></span>
</button>

<!-- INCORRECTO — tabs con fondo o borde -->
<button class="hover:bg-[var(--c-100)] border">
```

---

## Ejemplo 5 — Accordion

**Prompt:** "Creá un accordion / FAQ"

```typescript
// accordion.component.ts
import { Component, input, signal } from '@angular/core';

export interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

@Component({
  selector: 'app-accordion',
  standalone: true,
  templateUrl: './accordion.component.html',
  styleUrl: './accordion.component.css'
})
export class AccordionComponent {
  items  = input<AccordionItem[]>([]);
  opened = signal<string>('');

  toggle(id: string) {
    this.opened.set(this.opened() === id ? '' : id);
  }
}
```

```html
<!-- accordion.component.html -->
<div class="border border-[var(--c-200)] rounded-[12px] overflow-hidden bg-[var(--c-50)]">
  @for (item of items(); track item.id) {
    <div class="border-b border-[var(--c-200)] last:border-b-0">

      <button
        class="w-full flex items-center justify-between px-5 py-4
               bg-transparent border-none cursor-pointer text-left
               font-[family-name:var(--font-body)] text-[13px] font-normal
               text-[var(--c-700)] hover:bg-[var(--c-100)] transition-colors duration-150 outline-none"
        (click)="toggle(item.id)">
        {{ item.question }}
        <svg
          class="w-4 h-4 flex-shrink-0 text-[var(--c-400)] transition-transform duration-250"
          [class.rotate-180]="opened() === item.id"
          viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>

      <div
        class="overflow-hidden transition-all duration-300 ease-in-out"
        [style.max-height]="opened() === item.id ? '200px' : '0px'">
        <p class="px-5 pb-4 text-[13px] font-light text-[var(--c-500)] leading-relaxed">
          {{ item.answer }}
        </p>
      </div>

    </div>
  }
</div>
```

```css
/* accordion.component.css — vacío */
```

---

## Ejemplo 6 — Dropdown menu

**Prompt:** "Creá un dropdown de opciones / menú contextual"

```typescript
// dropdown.component.ts
import { Component, input, output, signal, HostListener } from '@angular/core';

export interface DropdownItem {
  label: string;
  action: string;
  icon?: string;   // SVG path d=""
  danger?: boolean;
  divider?: boolean;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.css'
})
export class DropdownComponent {
  trigger = input<string>('Opciones');
  items   = input<DropdownItem[]>([]);
  isOpen  = signal(false);
  selected = output<string>();

  toggle() { this.isOpen.set(!this.isOpen()); }
  close()  { this.isOpen.set(false); }
  pick(action: string) { this.selected.emit(action); this.close(); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!(e.target as Element).closest('app-dropdown')) this.close();
  }
}
```

```html
<!-- dropdown.component.html -->
<div class="relative inline-block">

  <button
    class="flex items-center gap-2 px-4 py-2 bg-[var(--c-50)]
           border border-[var(--c-200)] rounded-[10px] text-[12px]
           font-normal text-[var(--c-700)] cursor-pointer
           hover:border-[var(--c-400)] transition-colors duration-200
           font-[family-name:var(--font-body)]"
    (click)="toggle()">
    {{ trigger() }}
    <svg class="w-3 h-3 transition-transform duration-200"
         [class.rotate-180]="isOpen()"
         viewBox="0 0 12 12" fill="none">
      <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  </button>

  @if (isOpen()) {
    <div class="absolute top-[calc(100%+6px)] left-0 min-w-[180px] z-50
                bg-[var(--c-50)] border border-[var(--c-200)] rounded-[12px]
                overflow-hidden shadow-[0_4px_16px_rgba(33,37,41,0.08)]
                animate-fade-in">
      @for (item of items(); track item.action) {
        @if (item.divider) {
          <div class="h-px bg-[var(--c-200)] my-1"></div>
        } @else {
          <button
            class="w-full flex items-center gap-2 px-4 py-2.5 text-[12px]
                   font-light cursor-pointer border-none bg-transparent text-left
                   font-[family-name:var(--font-body)] transition-colors duration-150"
            [class.text-[var(--c-600)]]="!item.danger"
            [class.text-red-600]="item.danger"
            [class.hover:bg-[var(--c-100)]]="!item.danger"
            [class.hover:bg-red-50]="item.danger"
            (click)="pick(item.action)">
            {{ item.label }}
          </button>
        }
      }
    </div>
  }

</div>
```

```css
/* dropdown.component.css */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fade-in .15s ease; }
```

---

## Ejemplo 7 — Toast / Notificaciones

**Prompt:** "Creá un sistema de toasts / notificaciones"

**Variantes:** `default` | `success` | `error` | `warning`
- Borde izquierdo de 3px como acento de color — el único color en toda la UI
- Sin sombras intensas, sin íconos coloridos grandes
- `success` → `#2d6a4f` | `error` → `#c0392b` | `warning` → `#b5830a` | `default` → `var(--c-800)`

```typescript
// toast.service.ts
import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: 'default' | 'success' | 'error' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(toast: Omit<Toast, 'id'>) {
    const id = crypto.randomUUID();
    this.toasts.update(t => [...t, { ...toast, id }]);
    setTimeout(() => this.dismiss(id), 4000);
  }

  dismiss(id: string) {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }
}
```

```html
<!-- toast-container.component.html — poner en app.component.html -->
<div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 w-[340px]">
  @for (toast of toastService.toasts(); track toast.id) {
    <div
      class="flex items-start gap-3 px-4 py-3.5 bg-[var(--c-50)]
             border border-[var(--c-200)] rounded-[12px] border-l-[3px]
             animate-slide-in"
      [style.border-left-color]="accentColor(toast.variant)">
      <div class="flex-1 min-w-0">
        <p class="text-[12px] font-medium text-[var(--c-800)] leading-tight">{{ toast.title }}</p>
        @if (toast.description) {
          <p class="text-[11px] font-light text-[var(--c-500)] mt-0.5 leading-relaxed">{{ toast.description }}</p>
        }
      </div>
      <button
        class="text-[var(--c-400)] hover:text-[var(--c-700)] bg-none border-none
               cursor-pointer text-base leading-none flex-shrink-0 transition-colors"
        (click)="toastService.dismiss(toast.id)">×</button>
    </div>
  }
</div>
```

```typescript
// toast-container.component.ts
import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.css'
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  accentColor(variant: string): string {
    const map: Record<string, string> = {
      default: 'var(--c-800)',
      success: '#2d6a4f',
      error:   '#c0392b',
      warning: '#b5830a',
    };
    return map[variant] ?? map['default'];
  }
}
```

```css
/* toast-container.component.css */
@keyframes slide-in {
  from { opacity: 0; transform: translateX(12px); }
  to   { opacity: 1; transform: translateX(0); }
}
.animate-slide-in { animation: slide-in .2s cubic-bezier(0.16,1,0.3,1); }
```

**Uso desde cualquier componente:**
```typescript
// en cualquier componente
toastService = inject(ToastService);

mostrarExito() {
  this.toastService.show({
    title: 'Usuario creado',
    description: 'El nuevo usuario fue agregado al sistema.',
    variant: 'success'
  });
}
```

---

## Reglas de oro al generar

1. **Nunca usar `*ngIf` ni `*ngFor`** — siempre `@if` y `@for` con `track`
2. **Nunca hardcodear colores** — siempre `var(--c-50)` … `var(--c-800)` dentro de Tailwind con `bg-[var(--c-XX)]`
3. **Nunca CSS inline** — si Tailwind no llega, va al `.css` del componente con variables del `:root`
4. **Paleta oficial**: `#f8f9fa` → `#e9ecef` → `#dee2e6` → `#ced4da` → `#adb5bd` → `#6c757d` → `#495057` → `#343a40` → `#212529`
5. **Tipografía**: Space Grotesk — títulos en `300` + `<strong>` en `600`, nunca Inter/Roboto/Arial
6. **Geometría decorativa** — arcos concéntricos + grilla diagonal en modals y cards principales
7. **Border-radius**: `rounded-[20px]` cards/modals · `rounded-[10px]` botones · `rounded-[8px]` elementos pequeños
8. **Botón primario**: `bg-[var(--c-800)] text-[var(--c-50)] rounded-[10px]`
9. **Labels**: `text-[10px] tracking-[0.18em] uppercase text-[var(--c-400)]`
10. **Sin sombras intensas** — solo `border border-[var(--c-200)]` para separar superficies

---

## Reglas específicas por componente

### Accordion — colores correctos

**Fondo del item**: `bg-[var(--c-50)]` — NUNCA `var(--c-200)` ni `var(--c-100)`, se ve sucio
**Hover del trigger**: SOLO cambiar el borde a `var(--c-300)` — NUNCA cambiar el fondo
**Patrón correcto:**
```html
<!-- CORRECTO -->
<button class="... bg-transparent border border-[var(--c-200)]
               hover:border-[var(--c-300)] transition-colors duration-150">

<!-- INCORRECTO — fondo en hover se ve pesado -->
<button class="... hover:bg-[var(--c-100)]">
```

### Tabs — hover e indicador correctos

**Hover**: SOLO oscurecer el texto a `var(--c-700)` — NUNCA agregar fondo ni borde en hover
**Activo**: texto `var(--c-800)` `font-medium` + línea inferior animada con JS (`offsetLeft` / `offsetWidth`)
**NUNCA**: `hover:bg-[...]` en tabs — los tabs NO son botones, no tienen fondo en ningún estado

```html
<!-- CORRECTO — solo color de texto cambia -->
<button class="... text-[var(--c-400)] hover:text-[var(--c-700)]
               [&.active]:text-[var(--c-800)] [&.active]:font-medium">

<!-- INCORRECTO -->
<button class="... hover:bg-[var(--c-100)]">
```

**Indicador de tab activo**: línea de `2px` de alto, ancho dinámico via JS, `bottom: -1px`, `background: var(--c-800)`

### Íconos — siempre Heroicons outline SVG

**NUNCA usar**: emojis, caracteres unicode (✓ × ↑ ↓ →), ni icon fonts
**SIEMPRE usar**: Heroicons en variante `outline` con `stroke="currentColor"`

```html
<!-- CORRECTO — Heroicon outline, estilizable con Tailwind -->
<svg class="size-5 stroke-2 text-[var(--c-500)]"
     xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
     stroke="currentColor" stroke-width="1.5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
</svg>

<!-- INCORRECTO — unicode, no escala, no es consistente -->
<span>×</span>
<span>✓</span>
<span>↓</span>
```

**Heroicons oficiales del proyecto (copiar directo, no modificar los paths):**

> Cambiar solo el `class="size-6"` según contexto: `size-4` pequeño · `size-5` normal · `size-6` grande
> Cambiar color con Tailwind: `text-[var(--c-500)]` — el `stroke="currentColor"` lo hereda automáticamente

Close / X:
```html
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 text-[var(--c-500)]">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
</svg>
```

Chevron down (accordion, dropdown, select):
```html
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 text-[var(--c-400)]">
  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
</svg>
```

Check / Success:
```html
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 text-[var(--c-600)]">
  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
</svg>
```

Warning / Triangle:
```html
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 text-[var(--c-600)]">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
</svg>
```

Trash / Delete:
```html
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 text-[var(--c-500)]">
  <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
</svg>
```

Plus / Add:
```html
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 text-[var(--c-600)]">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
</svg>
```

**Estilizar íconos con Tailwind:**
```html
<!-- Color heredado del texto padre -->
<svg class="size-5 text-[var(--c-500)]" stroke="currentColor">

<!-- Color en hover del padre -->
<div class="group">
  <svg class="size-5 text-[var(--c-400)] group-hover:text-[var(--c-700)] transition-colors">
```

---

## Ejemplo 8 — Toast / Notificaciones (Actualizado)


**Prompt:** "Creá un sistema de toasts / notificaciones"

**Estructura de archivos a generar:**

```
services/
  toast.service.ts
components/
  toast-container/
    toast-container.component.ts
    toast-container.component.html
    toast-container.component.css
```

### toast.service.ts

```typescript
import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts = signal<Toast[]>([]);
  readonly toasts$ = this.toasts.asReadonly();
  private nextId = 0;

  show(message: string, variant: ToastVariant = 'default', duration = 3000) {
    const id = `toast-${this.nextId++}`;
    const toast: Toast = { id, message, variant, duration };

    this.toasts.update(list => [...list, toast]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }

    return id;
  }

  success(message: string, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  error(message: string, duration = 3000) {
    return this.show(message, 'error', duration);
  }

  warning(message: string, duration = 3000) {
    return this.show(message, 'warning', duration);
  }

  info(message: string, duration = 3000) {
    return this.show(message, 'default', duration);
  }

  remove(id: string) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
```

### toast-container.component.ts

```typescript
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastContainerComponent {
  private toastService = inject(ToastService);
  toasts = this.toastService.toasts$;

  getAccentColor(variant: string): string {
    switch (variant) {
      case 'success':
        return '#2d6a4f';
      case 'error':
        return '#c0392b';
      case 'warning':
        return '#b5830a';
      default:
        return 'var(--c-800)';
    }
  }

  removeToast(id: string) {
    this.toastService.remove(id);
  }
}
```

### toast-container.component.html

**Estructura crítica — Reproducir EXACTAMENTE:**

Primera fila: **Icono | Título | Botón Close** (todos alineados horizontalmente)
Segunda fila: **Mensaje** (debajo del ícono y título, desalineado a la izquierda pero espaciado)

```html
<div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 w-[340px]">
  @for (toast of toasts(); track toast.id) {
    <div class="animate-slide-in"
         [style.borderLeftColor]="getAccentColor(toast.variant)">
      <div class="p-3 bg-[var(--c-50)] border border-[var(--c-200)] rounded-[12px] border-l-4 flex flex-col gap-2"
           [ngClass]="{
             'border-l-[#2d6a4f]': toast.variant === 'success',
             'border-l-[#c0392b]': toast.variant === 'error',
             'border-l-[#b5830a]': toast.variant === 'warning',
             'border-l-[var(--c-800)]': toast.variant === 'default'
           }">
        
        <!-- Primera fila: Icon + Título + Close -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <!-- Ícono según variante — usar Heroicons -->
            <!-- Success: CheckCircle, Error: XCircle, Warning: ExclamationCircle, Default: InformationCircle -->
            
            <!-- Título según variante -->
            <!-- Success: "Éxito" (#2d6a4f) | Error: "Error" (#c0392b) | Warning: "Advertencia" (#b5830a) | Default: "Información" (var(--c-600)) -->
          </div>

          <!-- Botón cerrar -->
          <button (click)="removeToast(toast.id)"
                  class="text-[var(--c-400)] hover:text-[var(--c-800)] transition-colors flex-shrink-0"
                  aria-label="Cerrar notificación">
            <!-- Close icon (X) -->
          </button>
        </div>

        <!-- Segunda fila: Mensaje -->
        <p class="text-xs text-[var(--c-600)] font-light leading-snug pl-7">
          {{ toast.message }}
        </p>
      </div>
    </div>
  }
</div>
```

### Variantes de toast

| Variante | Ícono | Título | Color borde izq | Color título | Color ícono |
|----------|-------|--------|-----------------|--------------|------------|
| **success** | CheckCircle | Éxito | `#2d6a4f` | `#2d6a4f` | `#2d6a4f` |
| **error** | XCircle | Error | `#c0392b` | `#c0392b` | `#c0392b` |
| **warning** | ExclamationCircle | Advertencia | `#b5830a` | `#b5830a` | `#b5830a` |
| **default** | InformationCircle | Información | `var(--c-800)` | `var(--c-600)` | `var(--c-600)` |

### toast-container.component.css

```css
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(384px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slide-in {
  animation: slide-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Integración en app.component.ts

```typescript
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  imports: [/* ... */, ToastContainerComponent],
  // ...
})
export class App {
  private toastService = inject(ToastService);

  // Métodos de ejemplo
  showSuccessToast() {
    this.toastService.success('Operación completada exitosamente');
  }
}
```

### En el template app.component.html

```html
<div>
  <!-- Tu contenido -->
  
  <!-- Toast container — siempre al final -->
  <app-toast-container></app-toast-container>
</div>
```

### Uso desde cualquier componente

```typescript
private toastService = inject(ToastService);

// Métodos disponibles
this.toastService.success('Mensaje de éxito');
this.toastService.error('Mensaje de error');
this.toastService.warning('Mensaje de advertencia');
this.toastService.info('Mensaje informativo');

// O manual
this.toastService.show('Mensaje personalizado', 'success', 2000);
```

### Reglas críticas de toasts

✅ **Estructura de dos filas obligatoria:**
  - Fila 1: Icono (20px) + Título (xs, uppercase, medium) + Botón close (20px)
  - Fila 2: Mensaje (xs, light, con `pl-7` para alinearse debajo del ícono + título)

✅ **Padding y sizing:**
  - Container: `p-3` (compacto)
  - Gap vertical: `gap-2` entre filas
  - Gap horizontal en fila 1: `gap-2` entre ícono y título

✅ **Border radius:** `rounded-[12px]` — suave pero no excesivo

✅ **Border izquierdo:** `border-l-4` con color según variante — es el único elemento colorido

✅ **Animación:** Slide-in desde la derecha, 200ms, easing `cubic-bezier(0.16, 1, 0.3, 1)`

✅ **Auto-dismiss:** 3000ms por defecto, configurable por llamada

✅ **Cierre manual:** Botón X siempre visible

❌ **Prohibiciones:**
  - No usar `mt` en el ícono, debe estar alineado con el título
  - No mezclar ícono y mensaje en la misma fila
  - No cambiar el color del botón close (siempre gris neutral)
  - No remover el `pl-7` del mensaje (es crítico para la alineación visual)


---

## Ejemplo 9 — Select con búsqueda interna

**Prompt:** "Creá un select con campo de búsqueda" / "Necesito un dropdown searchable"

**Reglas críticas:**
- El campo de búsqueda vive DENTRO del dropdown como primer item — nunca afuera ni separado
- Es `position: sticky; top: 0` para que quede fijo mientras se scrollea
- Resaltar coincidencias con `<mark>` — sin color de fondo, solo `font-weight: 500`
- Botón clear (X) aparece solo cuando hay texto escrito
- Cierra al hacer click fuera con `document.addEventListener('click')`
- NUNCA usar `<select>` nativo

```typescript
// searchable-select.component.ts
import { Component, input, output, signal, computed, HostListener, ElementRef, inject } from '@angular/core';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  templateUrl: './searchable-select.component.html',
  styleUrl: './searchable-select.component.css'
})
export class SearchableSelectComponent {
  private elRef = inject(ElementRef);

  options     = input<SelectOption[]>([]);
  placeholder = input<string>('Seleccioná una opción');
  label       = input<string>('');

  selected  = signal<SelectOption | null>(null);
  isOpen    = signal(false);
  query     = signal('');

  valueChange = output<SelectOption>();

  filtered = computed(() =>
    this.options().filter(o =>
      o.label.toLowerCase().includes(this.query().toLowerCase())
    )
  );

  toggle() {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      setTimeout(() => document.getElementById('select-search-input')?.focus(), 50);
    }
  }

  pick(opt: SelectOption) {
    this.selected.set(opt);
    this.valueChange.emit(opt);
    this.isOpen.set(false);
    this.query.set('');
  }

  clearQuery() { this.query.set(''); }

  highlight(label: string): string {
    if (!this.query()) return label;
    return label.replace(
      new RegExp(`(${this.query()})`, 'gi'),
      '<mark>$1</mark>'
    );
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!this.elRef.nativeElement.contains(e.target)) {
      this.isOpen.set(false);
      this.query.set('');
    }
  }
}
```

```html
<!-- searchable-select.component.html -->
<div class="flex flex-col gap-1.5">

  @if (label()) {
    <span class="text-[10px] tracking-[0.18em] uppercase text-[var(--c-400)] font-normal">
      {{ label() }}
    </span>
  }

  <div class="relative w-full">

    <!-- Trigger -->
    <button
      class="w-full flex items-center justify-between gap-2 px-4 py-[0.65rem]
             bg-[var(--c-50)] border border-[var(--c-200)] rounded-[10px]
             font-[family-name:var(--font-body)] text-[13px] font-light
             text-[var(--c-700)] cursor-pointer transition-colors duration-200
             hover:border-[var(--c-400)] outline-none"
      [class.border-[var(--c-700)]]="isOpen()"
      [class.rounded-b-none]="isOpen()"
      (click)="toggle()"
      type="button">
      <span [class.text-[var(--c-400)]]="!selected()">
        {{ selected()?.label ?? placeholder() }}
      </span>
      <svg class="size-[14px] text-[var(--c-400)] transition-transform duration-200 flex-shrink-0"
           [class.rotate-180]="isOpen()"
           xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
           stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
      </svg>
    </button>

    <!-- Dropdown -->
    @if (isOpen()) {
      <div class="absolute top-full left-0 right-0 z-50
                  bg-[var(--c-50)] border border-[var(--c-700)] border-t-0
                  rounded-b-[10px] overflow-hidden">

        <!-- Lista con scroll — buscador sticky adentro -->
        <div class="max-h-[220px] overflow-y-auto select-scroll">

          <!-- Buscador — primer item, sticky -->
          <div class="flex items-center gap-2 px-4 py-2.5
                      border-b border-[var(--c-200)]
                      sticky top-0 bg-[var(--c-50)] z-10">
            <svg class="size-[13px] text-[var(--c-400)] flex-shrink-0"
                 xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                 stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 10.607Z"/>
            </svg>
            <input
              id="select-search-input"
              class="flex-1 bg-transparent border-none outline-none
                     font-[family-name:var(--font-body)] text-[12px] font-light
                     text-[var(--c-700)] placeholder:text-[var(--c-400)]"
              placeholder="Buscar..."
              [value]="query()"
              (input)="query.set($any($event.target).value)"
              (click)="$event.stopPropagation()"
              autocomplete="off"/>
            @if (query()) {
              <button
                class="flex items-center text-[var(--c-400)] hover:text-[var(--c-700)]
                       bg-transparent border-none cursor-pointer p-0 transition-colors"
                (click)="clearQuery(); $event.stopPropagation()"
                type="button">
                <svg class="size-[11px]" xmlns="http://www.w3.org/2000/svg" fill="none"
                     viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
                </svg>
              </button>
            }
          </div>

          <!-- Opciones -->
          @for (opt of filtered(); track opt.value) {
            <div
              class="flex items-center justify-between px-4 py-[0.6rem]
                     text-[13px] font-light text-[var(--c-600)] cursor-pointer
                     transition-colors duration-100 hover:bg-[var(--c-100)] hover:text-[var(--c-800)]"
              [class.font-medium]="selected()?.value === opt.value"
              [class.text-[var(--c-800)]]="selected()?.value === opt.value"
              (click)="pick(opt)">
              <span [innerHTML]="highlight(opt.label)"></span>
              @if (selected()?.value === opt.value) {
                <svg class="size-[14px] text-[var(--c-800)] flex-shrink-0"
                     xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                     stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                </svg>
              }
            </div>
          }

          <!-- Sin resultados -->
          @if (filtered().length === 0) {
            <div class="px-4 py-4 text-center text-[12px] font-light text-[var(--c-400)]">
              Sin resultados
            </div>
          }

        </div>
      </div>
    }

  </div>
</div>
```

```css
/* searchable-select.component.css */
.select-scroll::-webkit-scrollbar { width: 4px; }
.select-scroll::-webkit-scrollbar-track { background: transparent; }
.select-scroll::-webkit-scrollbar-thumb { background: var(--c-200); border-radius: 4px; }

/* Resaltado de búsqueda — sin color de fondo, solo negrita */
mark {
  background: none;
  color: var(--c-800);
  font-weight: 500;
}
```

**Uso:**
```html
<app-searchable-select
  label="País de residencia"
  placeholder="Seleccioná un país"
  [options]="paises"
  (valueChange)="onPaisChange($event)" />
```

```typescript
paises: SelectOption[] = [
  { value: 'ar', label: 'Argentina' },
  { value: 'bo', label: 'Bolivia' },
  { value: 'br', label: 'Brasil' },
];
```