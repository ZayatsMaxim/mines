import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CellComponent } from '../cell/cell.component';
import { GameState, GameStateService } from '../../services/game-state.service';
import { CommonModule } from '@angular/common';

describe('CellComponent', () => {
  let component: CellComponent;
  let fixture: ComponentFixture<CellComponent>;
  let gameStateService: GameStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CellComponent);
    gameStateService = TestBed.inject(GameStateService);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('posX', 0);
    fixture.componentRef.setInput('posY', 0);
    fixture.componentRef.setInput('content', 0);

    gameStateService.gameState.set(GameState.Started);

    component.flagged = false;
  });

  it('should create a component', () => {
    expect(component).toBeTruthy();
  });

  it('should return void by handleRightClick if game state is NOT STARTED (e.g. paused)', () => {
    gameStateService.gameState.set(GameState.Paused);

    const rightClickEvent = new MouseEvent('click', {});

    const clickResult = component.handleRightClick(rightClickEvent);

    expect(clickResult).toBe(void 0);
  });

  it('should return void by handleRightClick if no flags remains and cell is not flagged', () => {
    const rightClickEvent = new MouseEvent('click', {});

    component.flagged = false;
    gameStateService.cellsFlaged.set(gameStateService.minesAmount());

    const clickResult = component.handleRightClick(rightClickEvent);
    expect(clickResult).toBe(void 0);
  });

  it('should return void by handleRightClick if cell is already revealed', () => {
    component.revealed = true;

    const rightClickEvent = new MouseEvent('click', {});
    const clickResult = component.handleRightClick(rightClickEvent);

    expect(clickResult).toBe(void 0);
  });

  it('should set flag by handleRightClick on right click if cell is not questionned, not revealed, not flagged', () => {
    component.revealed = false;
    component.questionned = false;
    component.flagged = false;

    const rightClickEvent = new MouseEvent('click', {});
    component.handleRightClick(rightClickEvent);

    expect(component.flagged).toBeTrue();
  });

  it('should set question mark by handleRightClick on right click if cell is not questionned, not revealed, is flagged', () => {
    component.revealed = false;
    component.questionned = false;
    component.flagged = true;

    const rightClickEvent = new MouseEvent('click', {});
    component.handleRightClick(rightClickEvent);

    expect(component.questionned).toBeTrue();
  });

  it('should remove question mark by handleRightClick on right click if cell is questionned, not revealed, no flagged', () => {
    component.revealed = false;
    component.questionned = true;
    component.flagged = false;

    const rightClickEvent = new MouseEvent('click', {});
    component.handleRightClick(rightClickEvent);

    expect(component.questionned).toBeFalse();
  });

  it('should return void by handleLeftClick if game is NOT STARTED (e.g. paused)', () => {
    const clickResult = component.handleLeftClick();

    expect(clickResult).toBe(void 0);
  });

  it('should return void by handleLeftClick if cell is already flagged', () => {
    component.flagged = true;

    const clickResult = component.handleLeftClick();
    expect(clickResult).toBe(void 0);
  });

  it('should call endGame() function in gameStateService if revealed cell content is mine (-1)', () => {
    spyOn(gameStateService, 'endGame');

    fixture.componentRef.setInput('content', -1);
    component.handleLeftClick();
    fixture.detectChanges();

    expect(gameStateService.endGame).toHaveBeenCalled();
  });

  it('should call endGame() function in gameStateService on revfealSelf() if revealed cell content is mine (-1)', () => {
    spyOn(gameStateService, 'endGame');

    fixture.componentRef.setInput('content', -1);
    component.revealSelf();
    fixture.detectChanges();

    expect(gameStateService.endGame).toHaveBeenCalled();
  });

  it('should set revealed, flagged and questionned to false on hideSelf()', () => {
    component.hideSelf();

    expect(component.flagged).toBeFalse();
    expect(component.revealed).toBeFalse();
    expect(component.questionned).toBeFalse();
  });
});
