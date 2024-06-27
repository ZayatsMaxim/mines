import { Component, computed, effect, OnInit } from '@angular/core';
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
import { ToastModule } from 'primeng/toast';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import confetti from 'canvas-confetti';

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
    ToastModule,
    MessagesModule,
    MessageModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  maxMines = computed(() =>
    Math.floor(
      (this.gameStateService.size() * this.gameStateService.size()) / 2
    )
  );

  controlsDisabled = computed(
    () => this.gameStateService.gameState() === GameState.Started
  );

  onGameWin = effect(() => {
    if (this.gameStateService.gameState() === GameState.Win) {
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
    public gameStateService: GameStateService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.primengConfig.ripple = true;
  }

  onPlay() {
    if (this.gameStateService.minesAmount() <= this.maxMines()) {
      this.gameStateService.startGame();
    } else {
      window.alert('Check mines amount! Max amount in 50% of total cells amount')
    }
  }

  title = 'mines';
}
