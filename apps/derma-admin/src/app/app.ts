import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RegisterStaffComponent } from "./features/auth/register-staff/register-staff.component";

@Component({
  imports: [RouterModule, RegisterStaffComponent],
  selector: 'derm-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'derma-admin';
}
