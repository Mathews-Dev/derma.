import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FirestoreService } from '@derma/firebase';
import { ConfiguracionClinica } from '@derma/models';
import {
  UiInputComponent,
  UiButtonComponent,
  UiPageHeaderComponent,
  UiLoaderCardComponent,
  ToastService,
} from '@derma/ui';

type ConfigTab = 'clinica' | 'horarios' | 'sistema';

@Component({
  selector: 'derm-configuracion',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    UiInputComponent,
    UiPageHeaderComponent,
    UiLoaderCardComponent,
  ],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionComponent implements OnInit {
  private readonly firestoreService = inject(FirestoreService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly CLINICA_DOC_ID = 'config';

  activeTab = signal<ConfigTab>('clinica');
  isLoading = signal(true);
  isSubmitting = signal(false);

  readonly tabs: { id: ConfigTab; label: string }[] = [
    { id: 'clinica', label: 'Información de la Clínica' },
    { id: 'horarios', label: 'Horarios y Turnos' },
    { id: 'sistema', label: 'Sistema' },
  ];

  readonly diasSemana: { key: keyof ConfiguracionClinica['horarioAtencion']; label: string }[] = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' },
  ];

  clinicaForm: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    razonSocial: [''],
    cuit: [''],
    telefono: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    direccion: ['', Validators.required],
    ciudad: ['', Validators.required],
    provincia: ['', Validators.required],
    pais: ['Argentina'],
    sitioWeb: [''],
    descripcion: [''],
    whatsappNumero: [''],
  });

  horariosForm: FormGroup = this.fb.group({
    duracionTurnoMinutos: [30, [Validators.required, Validators.min(10)]],
    intervaloCancelacionHoras: [24, [Validators.required, Validators.min(1)]],
    lunes_inicio: ['09:00'],
    lunes_fin: ['18:00'],
    martes_inicio: ['09:00'],
    martes_fin: ['18:00'],
    miercoles_inicio: ['09:00'],
    miercoles_fin: ['18:00'],
    jueves_inicio: ['09:00'],
    jueves_fin: ['18:00'],
    viernes_inicio: ['09:00'],
    viernes_fin: ['18:00'],
    sabado_inicio: [''],
    sabado_fin: [''],
    domingo_inicio: [''],
    domingo_fin: [''],
  });

  ngOnInit(): void {
    this.loadConfig();
  }

  private async loadConfig(): Promise<void> {
    this.isLoading.set(true);
    try {
      const data = await this.firestoreService.getDocument<ConfiguracionClinica>(
        'configuracion',
        this.CLINICA_DOC_ID,
      );
      if (data) {
        this.clinicaForm.patchValue({
          nombre: data.nombre,
          razonSocial: data.razonSocial ?? '',
          cuit: data.cuit ?? '',
          telefono: data.telefono,
          email: data.email,
          direccion: data.direccion,
          ciudad: data.ciudad,
          provincia: data.provincia,
          pais: data.pais,
          sitioWeb: data.sitioWeb ?? '',
          descripcion: data.descripcion ?? '',
          whatsappNumero: data.whatsappNumero ?? '',
        });
        this.horariosForm.patchValue({
          duracionTurnoMinutos: data.duracionTurnoMinutos,
          intervaloCancelacionHoras: data.intervaloCancelacionHoras,
          ...this.horariosToFormValues(data.horarioAtencion),
        });
      }
    } catch {
      this.toastService.error('Error al cargar la configuración');
    } finally {
      this.isLoading.set(false);
    }
  }

  private horariosToFormValues(
    horarios: ConfiguracionClinica['horarioAtencion'],
  ): Record<string, string> {
    const result: Record<string, string> = {};
    for (const dia of this.diasSemana) {
      const horario = horarios?.[dia.key];
      result[`${dia.key}_inicio`] = horario?.horaInicio ?? '';
      result[`${dia.key}_fin`] = horario?.horaFin ?? '';
    }
    return result;
  }

  setTab(tab: ConfigTab): void {
    this.activeTab.set(tab);
  }

  async saveClinica(): Promise<void> {
    if (this.clinicaForm.invalid) {
      this.clinicaForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    try {
      const partial: Partial<ConfiguracionClinica> = { ...this.clinicaForm.value };
      await this.firestoreService.setDocument<Partial<ConfiguracionClinica>>(
        'configuracion',
        this.CLINICA_DOC_ID,
        partial,
      );
      this.toastService.success('Información guardada correctamente');
    } catch {
      this.toastService.error('Error al guardar la información');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async saveHorarios(): Promise<void> {
    if (this.horariosForm.invalid) {
      this.horariosForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    try {
      const val = this.horariosForm.value as Record<string, string | number>;
      const horarioAtencion: ConfiguracionClinica['horarioAtencion'] = {};
      for (const dia of this.diasSemana) {
        const inicio = val[`${dia.key}_inicio`] as string;
        const fin = val[`${dia.key}_fin`] as string;
        if (inicio && fin) {
          horarioAtencion[dia.key] = { horaInicio: inicio, horaFin: fin };
        }
      }
      const partial: Partial<ConfiguracionClinica> = {
        duracionTurnoMinutos: Number(val['duracionTurnoMinutos']),
        intervaloCancelacionHoras: Number(val['intervaloCancelacionHoras']),
        horarioAtencion,
      };
      await this.firestoreService.setDocument<Partial<ConfiguracionClinica>>(
        'configuracion',
        this.CLINICA_DOC_ID,
        partial,
      );
      this.toastService.success('Horarios guardados correctamente');
    } catch {
      this.toastService.error('Error al guardar los horarios');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}

