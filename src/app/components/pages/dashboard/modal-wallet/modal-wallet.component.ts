import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
export class ModalWalletComponent {
  constructor(
    public dialogRef: MatDialogRef<ModalWalletComponent>,
    library: FaIconLibrary
  ) {
    library.addIconPacks(fas);
  }

  openModal = true;
  bottomValues = ['0px', '50px', '100px'];
  oldBottom = 0;
  newBottom = 0;

  animateCard(cardId: string): void {
    const cards = document.getElementsByClassName(
      'card'
    ) as HTMLCollectionOf<HTMLElement>;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      card.style.bottom = this.bottomValues[i];

      if (card.id !== cardId) {
        card.setAttribute('name', '');
      }
    }

    const selectedCard = document.getElementById(cardId) as HTMLElement;

    if (selectedCard.getAttribute('name') !== 'moved') {
      this.oldBottom = parseInt(selectedCard.style.bottom, 10);
      this.newBottom = 350;
      selectedCard.style.bottom = `${this.newBottom}px`;
      selectedCard.setAttribute('name', 'moved');
    } else {
      selectedCard.style.bottom = `${this.oldBottom}px`;
      selectedCard.setAttribute('name', '');
    }
  }

  closeModal(): void {
    this.openModal = false;
  }
}
