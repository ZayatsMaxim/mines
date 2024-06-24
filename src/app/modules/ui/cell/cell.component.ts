import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-cell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cell.component.html',
  styleUrl: './cell.component.scss',
})
export class CellComponent {
  content = input.required<number>();
}
