import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { PantallaEnConstruccionComponent } from '../../pantalla-en-construccion/pantalla-en-construccion.component';
import { AsideComponent } from '../../aside/aside.component';
import { NavbarComponent } from '../../navbar/navbar.component';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [
    CommonModule,
    PantallaEnConstruccionComponent,
    AsideComponent,
    NavbarComponent,
    FontAwesomeModule,
    FormsModule,
  ],
  templateUrl: './novedades.component.html',
  styleUrls: ['./novedades.component.css'],
})
export class NovedadesComponent implements OnInit {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  private shouldScrollToBottom = true;

  selectedVersion: string = 'v1.2.1';
  userProfilePicture: string = '';
  defaultProfilePicture = 'default_profile_picture.png';
  showReactionMenu = false;

  messageId_1: string = 'message_1';
  messageId_2: string = 'message_2';
  messageId_3: string = 'message_3';

  showReactionMenu_1 = false;
  showReactionMenu_2 = false;
  showReactionMenu_3 = false;

  selectedReactions_1: { emoji: string; count: number; username: string }[] =
    [];
  selectedReactions_2: { emoji: string; count: number; username: string }[] =
    [];
  selectedReactions_3: { emoji: string; count: number; username: string }[] =
    [];

  reactions = [
    { emoji: '👍', name: 'like' },
    { emoji: '❤️', name: 'love' },
    { emoji: '😂', name: 'laugh' },
    { emoji: '😮', name: 'surprise' },
    { emoji: '😢', name: 'sad' },
    { emoji: '🙏', name: 'pray' },
  ];

  constructor(
    library: FaIconLibrary,
    private userService: UserService,
    private firestore: Firestore
  ) {
    library.addIconPacks(fas);
  }

  ngOnInit(): void {
    this.getReactions('message_1').subscribe((reactions: any[]) => {
      this.selectedReactions_1 = reactions.map((reaction) => ({
        emoji: reaction.emoji,
        count: 1,
        username: reaction.username || 'Anónimo',
      }));
    });

    this.getReactions('message_2').subscribe((reactions: any[]) => {
      this.selectedReactions_2 = reactions.map((reaction) => ({
        emoji: reaction.emoji,
        count: 1,
        username: reaction.username || 'Anónimo',
      }));

      this.scrollContainer.nativeElement.addEventListener('scroll', () => {
        const element = this.scrollContainer.nativeElement;
        const atBottom =
          element.scrollHeight - element.scrollTop === element.clientHeight;
        this.shouldScrollToBottom = atBottom;
      });
    });

    this.userService.getUserProfile('4gWQVe05xMgkVxBu8XeP0ktCjav1').subscribe(
      (userData: any) => {
        if (userData) {
          this.userProfilePicture =
            userData.profilePicture || this.defaultProfilePicture;
        }
      },
      (error: any) => {
        console.error('Error al obtener los datos del usuario:', error);
      }
    );
  }

  getReactions(messageId: string): Observable<any[]> {
    const reactionsRef = collection(
      this.firestore,
      `messages/${messageId}/reactions`
    );
    return collectionData(reactionsRef, { idField: 'userId' });
  }

  addReaction(reaction: any, messageId: string) {
    this.userService.addReaction(reaction, messageId).subscribe(() => {
      console.log(`Reacción guardada para ${messageId}`);
    });

    if (messageId === 'message_1') {
      this.showReactionMenu_1 = false;
    } else if (messageId === 'message_2') {
      this.showReactionMenu_2 = false;
    }
  }

  toggleReactionMenu(messageId: string) {
    if (messageId === 'message_1') {
      this.showReactionMenu_1 = !this.showReactionMenu_1;
      console.log(this.showReactionMenu_1);
    } else if (messageId === 'message_2') {
      this.showReactionMenu_2 = !this.showReactionMenu_2;
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom(); // Solo autoscrollea si el usuario no está desplazándose manualmente
    }
  }

  private scrollToBottom(): void {
    const element = this.scrollContainer.nativeElement;
    element.scrollTop = element.scrollHeight; // Esto asegura que baje hasta el final
  }
}
