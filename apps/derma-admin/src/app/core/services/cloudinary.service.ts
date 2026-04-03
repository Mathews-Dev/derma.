import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
}

@Injectable()
export class CloudinaryService {
  private readonly http = inject(HttpClient);

  private readonly cloudName    = environment.cloudinary!.cloudName;
  private readonly uploadPreset = environment.cloudinary!.uploadPreset;
  private readonly uploadUrl    = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

  upload(file: File): Promise<CloudinaryUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    return lastValueFrom(
      this.http
        .post<{ public_id: string; secure_url: string }>(this.uploadUrl, formData)
        .pipe(map(r => ({ publicId: r.public_id, secureUrl: r.secure_url })))
    );
  }
}
