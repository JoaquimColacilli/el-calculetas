import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-modal-wallet',
  standalone: true,
  imports: [FormsModule, CommonModule, FontAwesomeModule],
  templateUrl: './modal-wallet.component.html',
  styleUrl: './modal-wallet.component.css',
})
export class ModalWalletComponent implements OnInit {
  openModal = true;
  selectedCardId: string | null = null;

  days: number[] = [];
  months = [
    { value: 1, name: 'Enero' },
    { value: 2, name: 'Febrero' },
    { value: 3, name: 'Marzo' },
    { value: 4, name: 'Abril' },
    { value: 5, name: 'Mayo' },
    { value: 6, name: 'Junio' },
    { value: 7, name: 'Julio' },
    { value: 8, name: 'Agosto' },
    { value: 9, name: 'Septiembre' },
    { value: 10, name: 'Octubre' },
    { value: 11, name: 'Noviembre' },
    { value: 12, name: 'Diciembre' },
  ];

  cards = [
    {
      id: 'card1',
      background: '#7533ff',
      bottom: '0px',
      zIndex: 90,
      selectedDay: null as number | null,
      selectedMonth: null as number | null,
      date: null as Date | null,
    },
    {
      id: 'card2',
      background: '#ff473b',
      bottom: '50px',
      zIndex: 40,
      selectedDay: null as number | null,
      selectedMonth: null as number | null,
      date: null as Date | null,
    },
    {
      id: 'card3',
      background: '#5bb6ff',
      bottom: '100px',
      zIndex: -10,
      selectedDay: null as number | null,
      selectedMonth: null as number | null,
      date: null as Date | null,
    },
  ];

  constructor(
    public dialogRef: MatDialogRef<ModalWalletComponent>,
    library: FaIconLibrary
  ) {
    library.addIconPacks(fas);

    this.dialogRef.beforeClosed().subscribe(() => {
      this.resetCardsPosition();
    });
  }

  ngOnInit(): void {
    this.resetCardsPosition();
    // Populate days array with numbers from 1 to 31
    this.days = Array.from({ length: 31 }, (_, i) => i + 1);
  }

  animateCard(cardId: string): void {
    if (this.selectedCardId === cardId) {
      // Do nothing if the same card is clicked again
      return;
    }

    this.selectedCardId = cardId;

    this.cards.forEach((card, index) => {
      if (card.id === cardId) {
        // Move the selected card up
        card.bottom = `${parseInt(card.bottom, 10) + 120}px`;
      } else {
        // Reset other cards to original position
        card.bottom = `${index * 50}px`;
      }
    });
  }

  closeCard(card: any): void {
    // Save the selected date (day and month)
    if (card.selectedDay && card.selectedMonth) {
      const currentYear = new Date().getFullYear();
      card.date = new Date(
        currentYear,
        card.selectedMonth - 1,
        card.selectedDay
      );
      console.log(
        `Card ${card.id} date selected: ${card.date.toLocaleDateString()}`
      );
    } else {
      console.log(`Card ${card.id} date not fully selected.`);
    }

    // Lower the card back into the wallet
    this.selectedCardId = null;
    this.cards.forEach((c, index) => {
      c.bottom = `${index * 50}px`;
    });
  }

  closeModal(): void {
    this.cards.forEach((card) => {
      if (card.date) {
        console.log(
          `Card ${card.id} date selected: ${card.date.toLocaleDateString()}`
        );
      }
    });
    this.dialogRef.close();
  }

  resetCardsPosition(): void {
    this.selectedCardId = null;
    this.cards.forEach((card, index) => {
      card.bottom = `${index * 50}px`;
    });
  }
}
