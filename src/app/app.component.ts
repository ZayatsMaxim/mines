import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FieldComponent } from './modules/ui/field/field.component';
import { InputNumberModule } from 'primeng/inputnumber';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FieldComponent, InputNumberModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'mines';
}
