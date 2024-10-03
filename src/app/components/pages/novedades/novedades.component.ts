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
      return `${reaction.users[0]} ha reaccionado con ${reaction.emoji}`;
    } else if (userCount === 2) {
      return `${reaction.users[0]} y ${reaction.users[1]} han reaccionado con ${reaction.emoji}`;
    } else if (userCount === 3) {
      return `${reaction.users[0]}, ${reaction.users[1]} y ${reaction.users[2]} han reaccionado con ${reaction.emoji}`;
    } else {
      const firstThreeUsers = reaction.users.slice(0, 3).join(', ');
      const remainingUsers = userCount - 3;
      return `${firstThreeUsers} y ${remainingUsers} personas más han reaccionado con ${reaction.emoji}`;
    }
  }

  // Función para manejar agregar o eliminar reacciones
  addOrRemoveReaction(reaction: any, messageId: string, reactionsList: any[]) {
    const currentUser = this.authService.currentUserSig();
    console.log(currentUser);

    if (currentUser && currentUser.uid) {
      const currentUserId = currentUser.uid;
      const existingReaction = reactionsList.find(
        (r) =>
          r.emoji === reaction.emoji && r.users.includes(currentUser.username)
      );

      console.log(existingReaction);
      console.log(reactionsList);

      if (existingReaction) {
        // Eliminar reacción si ya existe
        return this.userService
          .removeReaction(reaction, messageId)
          .subscribe(() => {
            console.log(`Reacción eliminada para ${messageId}`);
            existingReaction.users = existingReaction.users.filter(
              (user: any) => user !== currentUserId
            );
            existingReaction.count--;

            // Si no hay usuarios restantes, elimina la reacción
            if (existingReaction.count === 0) {
              const index = reactionsList.indexOf(existingReaction);
              if (index > -1) {
                reactionsList.splice(index, 1); // Eliminar la reacción de la lista
              }
            }
          });
      } else {
        // Agregar reacción si no existe
        return this.userService
          .addReaction(reaction, messageId)
          .subscribe(() => {
            console.log(`Reacción agregada para ${messageId}`);
            const foundReaction = reactionsList.find(
              (r) => r.emoji === reaction.emoji
            );
            if (foundReaction) {
              foundReaction.users.push(currentUserId); // Agregar el userId
              foundReaction.count++;
            } else {
              reactionsList.push({
                emoji: reaction.emoji,
                count: 1,
                users: [currentUserId],
              });
            }
          });
      }
    } else {
      console.error('Usuario no autenticado');
      return EMPTY;
    }
  }

  isReactionSelectedByUser(reaction: any): boolean {
    const currentUser = this.authService.currentUserSig();
    if (currentUser && currentUser.uid) {
      return reaction.users.includes(currentUser.username);
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
      const { emoji, username } = reaction;
      if (!groupedReactions[emoji]) {
        groupedReactions[emoji] = { emoji, count: 0, users: [] };
      }
      groupedReactions[emoji].count++;
      groupedReactions[emoji].users.push(username || 'Anónimo');
    });

    return Object.values(groupedReactions);
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
      this.scrollToBottom(); // Solo autoscrollea si el usuario no está desplazándose manualmente
    }
  }

  private scrollToBottom(): void {
    const element = this.scrollContainer.nativeElement;
    element.scrollTop = element.scrollHeight; // Esto asegura que baje hasta el final
  }
}
