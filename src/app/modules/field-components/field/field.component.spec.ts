import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FieldComponent } from './field.component';
import { CellComponent, CellCoordinates } from '../cell/cell.component';
import { GameState, GameStateService } from '../../services/game-state.service';
import { Component, input } from '@angular/core';
import { MockBuilder } from 'ng-mocks';

@Component({
  selector: 'app-cell',
  template: '',
  providers: [
    {
      provide: CellComponent,
      useClass: CellStubComponent,
    },
  ],
})
export class CellStubComponent {
  posX = input.required<number>();
  posY = input.required<number>();
}

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

  // it('should set mines and numbers around them on cellReveal() on first click (left)', () => {
  //   const cellCoordinates: CellCoordinates = { posX: 1, posY: 1 };
  //   component.minesAmount.set(2);
  //   gameStateService.gameState.set(GameState.Started);

  //   component.cellReveal(cellCoordinates);
  //   fixture.detectChanges();

  //   spyOn(component, 'setMines');

  //   expect(component.firstClick()).toBeTrue();
  //   expect(component.setMines).toHaveBeenCalled();
  // });
});
