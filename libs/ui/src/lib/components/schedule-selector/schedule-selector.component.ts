import { Component, EventEmitter, Input, input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HorariosLaborales, FranjaHoraria } from '@derma/models';

interface DaySchedule {
    key: keyof HorariosLaborales;
    label: string;
    shortLabel: string;
    isActive: boolean;
    franjas: FranjaHoraria[];
}

@Component({
    selector: 'ui-schedule-selector',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './schedule-selector.component.html',
    styleUrl: './schedule-selector.component.css'
})
export class ScheduleSelectorComponent {
    // using regular input with setter for backward compatibility, or Signals
    @Input() set initialSchedule(value: HorariosLaborales | null) {
        if (value) {
            this.resetDays();
            this.loadSchedule(value);
        }
    }

    @Output() scheduleChange = new EventEmitter<HorariosLaborales>();

    isOpen = signal(false);
    hasSchedule = signal(false);

    selectedDayKey = signal<string>('lunes');

    days = signal<DaySchedule[]>([
        { key: 'lunes', label: 'Lunes', shortLabel: 'Lun', isActive: false, franjas: [] },
        { key: 'martes', label: 'Martes', shortLabel: 'Mar', isActive: false, franjas: [] },
        { key: 'miercoles', label: 'Miércoles', shortLabel: 'Mié', isActive: false, franjas: [] },
        { key: 'jueves', label: 'Jueves', shortLabel: 'Jue', isActive: false, franjas: [] },
        { key: 'viernes', label: 'Viernes', shortLabel: 'Vie', isActive: false, franjas: [] },
        { key: 'sabado', label: 'Sábado', shortLabel: 'Sáb', isActive: false, franjas: [] },
        { key: 'domingo', label: 'Domingo', shortLabel: 'Dom', isActive: false, franjas: [] },
    ]);

    private resetDays() {
        this.days.set([
            { key: 'lunes', label: 'Lunes', shortLabel: 'Lun', isActive: false, franjas: [] },
            { key: 'martes', label: 'Martes', shortLabel: 'Mar', isActive: false, franjas: [] },
            { key: 'miercoles', label: 'Miércoles', shortLabel: 'Mié', isActive: false, franjas: [] },
            { key: 'jueves', label: 'Jueves', shortLabel: 'Jue', isActive: false, franjas: [] },
            { key: 'viernes', label: 'Viernes', shortLabel: 'Vie', isActive: false, franjas: [] },
            { key: 'sabado', label: 'Sábado', shortLabel: 'Sáb', isActive: false, franjas: [] },
            { key: 'domingo', label: 'Domingo', shortLabel: 'Dom', isActive: false, franjas: [] },
        ]);
    }

    openModal() { this.isOpen.set(true); }
    closeModal() { this.isOpen.set(false); }

    selectDay(key: string) {
        this.selectedDayKey.set(key);
    }

    get selectedDay(): DaySchedule {
        return this.days().find(d => d.key === this.selectedDayKey())!;
    }

    toggleDayActive(day: DaySchedule) {
        this.days.update(currentDays => {
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

    addFranjaToSelected() {
        const currentKey = this.selectedDayKey();
        this.days.update(currentDays => {
            const d = currentDays.find(x => x.key === currentKey);
            if (d) {
                d.franjas.push({ horaInicio: '09:00', horaFin: '17:00' });
            }
            return [...currentDays];
        });
    }

    removeFranjaFromSelected(index: number) {
        const currentKey = this.selectedDayKey();
        this.days.update(currentDays => {
            const d = currentDays.find(x => x.key === currentKey);
            if (d) {
                d.franjas.splice(index, 1);
            }
            return [...currentDays];
        });
    }

    saveSchedule() {
        const schedule: HorariosLaborales = {};
        let hasEntries = false;

        this.days().forEach(day => {
            if (day.isActive && day.franjas.length > 0) {
                schedule[day.key] = day.franjas;
                hasEntries = true;
            }
        });

        this.hasSchedule.set(hasEntries);
        this.scheduleChange.emit(schedule);
        this.isOpen.set(false);
    }

    private loadSchedule(schedule: HorariosLaborales) {
        this.days.update(currentDays => {
            currentDays.forEach(day => {
                const franjas = schedule[day.key];
                if (franjas && franjas.length > 0) {
                    day.isActive = true;
                    day.franjas = JSON.parse(JSON.stringify(franjas));
                }
            });
            return [...currentDays];
        });
        this.hasSchedule.set(Object.keys(schedule).length > 0);
    }
}
