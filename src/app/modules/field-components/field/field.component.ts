import {
  Component,
  effect,
  output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { CellComponent, CellCoordinates } from '../cell/cell.component';
import { GameState, GameStateService } from '../../services/game-state.service';

@Component({
  selector: 'app-field',
  standalone: true,
  imports: [CellComponent],
  templateUrl: './field.component.html',
  styleUrl: './field.component.scss',
})
export class FieldComponent {
  size = this.gameStateService.size;
  minesAmount = this.gameStateService.minesAmount;

  revealCell = output<void>();

  mines: number[][] = [];
  numbersAroundMines: number[][] = [];
  revealedCells: boolean[][] = [];
  flagedCells: boolean[][] = [];

  @ViewChildren(CellComponent) cells!: QueryList<CellComponent>;

  refreshField = effect(() => {
    this.mines = new Array(this.size());
    this.numbersAroundMines = new Array(this.size());
    this.revealedCells = new Array(this.size());
    this.flagedCells = new Array(this.size());

    for (let i = 0; i < this.size(); i++) {
      this.mines[i] = new Array(this.size()).fill(0);
      this.numbersAroundMines[i] = new Array(this.size()).fill(0);
      this.revealedCells[i] = new Array(this.size()).fill(false);
      this.flagedCells[i] = new Array(this.size()).fill(false);
    }

    this.minesAmount();
    this.gameStateService.restartSignal();

    this.cells.forEach(cell => cell.hideSelf());
  });

  constructor(private gameStateService: GameStateService) {}

  cellReveal(cellCoordinates: CellCoordinates) {
    const clickedCell = this.getCellByPosition(cellCoordinates);

    if (clickedCell === undefined) return;

    if (this.firstClick()) {
      this.setMines(clickedCell.coords);
      this.setNumbersAroundMines();
    }

    if (this.gameStateService.gameState() === GameState.Lose) {
      this.revealBombs();
      return;
    }

    if (!clickedCell.revealed) {
      clickedCell.revealSelf();
      this.revealCellsAround(clickedCell.coords);
    } else if (clickedCell?.content() !== 0) {
      const cellsAround = this.selectCellsAround(clickedCell.coords);

      const flagsAround = cellsAround.reduce(
        (count, cell) => count + (cell!.flagged ? 1 : 0),
        0
      );

      if (flagsAround === clickedCell.content()) {
        cellsAround
          .filter(cell => !cell.flagged)
          .forEach(cell =>
            this.revealCellsAround(cell.coords)
          );
      }
    }
  }

  cellFlaging(event: CellCoordinates) {
    this.flagedCells[event.posX][event.posY] =
      !this.flagedCells[event.posX][event.posY];

    if (this.gameStateService.flagsRemain() === 0 && this.allMinesAreFlaged()) {
      this.gameStateService.winGame();
      this.revealCellsOnWin();      
    }
  }

  setMines(firstClickCoords: CellCoordinates) {
    let i: number = 0;

    while (i < this.minesAmount()) {
      const x = this.generateRandomNumberExcluding(
        0,
        this.size(),
        firstClickCoords.posX
      );
      const y = this.generateRandomNumberExcluding(
        0,
        this.size(),
        firstClickCoords.posY
      );
      if (this.mines[x][y] === 1) continue;
      this.mines[x][y] = 1;
      i++;
    }
  }

  setNumbersAroundMines() {
    for (let i = 0; i < this.size(); i++) {
      for (let j = 0; j < this.size(); j++) {
        this.numbersAroundMines[i][j] = this.calculateMinesAround({posX: i, posY: j});
      }
    }

    for (let i = 0; i < this.size(); i++) {
      for (let j = 0; j < this.size(); j++) {
        if (this.mines[i][j] === 1) {
          this.numbersAroundMines[i][j] = -1;
        }
      }
    }
  }

  calculateMinesAround(coords: CellCoordinates): number {
    if (this.outOfBounds(coords)) return 0;

    let i: number = 0;

    for (let offsetX = -1; offsetX <= 1; offsetX++) {
      for (let offsetY = -1; offsetY <= 1; offsetY++) {
        if (this.outOfBounds({ posX: offsetX + coords.posX, posY: offsetY + coords.posY }))
          continue;
        i += this.mines[offsetX + coords.posX][offsetY + coords.posY];
      }
    }

    return i;
  }

  outOfBounds(coords: CellCoordinates): boolean {
    return (
      coords.posX < 0 ||
      coords.posY < 0 ||
      coords.posX >= this.size() ||
      coords.posY >= this.size()
    );
  }

  firstClick() {
    return this.revealedCells.every(row =>
      row.every(element => element === false)
    );
  }

  revealCellsAround(coords: CellCoordinates) {
    const cell = this.getCellByPosition({
      posX: coords.posX,
      posY: coords.posY,
    });

    if (cell?.content() === -1) {
      this.revealBombs();
      return;
    }

    if (this.outOfBounds({ posX: coords.posX, posY: coords.posY })) return;

    if (this.revealedCells[coords.posX][coords.posY]) return;

    if (cell?.flagged) return;

    this.revealedCells[coords.posX][coords.posY] = true;

    cell?.revealSelf();

    if (this.calculateMinesAround(coords) !== 0) return;

    this.revealCellsAround({ posX: coords.posX - 1, posY: coords.posY - 1 });
    this.revealCellsAround({ posX: coords.posX - 1, posY: coords.posY + 1 });
    this.revealCellsAround({ posX: coords.posX + 1, posY: coords.posY - 1 });
    this.revealCellsAround({ posX: coords.posX + 1, posY: coords.posY + 1 });
    this.revealCellsAround({ posX: coords.posX - 1, posY: coords.posY });
    this.revealCellsAround({ posX: coords.posX + 1, posY: coords.posY });
    this.revealCellsAround({ posX: coords.posX, posY: coords.posY + 1 });
    this.revealCellsAround({ posX: coords.posX, posY: coords.posY - 1 });
  }

  revealBombs() {
    this.cells
      .filter(cell => cell.content() === -1 && !cell.flagged)
      .forEach(cell => cell.revealSelf());
  }

  revealCellsOnWin() {
    this.cells
      .filter(cell => cell.content() !== -1 && !cell.flagged)
      .forEach(cell => cell.revealSelf());
  }

  generateRandomNumberExcluding(
    min: number,
    max: number,
    exclude: number
  ): number {
    // Ensure min is less than or equal to max
    if (min > max) {
      throw new Error('Minimum value cannot be greater than maximum value.');
    }

    // Ensure the excluded number is within the range
    if (exclude < min || exclude > max) {
      throw new Error('Excluded number must be within the specified range.');
    }

    let randomNumber: number;
    do {
      randomNumber = Math.floor(Math.random() * max); // Generate random number within range
    } while (randomNumber === exclude); // Repeat if generated number matches excluded number

    return randomNumber;
  }

  allMinesAreFlaged(): boolean {
    for (let i = 0; i < this.flagedCells.length; i++) {
      for (let j = 0; j < this.flagedCells[i].length; j++) {
        if (this.flagedCells[i][j] !== (this.mines[i][j] === 1)) {
          return false;
        }
      }
    }

    return true;
  }

  selectCellsAround(coords: CellCoordinates) {
    const cells = [
      this.getCellByPosition({ posX: coords.posX - 1, posY: coords.posY - 1 }),
      this.getCellByPosition({ posX: coords.posX - 1, posY: coords.posY + 1 }),
      this.getCellByPosition({ posX: coords.posX + 1, posY: coords.posY - 1 }),
      this.getCellByPosition({ posX: coords.posX + 1, posY: coords.posY + 1 }),
      this.getCellByPosition({ posX: coords.posX - 1, posY: coords.posY }),
      this.getCellByPosition({ posX: coords.posX + 1, posY: coords.posY }),
      this.getCellByPosition({ posX: coords.posX, posY: coords.posY + 1 }),
      this.getCellByPosition({ posX: coords.posX, posY: coords.posY - 1 }),
    ].filter((cell): cell is CellComponent => cell !== undefined);

    return cells;
  }

  getCellByPosition(coords: CellCoordinates) {
    if (this.outOfBounds({ posX: coords.posX, posY: coords.posY }))
      return undefined;

    return this.cells?.get(coords.posX * this.size() + coords.posY);
  }
}
