import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { GameState, GameStateService } from '../../services/game-state.service';

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
  posX = input.required<number>();
  posY = input.required<number>();

  get coords(): CellCoordinates {
    return { posX: this.posX(), posY: this.posY() };
  }

  cellReveal = output<CellCoordinates>();
  cellFlaging = output<CellCoordinates>();

  revealed: boolean = false;
  flagged: boolean = false;
  questionned: boolean = false;

  constructor(private gameStateService: GameStateService) {}

  handleLeftClick() {
    if (this.gameStateService.gameState() !== GameState.Started || this.flagged)
      return;
    if (this.content() === -1) this.gameStateService.endGame();
    this.cellReveal.emit({ posX: this.posX()!, posY: this.posY()! });
  }

  handleRightClick(event: Event) {
    event.preventDefault();
    if (this.gameStateService.gameState() !== GameState.Started) return;
    if (this.gameStateService.flagsRemain() === 0 && !this.flagged) return;
    if (this.revealed) return;

    if (this.flagged) {
      this.questionned = true;
      this.gameStateService.cellsFlaged.update(value => value - 1);
      this.flagged = false;
      this.cellFlaging.emit({ posX: this.posX()!, posY: this.posY()! });
    } else {
      if (this.questionned) {
        this.questionned = false;
      } else {
        this.flagged = true;
        this.gameStateService.cellsFlaged.update(value => value + 1);
        this.cellFlaging.emit({ posX: this.posX()!, posY: this.posY()! });
      }
    }
  }

  revealSelf() {
    this.revealed = true;
    if (this.content() === -1) this.gameStateService.endGame();
  }

  hideSelf() {
    this.revealed = false;
    this.flagged = false;
    this.questionned = false;
  }
}
