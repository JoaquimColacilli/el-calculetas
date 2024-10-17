import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import {
  FaIconLibrary,
  FontAwesomeModule,
} from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { CardService } from '../../../../services/card.service';
import { Card } from '../../../../interfaces/card.interface';
import { AuthService } from '../../../../services/auth.service';

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

  cards: Card[] = [];

  constructor(
    public dialogRef: MatDialogRef<ModalWalletComponent>,
    library: FaIconLibrary,
    private cardService: CardService,
    private authService: AuthService
  ) {
    library.addIconPacks(fas);

    this.dialogRef.beforeClosed().subscribe(() => {
      this.resetCardsPosition();
    });
  }

  ngOnInit(): void {
    this.days = Array.from({ length: 31 }, (_, i) => i + 1);

    this.loadUserCards();
  }

  loadUserCards(): void {
    this.cardService.getUserCards().subscribe(
      (cards) => {
        if (cards.length === 0) {
          // Si no hay tarjetas, inicializar las tarjetas por defecto
          this.initializeDefaultCards();
        } else {
          // Si hay tarjetas, cargarlas y convertir fechas si es necesario
          this.cards = cards.map((card) => {
            return {
              ...card,
              date: card.date ? new Date(card.date) : null,
              name: card.name || this.getDefaultCardName(card.id),
            };
          });
          this.resetCardsPosition();
        }
      },
      (error) => {
        console.error('Error al cargar las tarjetas:', error);
      }
    );
  }

  getDefaultCardName(cardId: string): string {
    switch (cardId) {
      case 'card1':
        return 'Visa';
      case 'card2':
        return 'Mastercard';
      case 'card3':
        return 'American Express';
      case 'card4':
        return 'Discover';
      default:
        return 'Tarjeta';
    }
  }

  initializeDefaultCards(): void {
    this.cards = [
      {
        id: 'card1',
        background: '#1A1F71',
        logo: 'assets/visa-logo.png',
        bottom: '0px',
        zIndex: 90,
        selectedDay: null,
        selectedMonth: null,
        date: null,
        name: 'Visa', // Nombre por defecto
      },
      {
        id: 'card2',
        background: '#EB001B',
        logo: 'assets/mastercard-logo.png',
        bottom: '50px',
        zIndex: 40,
        selectedDay: null,
        selectedMonth: null,
        date: null,
        name: 'Mastercard', // Nombre por defecto
      },
      {
        id: 'card3',
        background: '#4D4F53',
        logo: 'assets/amex-logo.png',
        bottom: '100px',
        zIndex: -10,
        selectedDay: null,
        selectedMonth: null,
        date: null,
        name: 'American Express', // Nombre por defecto
      },
      {
        id: 'card4',
        background: '#FF6000',
        logo: 'assets/discover-logo.png',
        bottom: '150px',
        zIndex: -60,
        selectedDay: null,
        selectedMonth: null,
        date: null,
        name: 'Discover', // Nombre por defecto
      },
    ];

    // Guardar las tarjetas por defecto en Firebase
    this.cards.forEach((card) => {
      this.cardService.setCard(card).catch((error) => {
        console.error('Error al guardar la tarjeta:', error);
      });
    });
    this.resetCardsPosition();
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
        card.bottom = `${parseInt(card.bottom, 10) + 160}px`;
      } else {
        // Reset other cards to original position
        card.bottom = `${index * 50}px`;
      }
    });
  }

  closeCard(card: Card): void {
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

    // Verificar si el nombre está definido
    if (!card.name || card.name.trim() === '') {
      console.log('El nombre de la tarjeta no está definido.');
    }

    // Actualizar la tarjeta en Firebase
    this.cardService.updateCard(card).catch((error) => {
      console.error('Error al actualizar la tarjeta:', error);
    });

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
