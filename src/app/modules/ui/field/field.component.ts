import { CommonModule } from '@angular/common';
import { Component, computed, effect, input } from '@angular/core';
import { CellComponent } from '../cell/cell.component';

@Component({
  selector: 'app-field',
  standalone: true,
  imports: [CommonModule, CellComponent],
  templateUrl: './field.component.html',
  styleUrl: './field.component.scss',
})
export class FieldComponent {
  size = input.required<number>();
  minesAmount = input.required<number>();

  fieldWidth = computed(() => this.size() * 50 + (this.size() - 1) * 2);

  mines: number[][] = [];

  fieldGenerationEffect = effect(() => {
    console.log(this.size());
    console.log(this.minesAmount());

    for (let i = 0; i < this.size(); i++) {
      this.mines[i] = new Array(this.size()).fill(0);
    }
    console.log(this.mines);

    this.setMines();
    // this.calculateNearMines();
  });

  setMines() {
    let i: number = 0;

    while (i < this.minesAmount()) {
      const x = Math.floor(Math.random() * this.size());
      const y = Math.floor(Math.random() * this.size());
      if (this.mines[x][y] == 1) continue;
      this.mines[x][y] = 1;
      i++;
    }
  }

  calculateNearMines(x: number, y: number): number {
    if (this.outOfBounds(x, y)) return 0;

    let i: number = 0;

    for (let offsetX = -1; offsetX < 1; offsetX++) {
      for (let offsetY = -1; offsetY < 1; offsetY++) {
        if (this.outOfBounds(offsetX + x, offsetY + y)) continue;
        i += this.mines[offsetX + x][offsetY + y];
      }
    }

    return i;
  }

  outOfBounds(x: number, y: number): boolean {
    return x < 0 || y < 0 || x >= this.size() || y >= this.size();
  }
}
