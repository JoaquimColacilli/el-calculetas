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
import { EMPTY, Observable, tap } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

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

  selectedReactions_1: { emoji: string; count: number; users: string[] }[] = [];

  selectedReactions_2: { emoji: string; count: number; users: string[] }[] = [];

  selectedReactions_3: { emoji: string; count: number; users: string[] }[] = [];

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
    private firestore: Firestore,
    private authService: AuthService
  ) {
    library.addIconPacks(fas);
  }

  byCount(a: any, b: any): number {
    return b.count - a.count;
  }

  sortReactionsByCount(reactions: any[]): any[] {
    return reactions.sort((a, b) => b.count - a.count);
  }

  ngOnInit(): void {
    this.getReactions('message_1').subscribe((reactions: any[]) => {
      this.selectedReactions_1 = this.groupReactionsByEmoji(reactions);
    });

    this.getReactions('message_2').subscribe((reactions: any[]) => {
      this.selectedReactions_2 = this.groupReactionsByEmoji(reactions);
    });

    this.getReactions('message_3').subscribe((reactions: any[]) => {
      this.selectedReactions_3 = this.groupReactionsByEmoji(reactions);

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

  getReactionTitle(reaction: any): string {
    const userCount = reaction.users.length;

    if (userCount === 1) {
      return `1 persona ha reaccionado con ${reaction.emoji}`;
    } else {
      return `${userCount} personas han reaccionado con ${reaction.emoji}`;
    }
  }

  // Función para manejar agregar o eliminar reacciones
  addOrRemoveReaction(reaction: any, messageId: string) {
    const currentUser = this.authService.currentUserSig();

    if (currentUser && currentUser.uid) {
      const currentUserId = currentUser.uid;
      const hasReacted = reaction.users.includes(currentUserId);

      if (hasReacted) {
        // Eliminar reacción si ya existe
        this.userService.removeReaction(reaction, messageId).subscribe(() => {
          console.log(`Reacción eliminada para ${messageId}`);
        });
      } else {
        // Agregar reacción si no existe
        this.userService.addReaction(reaction, messageId).subscribe(() => {
          console.log(`Reacción agregada para ${messageId}`);
        });
      }
    } else {
      console.error('Usuario no autenticado');
    }
  }

  isReactionSelectedByUser(reaction: any): boolean {
    const currentUser = this.authService.currentUserSig();
    if (currentUser && currentUser.uid) {
      return reaction.users.includes(currentUser.uid);
    }
    return false;
  }

  groupReactionsByEmoji(
    reactions: any[]
  ): { emoji: string; count: number; users: string[] }[] {
    const groupedReactions: {
      [key: string]: { emoji: string; count: number; users: string[] };
    } = {};

    reactions.forEach((reaction) => {
      const { emoji, userId } = reaction;
      if (!groupedReactions[emoji]) {
        groupedReactions[emoji] = { emoji, count: 0, users: [] };
      }
      groupedReactions[emoji].count++;
      groupedReactions[emoji].users.push(userId);

      // Agrega este console.log para verificar
      console.log(`Emoji: ${emoji}, Users:`, groupedReactions[emoji].users);
    });

    return Object.values(groupedReactions);
  }

  getReactions(messageId: string): Observable<any[]> {
    const reactionsRef = collection(
      this.firestore,
      `messages/${messageId}/reactions`
    );
    return collectionData(reactionsRef);
  }

  addReaction(reaction: any, messageId: string) {
    this.userService.addReaction(reaction, messageId).subscribe(() => {
      console.log(`Reacción guardada para ${messageId}`);
    });

    // Cerrar el menú de reacciones correspondiente
    if (messageId === 'message_1') {
      this.showReactionMenu_1 = false;
    } else if (messageId === 'message_2') {
      this.showReactionMenu_2 = false;
    } else if (messageId === 'message_3') {
      this.showReactionMenu_3 = false;
    }
  }

  toggleReactionMenu(messageId: string) {
    if (messageId === 'message_1') {
      this.showReactionMenu_1 = !this.showReactionMenu_1;
    } else if (messageId === 'message_2') {
      this.showReactionMenu_2 = !this.showReactionMenu_2;
    } else if (messageId === 'message_3') {
      this.showReactionMenu_3 = !this.showReactionMenu_3;
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    const element = this.scrollContainer.nativeElement;
    element.scrollTop = element.scrollHeight;
  }
}
