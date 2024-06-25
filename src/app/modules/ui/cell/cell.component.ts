import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { GameStateService } from '../../services/game-state.service';

export interface CellCoordinates {
  posX: number;
  posY: number;
}

@Component({
  selector: 'app-cell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cell.component.html',
  styleUrl: './cell.component.scss',
})
export class CellComponent {
  content = input<number>();
  posX = input<number>();
  posY = input<number>();

  cellReveal = output<CellCoordinates>();

  revealed: boolean = false;
  flagged: boolean = false;

  constructor(private gameStateService: GameStateService) {}

  handleLeftClick() {
    if (!this.gameStateService.gameStarted || this.flagged) return;
    this.cellReveal.emit({ posX: this.posX()!, posY: this.posY()! });
    this.revealed = true;
    // TODO: reveal nearest cells on click!
  }

  handleRightClick(event: Event) {
    if (!this.gameStateService.gameStarted) return;
    event.preventDefault();
    this.flagged = !this.flagged;
  }
}
