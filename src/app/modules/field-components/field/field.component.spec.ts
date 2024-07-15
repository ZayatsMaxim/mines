import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FieldComponent } from './field.component';
import { CellComponent, CellCoordinates } from '../cell/cell.component';
import { GameState, GameStateService } from '../../services/game-state.service';
import { MockBuilder } from 'ng-mocks';

describe('FieldComponent', () => {
  let component: FieldComponent;
  let fixture: ComponentFixture<FieldComponent>;
  let gameStateService: GameStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FieldComponent);
    gameStateService = TestBed.inject(GameStateService);
    component = fixture.componentInstance;

    component.minesAmount.set(2);
    component.size.set(4);

    gameStateService.gameState.set(GameState.Started);

    fixture.detectChanges();

    // component.cells.forEach(cell => spies.push({
    //   spy: spyOn(cell, 'hideSelf')
    // }))
  });

  beforeEach(() => {
    return MockBuilder(CellComponent);
  });

  it('should create a component', () => {
    expect(component).toBeTruthy();
  });

  it('should refreshField on minesAmount change', () => {
    component.minesAmount.set(3);
    fixture.detectChanges();

    expect(component.mines).toHaveSize(component.size());
    expect(component.numbersAroundMines).toHaveSize(component.size());
    expect(component.revealedCells).toHaveSize(component.size());
    expect(component.flagedCells).toHaveSize(component.size());

    for (let i = 0; i < component.size(); i++) {
      expect(component.mines[i]).toContain(0);
      expect(component.numbersAroundMines[i]).toContain(0);
      expect(component.revealedCells[i]).toContain(false);
      expect(component.flagedCells[i]).toContain(false);
    }
  });

  it('should return void on cellReveal() if cell coordinates are wrong (i.e. not accords to field size)', () => {
    const cellCoordinates: CellCoordinates = { posX: 999, posY: 999 };

    const returnValue = component.cellReveal(cellCoordinates);

    expect(returnValue).toBe(void 0);
  });

  it('should set mines and numbers around them on cellReveal() on first click (left)', () => {
    const cellCoordinates: CellCoordinates = { posX: 1, posY: 1 };
    spyOn(component, 'setMines');
    spyOn(component, 'setNumbersAroundMines');

    fixture.detectChanges();

    component.cellReveal(cellCoordinates);

    expect(component.setMines).toHaveBeenCalled();
    expect(component.setNumbersAroundMines).toHaveBeenCalled();
  });

  it('should reveal bombs on cellReveal() if game state is LOSE', () => {
    const cellCoordinates: CellCoordinates = { posX: 1, posY: 1 };
    gameStateService.gameState.set(GameState.Lose);
    spyOn(component, 'revealBombs');

    fixture.detectChanges();

    component.cellReveal(cellCoordinates);

    expect(component.revealBombs).toHaveBeenCalled();
  });

  it('should flag cell on cellFlagging()', () => {
    const cellCoordinates: CellCoordinates = { posX: 1, posY: 1 };

    component.cellFlaging(cellCoordinates);

    expect(
      component.flagedCells[cellCoordinates.posX][cellCoordinates.posY]
    ).toBeTrue();
  });

  it('should reveal cells with bombs on revealBombs()', () => {
    const spies: { spy: jasmine.Spy<() => void> }[] = [];
    const cellCoordinates: CellCoordinates = { posX: 1, posY: 1 };
    fixture.detectChanges();
    component.cellReveal(cellCoordinates);
    fixture.detectChanges();

    component.cells
      .filter(cell => cell.content() === -1 && !cell.flagged)
      .forEach(cell =>
        spies.push({
          spy: spyOn(cell, 'revealSelf'),
        })
      );

    component.revealBombs();

    spies.forEach(s => {
      expect(s.spy).toHaveBeenCalled();
    });
  });

  it('should reveal empty cells on revealCellsOnWin()', () => {
    const spies: { spy: jasmine.Spy<() => void> }[] = [];
    const cellCoordinates: CellCoordinates = { posX: 1, posY: 1 };
    fixture.detectChanges();
    component.cellReveal(cellCoordinates);
    fixture.detectChanges();

    component.cells
      .filter(cell => cell.content() !== -1 && !cell.flagged)
      .forEach(cell =>
        spies.push({
          spy: spyOn(cell, 'revealSelf'),
        })
      );

    component.revealCellsOnWin();

    spies.forEach(s => {
      expect(s.spy).toHaveBeenCalled();
    });
  });

  it('should throw error on generateRandomNumberExcluding() if min value is greater that max', () => {
    expect(function () {
      component.generateRandomNumberExcluding(6, 2, 4);
    }).toThrowError();
  });

  it('should throw error on generateRandomNumberExcluding() if excluded number is within the range', () => {
    expect(function () {
      component.generateRandomNumberExcluding(1, 3, 5);
    }).toThrowError();
  });

  it('should return false on allMinesAreFlagged() if no cell was flagged', () => {
    doFirstClick();

    expect(component.allMinesAreFlaged()).toBeFalse();
  });

  it('should return true on allMinesAreFlagged() if all mines were flagged', () => {
    doFirstClick();

    component.cells
      .filter(cell => cell.content() === -1)
      .forEach(cell => {
        cell.flagged = true;
        gameStateService.cellsFlaged.update(value => value + 1);
        component.cellFlaging({ posX: cell.posX(), posY: cell.posY() });
      });

    fixture.detectChanges();
    expect(component.allMinesAreFlaged()).toBeTrue();
  });

  it('should win game on cellFlaging() if cell was last remained mine', () => {
    doFirstClick();

    component.cells
      .filter(cell => cell.content() === -1)
      .forEach(cell => {
        cell.flagged = true;
        gameStateService.cellsFlaged.update(value => value + 1);
        component.cellFlaging(cell.coords);
      });

    fixture.detectChanges();

    expect(gameStateService.gameState()).toBe(GameState.Win);
  });

  it('should revealBombs() on revealCellsAround() if near cell content is a mine (-1)', () => {
    doFirstClick();
    spyOn(component, 'revealBombs');

    component.cells.forEach(cell => {
      component.revealCellsAround(cell.coords);
    });

    expect(component.revealBombs).toHaveBeenCalled();
  });

  it('should return void on revealCellsAround() is cell is flagged', () => {
    doFirstClick();
    const cellCoordinates: CellCoordinates = { posX: 2, posY: 2 };
    const cell = component.getCellByPosition(cellCoordinates);

    cell!.flagged = true;
    const result = component.revealCellsAround(cellCoordinates);

    expect(result).toBe(void 0);
  });

  it('should return 8 cells on selectCellsAround() if passed a coords of cell in the middle of the field', () => {
    doFirstClick();
    const cellCoordinates: CellCoordinates = { posX: 2, posY: 2 };

    const selectedCells = component.selectCellsAround(cellCoordinates);

    expect(selectedCells.length).toEqual(8);
  });

  it('should return 0 on calculateMinesAround() if cell coords is out of bounds', () => {
    const cellCoordinates: CellCoordinates = { posX: 999, posY: 999 };

    expect(component.calculateMinesAround(cellCoordinates)).toEqual(0);
  });

  function doFirstClick() {
    const cellCoordinates: CellCoordinates = { posX: 0, posY: 0 };
    fixture.detectChanges();
    component.cellReveal(cellCoordinates);
    fixture.detectChanges();
  }
});
