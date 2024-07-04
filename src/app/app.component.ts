import {
  Component,
  computed,
  effect,
  OnInit,
  ViewChild,
  AfterViewInit,
  ElementRef,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FieldComponent } from './modules/ui/field/field.component';
import { InputNumberModule } from 'primeng/inputnumber';
import { PrimeNGConfig } from 'primeng/api';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import {
  GameState,
  GameStateService,
} from './modules/services/game-state.service';
import { CommonModule } from '@angular/common';
import confetti from 'canvas-confetti';
import { CONSTANTS } from './modules/consts/game-state.consts';
import { CdTimerComponent, CdTimerModule } from 'angular-cd-timer';

@Component({
  selector: 'app-root',
  standalone: true,
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
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, AfterViewInit {
  readonly consts = CONSTANTS;

  @ViewChild('timer') timer!: CdTimerComponent;
  @ViewChild('audio') audio!: ElementRef;

  maxMines = computed(() =>
    Math.floor(
      (this.gameStateService.size() * this.gameStateService.size()) / 2
    )
  );

  controlsDisabled = computed(
    () => this.gameStateService.gameState() === GameState.Started
  );

  onGameLose = effect(() => {
    if (this.gameStateService.gameState() === GameState.Lose) {
      this.timer.stop();
    }
  });

  onGameWin = effect(() => {
    if (this.gameStateService.gameState() === GameState.Win) {
      this.timer.stop();

      this.audio.nativeElement.play();

      const duration = 10000; // in milliseconds

      confetti({
        particleCount: 100,
        spread: 300,
        origin: { y: 1 },
      });

      confetti({
        particleCount: 200,
        angle: 60,
        spread: 100,
        origin: { x: 0 },
      });

      confetti({
        particleCount: 200,
        angle: 120,
        spread: 100,
        origin: { x: 1 },
      });

      // Clear confetti after a certain duration
      setTimeout(() => confetti.reset(), duration);
    }
  });

  constructor(
    private primengConfig: PrimeNGConfig,
    public gameStateService: GameStateService
  ) {}

  ngOnInit() {
    this.primengConfig.ripple = true;
  }

  ngAfterViewInit(): void {
    this.timer.stop();
  }

  onPlay() {
    if (this.gameStateService.minesAmount() <= this.maxMines()) {
      this.gameStateService.startGame();
      this.timer.start();
    } else {
      window.alert(
        'Check mines amount! Max amount in 50% of total cells amount'
      );
    }
  }

  title = 'mines';
}
