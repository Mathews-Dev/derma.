import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Timestamp } from 'firebase/firestore';
import {
  CategoriaTarea,
  EstadoTarea,
  PrioridadTarea,
  Tarea,
  TareaInput,
  Usuario,
} from '@derma/models';
import { DatepickerComponent, ToastService, UiDropdownSelectComponent } from '@derma/ui';
import { TareasService } from '@derma/firebase';

@Component({
  selector: 'app-tarea-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiDropdownSelectComponent, DatepickerComponent],
  templateUrl: './tarea-form-modal.component.html',
  styleUrl: './tarea-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TareaFormModalComponent {
  // Inputs
  tarea = input<Tarea | null>(null);
  empleados = input.required<Usuario[]>();
  adminUid = input.required<string>();
  isSaving = input<boolean>(false);

  empleadoSearch = signal('');

  filteredEmpleados = computed(() => {
     let list = this.empleados();
     const search = this.empleadoSearch().toLowerCase();
          if (search) {
         list = list.filter(e => 
            e.nombre.toLowerCase().includes(search) || 
            e.apellido.toLowerCase().includes(search) ||
            e.rol.toLowerCase().includes(search)
         );
     }

     return list;
  });

  // Outputs
  closed = output<void>();
  saved = output<TareaInput>();

  private readonly toast = inject(ToastService);
  private readonly tareasService = inject(TareasService);

  // Estado
  isClosing = signal<boolean>(false);

  readonly PrioridadTarea = PrioridadTarea;
  readonly categoriaOptions: CategoriaTarea[] = [
    'limpieza', 'recepcion', 'mantenimiento', 'administrativo', 'clinico', 'inventario', 'compras', 'otro',
  ];
  readonly categoriaLabels: Record<CategoriaTarea, string> = {
    limpieza:       'Limpieza',
    recepcion:      'Recepción',
    mantenimiento:  'Mantenimiento',
    administrativo: 'Administrativo',
    clinico:        'Clínico',
    inventario:     'Inventario',
    compras:        'Compras',
    otro:           'Otro',
  };

  // Opciones para dropdowns
  categoriasUI = computed(() =>
    this.categoriaOptions.map(cat => ({ id: cat, label: this.categoriaLabels[cat] }))
  );

  prioridadesUI = computed(() => [
    { id: 'baja', label: 'Baja' },
    { id: 'media', label: 'Media' },
    { id: 'alta', label: 'Alta' },
    { id: 'urgente', label: 'Urgente' },
  ]);

  empleadosUI = computed(() =>
    this.empleados().map(emp => ({
      id: emp.uid,
      label: `${emp.nombre} ${emp.apellido} (${emp.rol})`
    }))
  );

  // Form Controls
  form = new FormGroup({
    titulo: new FormControl<string>('', Validators.required),
    descripcion: new FormControl<string>(''),
    categoria: new FormControl<CategoriaTarea | null>('administrativo'),
    prioridad: new FormControl<PrioridadTarea | null>(PrioridadTarea.MEDIA),
    vencimiento: new FormControl<string>(''),
    etiquetas: new FormControl<string[]>([]),
    empleados: new FormControl<string[]>([]),
  });

  vencimientoValue = toSignal(this.form.controls.vencimiento.valueChanges, { initialValue: this.form.value.vencimiento ?? '' });

  vencimientoDate = computed(() => {
    const val = this.vencimientoValue();
    if (!val) return null;
    return new Date(val + 'T00:00:00');
  });

  onVencimientoChange(date: Date | null) {
    if (!date) {
      this.form.controls.vencimiento.setValue('');
      return;
    }
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime());
    this.form.controls.vencimiento.setValue(`${localDate.getFullYear()}-${String(localDate.getMonth()+1).padStart(2,'0')}-${String(localDate.getDate()).padStart(2,'0')}`);
  }

  // Signals adicionales
  etiquetaInput = signal('');
  isEditMode = computed(() => !!this.tarea());

  constructor() {
    // Pre-fill cuando se edita
    effect(() => {
      const t = this.tarea();
      if (t) {
        this.form.patchValue({
          titulo: t.titulo,
          descripcion: t.descripcion,
          categoria: t.categoria,
          prioridad: t.prioridad,
          empleados: [...t.asignadaA],
        });

        if (t.etiquetas) {
          this.form.patchValue({ etiquetas: [...t.etiquetas] });
        }

        if (t.fechaVencimiento) {
          const d = t.fechaVencimiento.toDate();
          const artDate = new Date(d.getTime() - 3 * 60 * 60 * 1000);
          this.form.patchValue({ vencimiento: artDate.toISOString().split('T')[0] });
        }
      }
    });
  }

  // Helpers para etiquetas
  get etiquetas(): string[] {
    return this.form.get('etiquetas')?.value || [];
  }

  addEtiqueta(): void {
    const val = this.etiquetaInput().trim();
    if (!val) return;
    
    const current = this.etiquetas;
    if (current.includes(val)) {
      this.etiquetaInput.set('');
      return;
    }

    this.form.patchValue({
      etiquetas: [...current, val]
    });
    this.etiquetaInput.set('');
  }

  removeEtiqueta(index: number): void {
    const current = this.etiquetas;
    this.form.patchValue({
      etiquetas: current.filter((_, i) => i !== index)
    });
  }

  onEtiquetaKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addEtiqueta();
    }
  }

  onCategoriaSelected(id: string | number): void {
    this.form.get('categoria')!.setValue(id as CategoriaTarea);
  }

  onPrioridadSelected(id: string | number): void {
    this.form.get('prioridad')!.setValue(id as PrioridadTarea);
  }

  toggleEmpleado(uid: string): void {
    const list = this.form.get('empleados')?.value || [];
    const current = [...list];
    const idx = current.indexOf(uid);
    if (idx !== -1) {
      current.splice(idx, 1);
    } else {
      current.push(uid);
    }
    this.form.patchValue({ empleados: current });
  }

  isEmpleadoSelected(uid: string): boolean {
    return (this.form.get('empleados')?.value || []).includes(uid);
  }

  onRemoveEmpleado(uid: string): void {
    const current = this.form.get('empleados')?.value || [];
    this.form.patchValue({
      empleados: current.filter((id: string) => id !== uid)
    });
  }

  private parseFechaArgentina(fechaStr: string): Timestamp {
    const [year, month, day] = fechaStr.split('-').map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, 3, 0, 0));
    return Timestamp.fromDate(utcDate);
  }

  getEmpleadoById(uid: string): Usuario | undefined {
    return this.empleados().find(e => e.uid === uid);
  }

  submit(): void {
    if (!this.form.valid) {
      this.toast.warning('Completa los campos obligatorios');
      return;
    }

    const formValue = this.form.getRawValue() as any;
    const uids = formValue.empleados || [];
    const nombres = uids.map((uid: string) => {
      const emp = this.empleados().find(e => e.uid === uid);
      return emp ? `${emp.nombre} ${emp.apellido}` : uid;
    });

    const opcionales: Partial<Pick<TareaInput, 'fechaVencimiento' | 'fechaInicio' | 'fechaCompletada'>> = {};
    if (formValue.vencimiento) {
      opcionales.fechaVencimiento = this.parseFechaArgentina(formValue.vencimiento);
    }
    if (this.tarea()?.fechaInicio) {
      opcionales.fechaInicio = this.tarea()!.fechaInicio;
    }
    if (this.tarea()?.fechaCompletada) {
      opcionales.fechaCompletada = this.tarea()!.fechaCompletada;
    }

    const data: TareaInput = {
      titulo: (formValue.titulo || '').trim(),
      descripcion: (formValue.descripcion || '').trim(),
      categoria: formValue.categoria || 'administrativo',
      prioridad: formValue.prioridad || PrioridadTarea.MEDIA,
      esUrgente: formValue.prioridad === PrioridadTarea.URGENTE,
      estado: this.tarea()?.estado ?? EstadoTarea.PENDIENTE,
      progreso: this.tarea()?.progreso ?? 0,
      creadaPor: this.tarea()?.creadaPor ?? this.adminUid(),
      asignadaA: uids,
      asignadaANombres: nombres,
      fechaCreacion: this.tarea()?.fechaCreacion ?? Timestamp.now(),
      comentarios: this.tarea()?.comentarios ?? [],
      etiquetas: (formValue.etiquetas || []).length > 0 ? formValue.etiquetas : [],
      archivada: this.tarea()?.archivada ?? false,
      ...opcionales,
    };

    this.saved.emit(data);
  }

  triggerClose(): void {
    if (this.isClosing()) return;
    this.isClosing.set(true);
    setTimeout(() => {
      this.closed.emit();
    }, 400);
  }

  close(): void {
    this.triggerClose();
  }
}
