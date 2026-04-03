import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  viewChild,
  ElementRef,
} from '@angular/core';
import { TooltipComponent } from '../tooltip/tooltip.component';

@Component({
  selector: 'ui-profile-avatar',
  standalone: true,
  imports: [TooltipComponent],
  templateUrl: './profile-avatar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiProfileAvatarComponent {
  /** URL de la foto actual (vacío = sin foto) */
  photoUrl    = input<string>('');
  /** Muestra el spinner de carga */
  isUploading = input<boolean>(false);
  /** Muestra el botón de quitar foto */
  canRemove   = input<boolean>(true);
  /** circle = redondo (editar), rounded = con bordes redondeados (perfil) */
  shape       = input<'circle' | 'rounded'>('circle');

  fileSelected = output<File>();
  removed      = output<void>();

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  triggerUpload(): void {
    this.fileInput()?.nativeElement.click();
  }

  onFileChange(event: Event): void {
    const input  = event.target as HTMLInputElement;
    const file   = input.files?.[0];
    if (file) {
      this.fileSelected.emit(file);
      input.value = '';
    }
  }

  onRemove(event: MouseEvent): void {
    event.stopPropagation();
    this.removed.emit();
  }
}
