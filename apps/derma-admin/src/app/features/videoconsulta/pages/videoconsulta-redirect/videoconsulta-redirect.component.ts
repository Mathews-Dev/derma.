import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/** Redirige /videoconsultas/:id → listado con sidebar (?detalle=id). */
@Component({
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoconsultaRedirectComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    void this.router.navigate(['/admin/videoconsultas'], {
      queryParams: id ? { detalle: id } : {},
      replaceUrl: true,
    });
  }
}
