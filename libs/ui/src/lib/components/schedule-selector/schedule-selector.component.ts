import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    linkedSignal,
    output,
    signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HorariosLaborales, FranjaHoraria } from '@derma/models';
import { ToggleComponent } from '../../toggle/toggle.component';

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
    imports: [FormsModule, ToggleComponent],
    templateUrl: './schedule-selector.component.html',
    styleUrl: './schedule-selector.component.css',
})
export class ScheduleSelectorComponent {
    initialSchedule = input<HorariosLaborales | null>(null);
    profesionalInfo = input<ProfesionalInfo | null>(null);
    scheduleChange  = output<HorariosLaborales>();

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

    // Horarios (vista principal)
    days = linkedSignal<HorariosLaborales | null, DaySchedule[]>({
        source: () => this.initialSchedule(),
        computation: (schedule) => {
            if (!schedule) return DEFAULT_DAYS.map(d => ({ ...d, franjas: [] }));
            return DEFAULT_DAYS.map(d => {
                const franjas: FranjaHoraria[] = schedule[d.key]
                    ? JSON.parse(JSON.stringify(schedule[d.key]))
                    : [];
                return { ...d, isActive: franjas.length > 0, franjas };
            });
        },
    });

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

    // Entrar/salir de modo edición via toggle
    toggleEditMode(isEnabled: boolean): void {
        if (isEnabled) {
            // Entrando en modo edición - crear copia editable
            this.editSchedule.set(JSON.parse(JSON.stringify(this.days())));
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
                this.days.set(JSON.parse(JSON.stringify(this.editSchedule())));
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
        this.days.set(JSON.parse(JSON.stringify(this.editSchedule())));
        this.editMode.set(false);
        this.emitChanges();
    }

    // Toggle día activo/inactivo
    toggleDayActive(day: DaySchedule): void {
        const target = this.editMode() ? this.editSchedule : this.days;
        target.update(currentDays => {
            const d = currentDays.find(x => x.key === day.key);
            if (d) {
                d.isActive = !d.isActive;
                if (d.isActive && d.franjas.length === 0) {
                    d.franjas.push({ horaInicio: '09:00', horaFin: '17:00' });
                }
            }
            return [...currentDays];
        });
    }

    // Agregar franja a un día
    addFranjaToDay(dayKey: string): void {
        const target = this.editMode() ? this.editSchedule : this.days;
        target.update(currentDays => {
            const d = currentDays.find(x => x.key === dayKey);
            if (d && d.isActive) {
                d.franjas.push({ horaInicio: '09:00', horaFin: '17:00' });
            }
            return [...currentDays];
        });
    }

    // Eliminar franja específica
    removeFranja(dayKey: string, index: number): void {
        const target = this.editMode() ? this.editSchedule : this.days;
        target.update(currentDays => {
            const d = currentDays.find(x => x.key === dayKey);
            if (d) {
                d.franjas.splice(index, 1);
                // Si no quedan franjas, marcar día como inactivo
                if (d.franjas.length === 0) {
                    d.isActive = false;
                }
            }
            return [...currentDays];
        });
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
