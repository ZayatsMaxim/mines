import { Component, computed, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FieldComponent } from './modules/ui/field/field.component';
import { InputNumberModule } from 'primeng/inputnumber';
import { PrimeNGConfig } from 'primeng/api';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    FieldComponent,
    InputNumberModule,
    FloatLabelModule,
    ButtonModule,
    FormsModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  minesAmount = signal(2);
  fieldSize = signal(4);

  maxMines = computed(() =>
    Math.floor((this.fieldSize() * this.fieldSize()) / 2)
  );

  started = false;

  constructor(private primengConfig: PrimeNGConfig) {}

  ngOnInit() {
    this.primengConfig.ripple = true;
  }

  onPlay() {
    this.started = true;
  }

  title = 'mines';
}
