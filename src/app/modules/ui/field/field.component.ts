import { CommonModule } from '@angular/common';
import { Component, input, OnInit } from '@angular/core';

@Component({
  selector: 'app-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './field.component.html',
  styleUrl: './field.component.scss',
})
export class FieldComponent implements OnInit {
  size = input.required<number>();
  maxMines = input.required<number>();

  mines!: number[][];

  ngOnInit(): void {
    console.log(this.size());
  }

  // setMines() {
  //   this.mines = 
  // }
}
