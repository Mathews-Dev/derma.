# GitHub Copilot — Angular 20 Project Instructions

## Activation

- Always-on for this repository.
- Apply these rules to every task unless the user explicitly requests a temporary exception.

You are an expert Angular 20 developer assistant. This file defines mandatory rules for ALL code you generate, review, refactor, or suggest in this project. Follow every rule without exception. When you detect violations in existing code, flag them and provide the corrected version.

---

## IDENTITY & STACK

- Framework: **Angular 20** (TypeScript 5.6+)
- Architecture: **Standalone Components** — no NgModules
- Reactivity: **Signals-first** — use `signal`, `computed`, `effect`, `input`, `output`, `viewChild`, `linkedSignal`
- Change Detection: **OnPush** on every component, migrating toward Zoneless
- HTTP: **`HttpClient`** with `provideHttpClient(withFetch())`
- Testing: **Jest** (or Vitest if configured) — never suggest Karma/Jasmine unless explicitly asked

---

## ABSOLUTE RULES — NEVER VIOLATE

### 🚫 Never generate this

```
// ❌ NgModules
@NgModule({ declarations: [...] })

// ❌ Constructor injection
constructor(private service: MyService) {}

// ❌ Structural directives (removed in v22)
*ngIf, *ngFor, *ngSwitch, *ngSwitchCase

// ❌ BehaviorSubject for local state
private subject = new BehaviorSubject(...)

// ❌ Manual subscriptions without cleanup
this.service.data$.subscribe(d => this.data = d)

// ❌ Deprecated APIs
provideZoneChangeDetection(...)
afterRender(...)
effect(..., { forceRoot: true })
toSignal(..., { rejectErrors: true })
@Input() / @Output() decorators
@ViewChild() / @ContentChild() decorators
TestBed.flushEffects()

// ❌ Type any
function handle(data: any)

// ❌ providedIn: 'root' for feature-scoped services
```

---

## COMPONENT RULES

### Template

Always use modern control flow:

```html
<!-- ✅ Conditionals -->
@if (condition()) {
  <element />
} @else if (other()) {
  <other />
} @else {
  <fallback />
}

<!-- ✅ Loops — track by id always -->
@for (item of items(); track item.id) {
  <app-item [item]="item" />
} @empty {
  <p>No items.</p>
}

<!-- ✅ Switch -->
@switch (status()) {
  @case ('active')   { <span>Active</span>   }
  @case ('inactive') { <span>Inactive</span> }
  @default           { <span>Unknown</span>  }
}

<!-- ✅ Deferred loading -->
@defer (on viewport) {
  <app-heavy-component />
} @placeholder {
  <div class="skeleton"></div>
} @loading (minimum 300ms) {
  <app-spinner />
} @error {
  <p>Failed to load.</p>
}
```

### Class

```typescript
// ✅ Required component structure
@Component({
  selector: 'app-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...],
  templateUrl: './example.component.html',
})
export class ExampleComponent {
  // 1. Injections via inject()
  private service = inject(ExampleService);

  // 2. Inputs / Outputs via signal-based API
  data    = input.required<DataType>();
  config  = input<Config>({ transform: ... });
  changed = output<DataType>();

  // 3. ViewChild / ContentChild
  inputRef = viewChild<ElementRef>('inputEl');

  // 4. Local state as signals
  isLoading = signal(false);
  selected  = signal<Item | null>(null);

  // 5. Derived state as computed
  filteredItems = computed(() =>
    this.service.items().filter(i => i.active)
  );

  // 6. Effects last
  constructor() {
    effect(() => {
      console.log('selected changed:', this.selected());
    });
  }
}
```

---

## SERVICE RULES

```typescript
// ✅ Service structure
@Injectable({ providedIn: 'root' }) // only for truly global services
export class ExampleService {
  private http = inject(HttpClient);

  // Expose readonly signals — never expose writable signals directly
  private _items = signal<Item[]>([]);
  readonly items = this._items.asReadonly();

  // Return Observables from HTTP, convert at component level with toSignal()
  getItems() {
    return this.http.get<Item[]>('/api/items');
  }

  // Or use resource() for signal-based async
}
```

### Scoped providers — prefer over root for features

```typescript
// ✅ Route-level providers
export const FEATURE_ROUTES: Routes = [{
  path: 'feature',
  providers: [FeatureService, FeatureFacade],
  children: [...]
}];
```

---

## REACTIVITY RULES

### Signals

```typescript
// ✅ Writable signal
const count = signal(0);
count.set(5);
count.update(n => n + 1);

// ✅ Computed (pure, no side effects)
const doubled = computed(() => count() * 2);

// ✅ linkedSignal — writable but auto-resets on source change
const options = signal(['A', 'B', 'C']);
const selected = linkedSignal(() => options()[0]);

// ✅ effect — side effects only, never mutate signals inside effects
effect(() => {
  localStorage.setItem('count', String(count()));
});
```

### RxJS ↔ Signals bridge

```typescript
// ✅ Observable → Signal (auto-unsubscribes)
data = toSignal(this.service.getData$(), { initialValue: [] });

// ✅ Signal → Observable (when needed for operators)
data$ = toObservable(this.dataSignal);
```

### When to use RxJS vs Signals

| Scenario | Use |
|---|---|
| Local component state | `signal()` |
| Derived/computed state | `computed()` |
| HTTP requests (simple) | `toSignal(http.get(...))` |
| HTTP requests (reactive) | `resource()` or `httpResource()` |
| Complex async pipelines | RxJS + `toSignal()` at boundary |
| Cross-component state | Signal-based service |
| WebSockets / streams | RxJS |

---

## ASYNC DATA PATTERNS

### Pattern 1 — toSignal (preferred for simple HTTP)

```typescript
@Component({ standalone: true, ... })
export class ListComponent {
  private service = inject(ProductService);
  products = toSignal(this.service.getAll(), { initialValue: [] });
}
```

### Pattern 2 — resource() for reactive queries

```typescript
productId = signal(1);

product = resource({
  request: () => ({ id: this.productId() }),
  loader: ({ request, abortSignal }) =>
    fetch(`/api/products/${request.id}`, { signal: abortSignal })
      .then(r => r.json() as Promise<Product>)
});

// product.value()   → Product | undefined
// product.status()  → 'idle' | 'loading' | 'resolved' | 'error'
// product.error()   → unknown
// product.reload()  → force refetch
```

### Pattern 3 — httpResource() (experimental, use with caution)

```typescript
category = signal('all');
products = httpResource<Product[]>(() => `/api/products?cat=${this.category()}`);
```

---

## ARCHITECTURE RULES

### Smart vs Presentational split

```
Smart (Page/Container):
  - Injects services
  - Manages state
  - Handles routing
  - Passes data down via input()

Presentational (UI):
  - Only input() and output()
  - Zero service injections
  - Pure rendering logic
  - Reusable across features
```

### Folder structure

```
src/
├── app/
│   ├── core/                    # Global services, interceptors, guards
│   │   ├── services/
│   │   ├── interceptors/
│   │   └── guards/
│   ├── shared/                  # Reusable presentational components, pipes, directives
│   │   ├── components/
│   │   ├── pipes/
│   │   └── directives/
│   ├── features/                # Feature modules (standalone routes)
│   │   └── products/
│   │       ├── data-access/     # Services, models, API calls
│   │       ├── ui/              # Presentational components
│   │       ├── pages/           # Smart components (routed)
│   │       └── products.routes.ts
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
```

---

## REFACTORING INSTRUCTIONS

When you encounter legacy code, automatically apply these transformations:

### 1. NgModule → Standalone

```typescript
// BEFORE
@NgModule({ declarations: [FooComponent], imports: [CommonModule] })
export class FooModule {}

// AFTER — dissolve the module, make component standalone
@Component({ standalone: true, imports: [/* what FooModule imported */], ... })
export class FooComponent {}
```

### 2. @Input/@Output → input()/output()

```typescript
// BEFORE
@Input() title!: string;
@Output() clicked = new EventEmitter<void>();

// AFTER
title   = input.required<string>();
clicked = output<void>();
```

### 3. @ViewChild → viewChild()

```typescript
// BEFORE
@ViewChild('inputEl') inputEl!: ElementRef;

// AFTER
inputEl = viewChild<ElementRef>('inputEl');
```

### 4. Constructor injection → inject()

```typescript
// BEFORE
constructor(private router: Router, private service: MyService) {}

// AFTER
private router  = inject(Router);
private service = inject(MyService);
```

### 5. BehaviorSubject → signal

```typescript
// BEFORE
private _count = new BehaviorSubject(0);
count$ = this._count.asObservable();
setCount(n: number) { this._count.next(n); }

// AFTER
private _count = signal(0);
count = this._count.asReadonly();
setCount(n: number) { this._count.set(n); }
```

### 6. *ngIf/*ngFor → @if/@for

```html
<!-- BEFORE -->
<div *ngIf="user; else noUser">{{ user.name }}</div>
<ng-template #noUser>No user</ng-template>
<li *ngFor="let item of items; trackBy: trackById">{{ item.name }}</li>

<!-- AFTER -->
@if (user()) {
  <div>{{ user()!.name }}</div>
} @else {
  No user
}
@for (item of items(); track item.id) {
  <li>{{ item.name }}</li>
}
```

### 7. Manual subscribe → toSignal

```typescript
// BEFORE
data: Product[] = [];
private sub = new Subscription();
ngOnInit() { this.sub.add(this.service.get().subscribe(d => this.data = d)); }
ngOnDestroy() { this.sub.unsubscribe(); }

// AFTER
data = toSignal(inject(ProductService).get(), { initialValue: [] });
```

---

## CODE QUALITY RULES

- **No `any`** — always provide explicit types or use `unknown` with type guards
- **No `console.log`** in production code — use a logger service
- **No magic strings** — use enums or `as const` objects
- **No direct DOM manipulation** — use Angular APIs, signals, or Renderer2
- **No logic in templates** — move conditions and transformations to `computed()` or pipes
- **Interfaces over classes** for plain data models
- **`readonly`** on all signal exposures from services
- **Pure functions** in `computed()` — no side effects
- **Single responsibility** — one concern per file

```typescript
// ✅ Typed constants
export const ORDER_STATUS = {
  PENDING:   'pending',
  ACTIVE:    'active',
  CANCELLED: 'cancelled',
} as const;
export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// ✅ Type guard for unknown
function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'code' in e;
}
```

---

## SSR RULES (if applicable)

```typescript
// app.config.ts
provideClientHydration(withIncrementalHydration())

// Never access browser APIs directly — always check platform
private platformId = inject(PLATFORM_ID);

doSomething() {
  if (isPlatformBrowser(this.platformId)) {
    window.scrollTo(0, 0);
  }
}
```

---

## TESTING RULES

```typescript
// ✅ Modern test structure
describe('ExampleComponent', () => {
  let spectator: SpectatorRouting<ExampleComponent>; // or TestBed

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ExampleComponent], // standalone — import, not declare
    });
  });

  it('should update signal on click', () => {
    const fixture = TestBed.createComponent(ExampleComponent);
    fixture.detectChanges();

    // Use TestBed.tick() not flushEffects()
    fixture.componentInstance.count.set(5);
    TestBed.tick(); // ✅
    expect(fixture.componentInstance.doubled()).toBe(10);
  });
});
```

---

## QUICK REFERENCE — MODERN API SURFACE

```typescript
// Signals core
import {
  signal, computed, effect, untracked,
  linkedSignal,
  input, output, model,
  viewChild, viewChildren, contentChild, contentChildren,
  resource,
  afterEveryRender, afterNextRender,
} from '@angular/core';

// RxJS interop
import { toSignal, toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';

// DI
import { inject, Injectable, InjectionToken, PLATFORM_ID } from '@angular/core';

// HTTP
import { httpResource } from '@angular/common/http'; // experimental

// Bootstrap
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core'; // developer preview
import { provideClientHydration, withIncrementalHydration } from '@angular/platform-browser';
```

---

## WHEN IN DOUBT

1. Prefer **Signals** over Observables for state
2. Prefer **`inject()`** over constructor injection
3. Prefer **`@if/@for`** over structural directives
4. Prefer **`standalone: true`** always
5. Prefer **`ChangeDetectionStrategy.OnPush`** always
6. Prefer **`resource()`** over manual HTTP + subscribe
7. Prefer **scoped providers** over `providedIn: 'root'` for features
8. Prefer **`computed()`** over `effect()` for derived values
9. Never mutate signals inside `effect()` — use `computed()` instead
10. Never expose writable signals from services — use `.asReadonly()`
