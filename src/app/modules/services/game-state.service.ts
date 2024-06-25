import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GameStateService {
  gameStarted = false;

  startGame() {
    this.gameStarted = true;
  }

  endGame() {
    this.gameStarted = false;
  }
}
