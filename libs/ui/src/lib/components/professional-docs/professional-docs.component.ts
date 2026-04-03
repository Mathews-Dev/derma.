import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import {
  DocKey,
  DocumentosDetallados,
  EstadoDocumento,
} from '@derma/models';

@Component({
  selector: 'ui-professional-docs',
  standalone: true,
  imports: [],
  templateUrl: './professional-docs.component.html',
  styleUrl: './professional-docs.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalDocsComponent {
  documentos  = input<DocumentosDetallados | null>(null);
  editable    = input<boolean>(false);
  canUpload   = input<boolean>(true);

  fileSelected   = output<{ key: DocKey; file: File }>();
  estadoChanged  = output<{ key: DocKey; estado: EstadoDocumento; nota?: string }>();

  readonly EstadoDocumento = EstadoDocumento;

  readonly docTypes: DocKey[] = [
    'dniFrente',
    'dniReverso',
    'matriculaNacional',
    'matriculaProvincial',
    'diploma',
  ];

  readonly labels: Record<DocKey, string> = {
    dniFrente:          'DNI Frente',
    dniReverso:         'DNI Reverso',
    matriculaNacional:  'M. Nacional',
    matriculaProvincial:'M. Provincial',
    diploma:            'Diploma',
  };

  // Lightbox — emite hacia el padre para que lo renderice fuera de transforms
  imageOpened = output<string>();

  // Inline action: which card+action is expanded
  activeAction = signal<{ key: DocKey; type: 'rechazar' | 'reenvio' } | null>(null);
  actionNota   = signal<string>('');

  // Upload loading state per doc
  uploadingKey = signal<DocKey | null>(null);

  onFileSelected(event: Event, key: DocKey): void {
    const el = event.target as HTMLInputElement;
    if (el.files?.[0]) {
      this.fileSelected.emit({ key, file: el.files[0] });
    }
    el.value = '';
  }

  aprobar(key: DocKey): void {
    this.estadoChanged.emit({ key, estado: EstadoDocumento.APROBADO });
    this.cancelarAccion();
  }

  toggleAction(key: DocKey, type: 'rechazar' | 'reenvio'): void {
    const cur = this.activeAction();
    if (cur?.key === key && cur?.type === type) {
      this.cancelarAccion();
    } else {
      this.activeAction.set({ key, type });
      this.actionNota.set('');
    }
  }

  confirmarAccion(): void {
    const action = this.activeAction();
    if (!action) return;
    const estado = action.type === 'rechazar'
      ? EstadoDocumento.RECHAZADO
      : EstadoDocumento.SOLICITAR_REENVIO;
    this.estadoChanged.emit({ key: action.key, estado, nota: this.actionNota() || undefined });
    this.cancelarAccion();
  }

  cancelarAccion(): void {
    this.activeAction.set(null);
    this.actionNota.set('');
  }

  openLightbox(url: string | undefined): void {
    if (url) this.imageOpened.emit(url);
  }
}

