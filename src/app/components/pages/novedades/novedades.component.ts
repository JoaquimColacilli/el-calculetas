import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
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
import { deleteDoc, doc, getDocs } from 'firebase/firestore';

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

  userProfilePicture: string = '';
  defaultProfilePicture = 'default_profile_picture.png';
  showReactionMenu = false;

  messageId_1: string = 'message_1';
  messageId_2: string = 'message_2';
  messageId_3: string = 'message_3';
  messageId_4: string = 'message_4';
  messageId_5: string = 'message_5';
  messageId_6: string = 'message_6';
  messageId_7: string = 'message_7';

  showReactionMenu_1 = false;
  showReactionMenu_2 = false;
  showReactionMenu_3 = false;
  showReactionMenu_4 = false;
  showReactionMenu_5 = false;
  showReactionMenu_6 = false;
  showReactionMenu_7 = false;

  selectedReactions_1: { emoji: string; count: number; users: string[] }[] = [];
  selectedReactions_2: { emoji: string; count: number; users: string[] }[] = [];
  selectedReactions_3: { emoji: string; count: number; users: string[] }[] = [];
  selectedReactions_4: { emoji: string; count: number; users: string[] }[] = [];
  selectedReactions_5: { emoji: string; count: number; users: string[] }[] = [];
  selectedReactions_6: { emoji: string; count: number; users: string[] }[] = [];
  selectedReactions_7: { emoji: string; count: number; users: string[] }[] = [];

  userIdToUsernameMap: { [uid: string]: string } = {};

  reactions = [
    { emoji: '👍🏻', name: 'like' },
    { emoji: '❤️', name: 'love' },
    { emoji: '😂', name: 'laugh' },
    { emoji: '😮', name: 'surprise' },
    { emoji: '😢', name: 'sad' },
    { emoji: '🙏', name: 'pray' },
    { emoji: '👎🏻', name: 'dislike' },
    { emoji: '🖕🏼', name: 'fku' },
    { emoji: '💪🏼', name: 'muscle' },
    { emoji: '💯', name: '100' },
    { emoji: '❓', name: '?' },
    { emoji: '☠', name: 'skull' },
  ];

  constructor(
    library: FaIconLibrary,
    private userService: UserService,
    private firestore: Firestore,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
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
      const uids = reactions.map((r) => r.userId);
      this.fetchUsernames(uids);
    });

    this.getReactions('message_2').subscribe((reactions: any[]) => {
      this.selectedReactions_2 = this.groupReactionsByEmoji(reactions);
      const uids = reactions.map((r) => r.userId);
      this.fetchUsernames(uids);
    });

    this.getReactions('message_3').subscribe((reactions: any[]) => {
      this.selectedReactions_3 = this.groupReactionsByEmoji(reactions);
      const uids = reactions.map((r) => r.userId);
      this.fetchUsernames(uids);
    });

    this.getReactions('message_4').subscribe((reactions: any[]) => {
      this.selectedReactions_4 = this.groupReactionsByEmoji(reactions);
      const uids = reactions.map((r) => r.userId);
      this.fetchUsernames(uids);
    });

    this.getReactions('message_5').subscribe((reactions: any[]) => {
      this.selectedReactions_5 = this.groupReactionsByEmoji(reactions);
      const uids = reactions.map((r) => r.userId);
      this.fetchUsernames(uids);
    });

    this.getReactions('message_6').subscribe((reactions: any[]) => {
      this.selectedReactions_6 = this.groupReactionsByEmoji(reactions);
      const uids = reactions.map((r) => r.userId);
      this.fetchUsernames(uids);
    });

    this.getReactions('message_7').subscribe((reactions: any[]) => {
      this.selectedReactions_7 = this.groupReactionsByEmoji(reactions);
      const uids = reactions.map((r) => r.userId);
      this.fetchUsernames(uids);

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

    const usernames = reaction.users.map((uid: string) => {
      return this.userIdToUsernameMap[uid] || 'Cargando...';
    });

    if (userCount === 1) {
      return `${usernames[0]} ha reaccionado con ${reaction.emoji}`;
    } else if (userCount === 2) {
      return `${usernames[0]} y ${usernames[1]} han reaccionado con ${reaction.emoji}`;
    } else if (userCount === 3) {
      return `${usernames[0]}, ${usernames[1]} y ${usernames[2]} han reaccionado con ${reaction.emoji}`;
    } else {
      const firstThreeUsers = usernames.slice(0, 3).join(', ');
      const remainingUsers = userCount - 3;
      return `${firstThreeUsers} y ${remainingUsers} personas más han reaccionado con ${reaction.emoji}`;
    }
  }

  fetchUsernames(uids: string[]) {
    const uniqueUids = Array.from(new Set(uids));

    uniqueUids.forEach((uid) => {
      if (!this.userIdToUsernameMap[uid]) {
        this.userService.getUserProfile(uid).subscribe((userData) => {
          if (userData && userData.username) {
            this.userIdToUsernameMap[uid] = userData.username;
          } else {
            this.userIdToUsernameMap[uid] = 'Usuario desconocido';
          }
          this.cdr.detectChanges();
        });
      }
    });
  }

  // Función para manejar agregar o eliminar reacciones
  addOrRemoveReaction(reaction: any, messageId: string) {
    const currentUser = this.authService.currentUserSig();

    if (currentUser && currentUser.uid) {
      const currentUserId = currentUser.uid;
      const hasReacted = reaction.users.includes(currentUserId);

      if (hasReacted) {
        this.userService.removeReaction(reaction, messageId).subscribe(() => {
          console.log(`Reacción eliminada para ${messageId}`);
        });
      } else {
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

    if (messageId === 'message_1') {
      this.showReactionMenu_1 = false;
    } else if (messageId === 'message_2') {
      this.showReactionMenu_2 = false;
    } else if (messageId === 'message_3') {
      this.showReactionMenu_3 = false;
    } else if (messageId === 'message_4') {
      this.showReactionMenu_4 = false;
    } else if (messageId === 'message_5') {
      this.showReactionMenu_5 = false;
    } else if (messageId === 'message_6') {
      this.showReactionMenu_6 = false;
    } else if (messageId === 'message_7') {
      this.showReactionMenu_7 = false;
    }
  }

  toggleReactionMenu(messageId: string) {
    if (messageId === 'message_1') {
      this.showReactionMenu_1 = !this.showReactionMenu_1;
    } else if (messageId === 'message_2') {
      this.showReactionMenu_2 = !this.showReactionMenu_2;
    } else if (messageId === 'message_3') {
      this.showReactionMenu_3 = !this.showReactionMenu_3;
    } else if (messageId === 'message_4') {
      this.showReactionMenu_4 = !this.showReactionMenu_4;
    } else if (messageId === 'message_5') {
      this.showReactionMenu_5 = !this.showReactionMenu_5;
    } else if (messageId === 'message_6') {
      this.showReactionMenu_6 = !this.showReactionMenu_6;
    } else if (messageId === 'message_7') {
      this.showReactionMenu_7 = !this.showReactionMenu_7;
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
