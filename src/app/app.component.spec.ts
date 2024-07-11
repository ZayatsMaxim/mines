/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { CdTimerModule } from 'angular-cd-timer';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { FieldComponent } from './modules/field-components/field/field.component';
import { AppComponent } from './app.component';
import {
  GameState,
  GameStateService,
} from './modules/services/game-state.service';
import * as confetti from 'canvas-confetti';

describe('appComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let gameStateService: GameStateService;
  const defineProperty = Object.defineProperty;
  Object.defineProperty = (o, p, c) =>
    defineProperty(o, p, Object.assign({}, c ?? {}, { configurable: true }));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        RouterOutlet,
        FieldComponent,
        InputNumberModule,
        FloatLabelModule,
        ButtonModule,
        FormsModule,
        CdTimerModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    gameStateService = TestBed.inject(GameStateService);

    gameStateService.gameState.set(GameState.Started);
  });

  it('should create a component', () => {
    expect(component).toBeTruthy();
  });

  it('should properly set maxMines = 18 if size === 6', () => {
    gameStateService.size.set(6);

    expect(component.maxMines()).toEqual(18);
  });

  it('should disable controls if game state is STARTED', () => {
    gameStateService.gameState.set(GameState.Started);

    expect(component.controlsDisabled()).toBeTrue();
  });

  it('should disable timer if game state is LOSE', () => {
    fixture.detectChanges();
    spyOn(component.timer, 'stop');

    gameStateService.gameState.set(GameState.Lose);
    fixture.detectChanges();

    expect(component.timer.stop).toHaveBeenCalled();
  });

  it('should start game and timer onPlay() if mines amount is less than maxMines', () => {
    fixture.detectChanges();
    spyOn(component.timer, 'start');
    spyOn(gameStateService, 'startGame');

    component.onPlay();
    fixture.detectChanges();

    expect(component.timer.start).toHaveBeenCalled();
    expect(gameStateService.startGame).toHaveBeenCalled();
  });

  it('should alert player onPlay() if minesAmount is greater than maxMines', () => {
    fixture.detectChanges();
    spyOn(window, 'alert');
    gameStateService.minesAmount.set(999999999);

    component.onPlay();

    expect(window.alert).toHaveBeenCalled();
  });

  it('should stop timer, play audio onGameWin()', () => {
    fixture.detectChanges();
    spyOn(component.timer, 'stop');
    spyOn(component.audio.nativeElement, 'play');
    
    gameStateService.gameState.set(GameState.Win);
    fixture.detectChanges();

    expect(component.timer.stop).toHaveBeenCalled();
    expect(component.audio.nativeElement.play).toHaveBeenCalled();
  });
});
