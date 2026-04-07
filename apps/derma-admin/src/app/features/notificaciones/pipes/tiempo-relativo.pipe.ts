import { Pipe, PipeTransform } from '@angular/core';
import { Timestamp } from 'firebase/firestore';

@Pipe({ name: 'tiempoRelativo', standalone: true, pure: false })
export class TiempoRelativoPipe implements PipeTransform {
  transform(fecha: Timestamp | null | undefined): string {
    if (!fecha) return '';
    const ms   = Date.now() - fecha.toDate().getTime();
    const mins = Math.floor(ms / 60_000);
    const hrs  = Math.floor(ms / 3_600_000);
    const days = Math.floor(ms / 86_400_000);

    if (mins < 1)  return 'ahora';
    if (mins < 60) return `hace ${mins} min`;
    if (hrs  < 24) return `hace ${hrs} h`;
    if (days === 1) return 'ayer';
    if (days < 7)  return `hace ${days} días`;

    const d = fecha.toDate();
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    const year  = d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : '';
    return `${d.getDate()} ${meses[d.getMonth()]}${year}`;
  }
}

export function iconoPorTipo(tipo: string): string {
  switch (tipo) {
    case 'tarea_asignada':    return 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2';
    case 'tarea_en_progreso': return 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z';
    case 'tarea_en_revision': return 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z';
    case 'tarea_aprobada':    return 'm4.5 12.75 6 6 9-13.5';
    case 'tarea_completada':  return 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z';
    case 'tarea_cancelada':   return 'M6 18 18 6M6 6l12 12';
    case 'tarea_reasignada':  return 'M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5';
    case 'tarea_comentario':  return 'M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z';
    case 'tarea_por_vencer':  return 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z';
    case 'tarea_vencida':     return 'M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z';
    case 'inventario_bajo':   return 'M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z';
    default:                  return 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z';
  }
}

export function colorPorTipo(tipo: string): string {
  switch (tipo) {
    case 'tarea_aprobada':    return 'text-emerald-600';
    case 'tarea_completada':  return 'text-emerald-600';
    case 'tarea_vencida':     return 'text-red-500';
    case 'tarea_por_vencer':  return 'text-orange-400';
    case 'tarea_cancelada':   return 'text-red-400';
    case 'tarea_en_revision': return 'text-amber-500';
    case 'tarea_en_progreso': return 'text-sky-500';
    case 'tarea_reasignada':  return 'text-violet-500';
    default:                  return 'text-[var(--c-600)]';
  }
}

export function accentPorPrioridad(prioridad: string | undefined): string {
  switch (prioridad) {
    case 'urgente': return 'border-l-red-300';
    case 'alta':    return 'border-l-orange-200';
    case 'media':   return 'border-l-yellow-200';
    default:        return '';
  }
}
