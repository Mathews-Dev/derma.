import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

type MpReturnKind = 'success' | 'failure' | 'pending';

@Component({
  selector: 'derm-mp-return',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wrap">
      <h1 class="title">Mercado Pago</h1>

      @switch (kind()) {
        @case ('success') { <p class="msg ok">Pago aprobado. Podés volver a la agenda.</p> }
        @case ('pending') { <p class="msg pend">Pago pendiente. Si se acredita, se actualizará automáticamente.</p> }
        @case ('failure') { <p class="msg err">Pago fallido o cancelado.</p> }
      }

      @if (externalReference()) {
        <p class="ref">Ref: {{ externalReference() }}</p>
      }

      <button class="btn" type="button" (click)="goAgenda()">Volver a Agenda</button>
    </div>
  `,
  styles: [
    `
      .wrap { padding: 28px; max-width: 520px; margin: 0 auto; }
      .title { font-size: 18px; font-weight: 700; margin: 0 0 10px; }
      .msg { margin: 0 0 10px; font-size: 13px; }
      .ok { color: #3d7a54; }
      .pend { color: #9e8530; }
      .err { color: #8c4444; }
      .ref { margin: 0 0 18px; font-size: 11px; color: #6b7280; word-break: break-all; }
      .btn { padding: 10px 14px; border-radius: 8px; border: 1px solid #111; background: #111; color: #fff; cursor: pointer; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MpReturnPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  kind = computed(() => {
    const first = this.route.snapshot.url[0]?.path;
    if (first === 'success' || first === 'failure' || first === 'pending') return first as MpReturnKind;
    return 'pending' as MpReturnKind;
  });

  externalReference = computed(() => this.route.snapshot.queryParamMap.get('external_reference'));

  goAgenda(): void {
    void this.router.navigateByUrl('/admin/agenda');
  }
}

