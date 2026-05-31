import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    computed,
    effect,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HorariosLaborales, FranjaHoraria, ModalidadFranjaHoraria } from '@derma/models';
import { ToggleComponent } from '../../toggle/toggle.component';
import { UiTimePickerComponent } from '../ui-time-picker/ui-time-picker.component';

interface DaySchedule {
    key: keyof HorariosLaborales;
    label: string;
    isActive: boolean;
    franjas: FranjaHoraria[];
}

interface ProfesionalInfo {
    name: string;
    initials: string;
    specialty: string;
    active: boolean;
}

const DEFAULT_DAYS: DaySchedule[] = [
    { key: 'lunes',     label: 'Lunes',     isActive: false, franjas: [] },
    { key: 'martes',    label: 'Martes',    isActive: false, franjas: [] },
    { key: 'miercoles', label: 'Miércoles', isActive: false, franjas: [] },
    { key: 'jueves',    label: 'Jueves',    isActive: false, franjas: [] },
    { key: 'viernes',   label: 'Viernes',   isActive: false, franjas: [] },
    { key: 'sabado',    label: 'Sábado',    isActive: false, franjas: [] },
    { key: 'domingo',   label: 'Domingo',   isActive: false, franjas: [] },
];

@Component({
    selector: 'ui-schedule-selector',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ToggleComponent, UiTimePickerComponent],
    templateUrl: './schedule-selector.component.html',
    styleUrl: './schedule-selector.component.css',
})
export class ScheduleSelectorComponent {
    private readonly cdr = inject(ChangeDetectorRef);

    /** Evita pisar estado local cuando el objeto del padre no cambió realmente. */
    private lastScheduleFingerprint = '';

    initialSchedule = input<HorariosLaborales | null>(null);
    profesionalInfo = input<ProfesionalInfo | null>(null);
    /** Muestra selector de modalidad (presencial / videoconsulta / ambas) por franja. */
    showModalidad = input(true);
    scheduleChange  = output<HorariosLaborales>();

    readonly modalidadOptions: { id: ModalidadFranjaHoraria; label: string }[] = [
        { id: 'presencial', label: 'Presencial' },
        { id: 'videoconsulta', label: 'Videoconsulta' },
        { id: 'ambas', label: 'Ambas' },
    ];

    // Modo edición
    editMode = signal(false);
    editSchedule = signal<DaySchedule[]>([]);
    selectedDay = signal<string>('lunes');

    // Datos del profesional
    profesional = computed<ProfesionalInfo>(() => {
        if (this.profesionalInfo()) {
            return this.profesionalInfo()!;
        }
        return {
            name: 'Profesional',
            initials: 'PR',
            specialty: 'Dermatólogo',
            active: true,
        };
    });

    // Día seleccionado con su label completo
    selectedDayFull = computed(() => {
        const dayKey = this.selectedDay();
        return this.days().find(d => d.key === dayKey) || this.days()[0];
    });

    /**
     * Importante: no usar linkedSignal aquí.
     * Con mutaciones in-place + recomputaciones del fuente hubo inconsistencias OnPush al cambiar modalidad por franja.
     * Sincronizamos desde el input con efecto profundo clone estructural.
     */
    days = signal<DaySchedule[]>(this.buildDaysFromSchedule(null));

    constructor() {
        effect(() => {
            const inp = this.initialSchedule();
            if (this.editMode()) return;
            const fp = JSON.stringify(inp ?? {});
            if (fp === this.lastScheduleFingerprint) return;
            this.lastScheduleFingerprint = fp;
            this.days.set(this.buildDaysFromSchedule(inp));
        });
    }

    /** Clave estable para `@for` de franjas (solo índices y props permitidas en `track`). */
    franjaTrackKey(index: number, franja: FranjaHoraria): string {
        const dayKey = this.selectedDay();
        return `${String(dayKey)}:${index}:${franja.horaInicio}:${franja.horaFin}:${franja.modalidad ?? 'ambas'}`;
    }

    private buildDaysFromSchedule(schedule: HorariosLaborales | null): DaySchedule[] {
        if (!schedule) {
            return DEFAULT_DAYS.map(d => ({ ...d, franjas: [] }));
        }
        return DEFAULT_DAYS.map(d => {
            const raw = schedule[d.key];
            const franjas: FranjaHoraria[] = Array.isArray(raw)
                ? raw.map(fr => ({ ...fr }))
                : [];
            return { ...d, isActive: franjas.length > 0, franjas };
        });
    }

    /** Clona un día solo si hace falta (inmutable). */
    private mapDays(
        dayKey: keyof HorariosLaborales,
        replacer: (day: DaySchedule) => DaySchedule,
    ): void {
        this.days.update(list =>
            list.map(d => (d.key === dayKey ? replacer(d) : d)),
        );
    }

    // Computed: horas totales semanales
    totalHoras = computed<number>(() => {
        const workDays = this.editMode() ? this.editSchedule() : this.days();
        return workDays.reduce((total, day) => {
            if (!day.isActive) return total;
            return total + day.franjas.reduce((dayHours, franja) => {
                const [inicioH] = franja.horaInicio.split(':').map(Number);
                const [finH] = franja.horaFin.split(':').map(Number);
                return dayHours + Math.max(0, finH - inicioH);
            }, 0);
        }, 0);
    });

    // Computed: cantidad de días activos
    activeDaysCount = computed<number>(() => {
        return this.days().filter(d => d.isActive).length;
    });

    // Calcular horas disponibles en un día
    horasDelDia(day: DaySchedule): number {
        return day.franjas.reduce((total, franja) => {
            const [inicioH] = franja.horaInicio.split(':').map(Number);
            const [finH] = franja.horaFin.split(':').map(Number);
            return total + Math.max(0, finH - inicioH);
        }, 0);
    }

    // Mapear key del día al nombre completo en español
    getDayName(dayKey: string): string {
        const dayNames: Record<string, string> = {
            lunes: 'Lunes',
            martes: 'Martes',
            miercoles: 'Miércoles',
            jueves: 'Jueves',
            viernes: 'Viernes',
            sabado: 'Sábado',
            domingo: 'Domingo'
        };
        return dayNames[dayKey] || 'Día';
    }

    // Calcular diferencia de horas entre dos horarios
    getHorasDiferencia(franja: FranjaHoraria): number {
        const [inicioH] = franja.horaInicio.split(':').map(Number);
        const [finH] = franja.horaFin.split(':').map(Number);
        return Math.max(0, finH - inicioH);
    }

    modalidadFranja(franja: FranjaHoraria): ModalidadFranjaHoraria {
        return franja.modalidad ?? 'ambas';
    }

    etiquetaModalidad(modalidad: ModalidadFranjaHoraria): string {
        return this.modalidadOptions.find(o => o.id === modalidad)?.label ?? 'Ambas';
    }

    setModalidadFranja(dayKey: keyof HorariosLaborales, index: number, modalidad: ModalidadFranjaHoraria): void {
        if (this.editMode()) {
            this.editSchedule.update(list =>
                list.map(d =>
                    d.key !== dayKey
                        ? d
                        : {
                              ...d,
                              franjas: d.franjas.map((fr, i) =>
                                  i === index ? { ...fr, modalidad } : fr,
                              ),
                          },
                ),
            );
        } else {
            this.mapDays(dayKey, d => ({
                ...d,
                franjas: d.franjas.map((fr, i) =>
                    i === index ? { ...fr, modalidad } : fr,
                ),
            }));
        }
        this.emitChanges();
        this.cdr.markForCheck();
    }

    private franjaNueva(): FranjaHoraria {
        return { horaInicio: '09:00', horaFin: '17:00', modalidad: 'ambas' };
    }

    // Entrar/salir de modo edición via toggle
    toggleEditMode(isEnabled: boolean): void {
        if (isEnabled) {
            // Entrando en modo edición - crear copia editable
            this.editSchedule.set(structuredClone(this.days()));
            this.editMode.set(true);
        } else {
            // Saliendo de modo edición - validar y guardar si es necesario
            const allValid = this.editSchedule().every(day =>
                day.franjas.every(franja => {
                    const [inicioH, inicioM] = franja.horaInicio.split(':').map(Number);
                    const [finH, finM] = franja.horaFin.split(':').map(Number);
                    const inicioTotal = inicioH * 60 + inicioM;
                    const finTotal = finH * 60 + finM;
                    return finTotal > inicioTotal;
                })
            );

            if (allValid) {
                // Guardar cambios
                this.days.set(structuredClone(this.editSchedule()));
                this.emitChanges();
            } else {
                // Volver a edición si hay errores
                this.editMode.set(true);
                console.warn('Validación fallida: revisa que las horas fin sean posteriores a las horas inicio');
            }
            
            if (allValid) {
                this.editMode.set(false);
            }
        }
    }

    // Cancelar edición
    cancelEdit(): void {
        this.editMode.set(false);
        this.editSchedule.set([]);
    }

    // Guardar cambios
    saveEdit(): void {
        // Validar que todas las horas fin sean > que horas inicio
        const allValid = this.editSchedule().every(day =>
            day.franjas.every(franja => {
                const [inicioH, inicioM] = franja.horaInicio.split(':').map(Number);
                const [finH, finM] = franja.horaFin.split(':').map(Number);
                const inicioTotal = inicioH * 60 + inicioM;
                const finTotal = finH * 60 + finM;
                return finTotal > inicioTotal;
            })
        );

        if (!allValid) {
            console.warn('Validación fallida: hora fin debe ser posterior a hora inicio');
            return;
        }

        // Copiar cambios editados a los días principales
        this.days.set(structuredClone(this.editSchedule()));
        this.editMode.set(false);
        this.emitChanges();
    }

    // Toggle día activo/inactivo
    toggleDayActive(day: DaySchedule): void {
        const key = day.key;
        if (this.editMode()) {
            this.editSchedule.update(list =>
                list.map(d =>
                    d.key !== key
                        ? d
                        : (() => {
                              const active = !d.isActive;
                              const franjas =
                                  active && d.franjas.length === 0
                                      ? [this.franjaNueva()]
                                      : [...d.franjas];
                              return { ...d, isActive: active, franjas };
                          })(),
                ),
            );
        } else {
            this.mapDays(key, d => {
                const active = !d.isActive;
                const franjas =
                    active && d.franjas.length === 0
                        ? [this.franjaNueva()]
                        : [...d.franjas];
                return { ...d, isActive: active, franjas };
            });
        }
        this.emitChanges();
    }

    // Agregar franja a un día
    addFranjaToDay(dayKey: keyof HorariosLaborales): void {
        if (this.editMode()) {
            this.editSchedule.update(list =>
                list.map(d =>
                    d.key === dayKey && d.isActive
                        ? {
                              ...d,
                              franjas: [...d.franjas, this.franjaNueva()],
                          }
                        : d,
                ),
            );
        } else {
            this.mapDays(dayKey, d =>
                !d.isActive
                    ? d
                    : { ...d, franjas: [...d.franjas, this.franjaNueva()] },
            );
        }
        this.emitChanges();
    }

    // Eliminar franja específica
    removeFranja(dayKey: keyof HorariosLaborales, index: number): void {
        if (this.editMode()) {
            this.editSchedule.update(list =>
                list.map(d => {
                    if (d.key !== dayKey) return d;
                    const franjas = d.franjas.filter((_, i) => i !== index);
                    return {
                        ...d,
                        franjas,
                        isActive: franjas.length > 0 ? d.isActive : false,
                    };
                }),
            );
        } else {
            this.mapDays(dayKey, d => {
                const franjas = d.franjas.filter((_, i) => i !== index);
                return {
                    ...d,
                    franjas,
                    isActive: franjas.length > 0 ? d.isActive : false,
                };
            });
        }
        this.emitChanges();
    }

    // Emitir cambios al componente padre
    emitChanges(): void {
        const schedule: HorariosLaborales = {};
        const workDays = this.editMode() ? this.editSchedule() : this.days();
        for (const day of workDays) {
            if (day.isActive && day.franjas.length > 0) {
                // Validar que todas las franjas sean válidas
                const franjas = day.franjas.filter(f => {
                    const [inicioH, inicioM] = f.horaInicio.split(':').map(Number);
                    const [finH, finM] = f.horaFin.split(':').map(Number);
                    const inicioTotal = inicioH * 60 + inicioM;
                    const finTotal = finH * 60 + finM;
                    return finTotal > inicioTotal;
                });
                if (franjas.length > 0) {
                    schedule[day.key] = franjas;
                }
            }
        }
        this.scheduleChange.emit(schedule);
    }
}
