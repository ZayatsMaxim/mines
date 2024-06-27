import { computed, Injectable, signal } from '@angular/core';

export enum GameState {
  Paused,
  Started,
  Lose,
  Win,
}

@Injectable({
  providedIn: 'root',
})
export class GameStateService {
  gameState = signal<GameState>(GameState.Paused);

  restartSignal = signal<number>(0);
  gamesWonAmount = signal<number>(0);
  size = signal<number>(4);
  minesAmount = signal<number>(2);
  cellsFlaged = signal<number>(0);

  flagsRemain = computed(() => this.minesAmount() - this.cellsFlaged());

  startGame() {
    this.gameState.set(GameState.Started);
    this.restartSignal.update(value => value + 1);
    this.cellsFlaged.set(0);
  }

  winGame() {
    this.gameState.set(GameState.Win);
    this.gamesWonAmount.update(value => value + 1);
  }

  endGame() {
    this.gameState.set(GameState.Lose);
  }
}
