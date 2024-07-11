import { TestBed } from '@angular/core/testing';
import { GameState, GameStateService } from './game-state.service';

describe('GameStateService', () => {
  let service: GameStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GameStateService],
    });

    service = TestBed.inject(GameStateService);
  });

  it('should update state, restartSignal and cellsRemain() on startGame()', () => {
    const restartSignalValue = service.restartSignal();
    service.startGame();

    expect(service.gameState()).toBe(GameState.Started);
    expect(service.cellsFlaged()).toEqual(0);
    expect(service.restartSignal()).toEqual(restartSignalValue + 1);
  });

  it('should update state and gamesWonAmount() on winGame()', () => {
    const gamesWonAmountSignalValue = service.gamesWonAmount();
    service.winGame();

    expect(service.gameState()).toBe(GameState.Win);
    expect(service.gamesWonAmount()).toEqual(gamesWonAmountSignalValue + 1);
  });

  it('should update state on endGame()', () => {
    service.endGame();

    expect(service.gameState()).toBe(GameState.Lose);
  });
});
