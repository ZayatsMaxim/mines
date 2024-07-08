import {
  Component,
  computed,
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

  fieldWidth = computed(() => this.size() * 50 + (this.size() - 1) * 2);

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

  cellReveal(event: CellCoordinates) {
    const clickedCell = this.getCellByPosition(event.posX, event.posY);

    if (clickedCell === undefined) return;

    if (this.firstClick()) {
      this.setMines(clickedCell.posX(), clickedCell.posY());
      this.setNumbersAroundMines();
    }

    if (this.gameStateService.gameState() === GameState.Lose) {
      this.revealBombs();
      return;
    }

    if (!clickedCell.revealed) {
      clickedCell.revealSelf();
      this.revealCellsAround(clickedCell.posX(), clickedCell.posY());
    } else if (clickedCell?.content() !== 0) {
      const cellsAround = this.selectCellsAround(
        clickedCell.posX(),
        clickedCell.posY()
      );

      const flagsAround = cellsAround.reduce(
        (count, cell) => count + (cell!.flagged ? 1 : 0),
        0
      );

      if (flagsAround === clickedCell.content()) {
        cellsAround
          .filter(cell => !cell.flagged)
          .forEach(cell => this.revealCellsAround(cell.posX(), cell.posY()));
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

  setMines(firstClickX: number, firstClickY: number) {
    let i: number = 0;

    while (i < this.minesAmount()) {
      const x = this.generateRandomNumberExcluding(0, this.size(), firstClickX);
      const y = this.generateRandomNumberExcluding(0, this.size(), firstClickY);
      if (this.mines[x][y] === 1) continue;
      this.mines[x][y] = 1;
      i++;
    }
  }

  setNumbersAroundMines() {
    for (let i = 0; i < this.size(); i++) {
      for (let j = 0; j < this.size(); j++) {
        this.numbersAroundMines[i][j] = this.calculateMinesAround(i, j);
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

  calculateMinesAround(x: number, y: number): number {
    if (this.outOfBounds(x, y)) return 0;

    let i: number = 0;

    for (let offsetX = -1; offsetX <= 1; offsetX++) {
      for (let offsetY = -1; offsetY <= 1; offsetY++) {
        if (this.outOfBounds(offsetX + x, offsetY + y)) continue;
        i += this.mines[offsetX + x][offsetY + y];
      }
    }

    return i;
  }

  outOfBounds(x: number, y: number): boolean {
    return x < 0 || y < 0 || x >= this.size() || y >= this.size();
  }

  firstClick() {
    return this.revealedCells.every(row =>
      row.every(element => element === false)
    );
  }

  revealCellsAround(x: number, y: number) {
    const cell = this.getCellByPosition(x, y);

    if (cell?.content() === -1) {
      this.revealBombs();
      return;
    }

    if (this.outOfBounds(x, y)) return;

    if (this.revealedCells[x][y]) return;

    if (cell?.flagged) return;

    this.revealedCells[x][y] = true;

    cell?.revealSelf();

    if (this.calculateMinesAround(x, y) !== 0) return;

    this.revealCellsAround(x - 1, y - 1);
    this.revealCellsAround(x - 1, y + 1);
    this.revealCellsAround(x + 1, y - 1);
    this.revealCellsAround(x + 1, y + 1);
    this.revealCellsAround(x - 1, y);
    this.revealCellsAround(x + 1, y);
    this.revealCellsAround(x, y + 1);
    this.revealCellsAround(x, y - 1);
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
    if (
      this.flagedCells.length !== this.mines.length ||
      !this.flagedCells.every(row => row.length === this.mines[0].length)
    ) {
      return false;
    }

    for (let i = 0; i < this.flagedCells.length; i++) {
      for (let j = 0; j < this.flagedCells[i].length; j++) {
        if (this.flagedCells[i][j] !== (this.mines[i][j] === 1)) {
          return false;
        }
      }
    }

    return true;
  }

  selectCellsAround(x: number, y: number) {
    const cells = [
      this.getCellByPosition(x - 1, y - 1),
      this.getCellByPosition(x - 1, y + 1),
      this.getCellByPosition(x + 1, y - 1),
      this.getCellByPosition(x + 1, y + 1),
      this.getCellByPosition(x - 1, y),
      this.getCellByPosition(x + 1, y),
      this.getCellByPosition(x, y + 1),
      this.getCellByPosition(x, y - 1),
    ].filter((cell): cell is CellComponent => cell !== undefined);

    return cells;
  }

  getCellByPosition(x: number, y: number) {
    if (this.outOfBounds(x, y)) return undefined;

    return this.cells?.get(x * this.size() + y);
  }
}
