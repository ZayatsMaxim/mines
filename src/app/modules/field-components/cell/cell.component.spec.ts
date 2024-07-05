/* eslint-disable prefer-const */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CellComponent } from '../cell/cell.component';
import { GameState, GameStateService } from '../../services/game-state.service';

describe('CellComponent', () => {
  let component: CellComponent;
  let fixture: ComponentFixture<CellComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CellComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CellComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('posX', 0);
    fixture.componentRef.setInput('posY', 0);
    fixture.componentRef.setInput('content', 0);

    component.flagged = false;
  });

  it('should create a component', () => {
    expect(component).toBeTruthy();
  });

  it('should return void by handleRightClick if game state is STARTED', () => {
    const gameStateService = TestBed.inject(GameStateService);
    gameStateService.gameState.set(GameState.Started);

    const rightClickEvent = new MouseEvent('click', {});

    const clickResult = component.handleRightClick(rightClickEvent);

    expect(clickResult).toBe(void 0); // ??????
  });

  it('should ')

  it('should set flag on right click if cell is not questionned, not revealed, not flagged', () => {
    const gameStateService = TestBed.inject(GameStateService);
    gameStateService.gameState.set(GameState.Started);

    component.revealed = false;
    component.questionned = false;
    component.flagged = false;

    const rightClickEvent = new MouseEvent('click', {});
    component.handleRightClick(rightClickEvent);

    expect(component.flagged).toBeTrue();
  });

  it('should set question mark on right click if cell is not questionned, not revealed, is flagged', () => {
    const gameStateService = TestBed.inject(GameStateService);
    gameStateService.gameState.set(GameState.Started);

    component.revealed = false;
    component.questionned = false;
    component.flagged = true;

    const rightClickEvent = new MouseEvent('click', {});
    component.handleRightClick(rightClickEvent);

    expect(component.questionned).toBeTrue();
  });

  it('should remove question mark on right click if cell is questionned, not revealed, no flagged', () => {
    const gameStateService = TestBed.inject(GameStateService);
    gameStateService.gameState.set(GameState.Started);

    component.revealed = false;
    component.questionned = true;
    component.flagged = false;

    const rightClickEvent = new MouseEvent('click', {});
    component.handleRightClick(rightClickEvent);

    expect(component.questionned).toBeFalse();
  });
});
