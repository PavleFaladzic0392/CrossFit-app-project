import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuController, AlertController, IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class HomePage implements OnInit {

  selectedDate: Date = new Date();
  sessions: any[] = [];
  reservedTitleForSelectedDay: string | null = null;
  userEmail: string = '';

  days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      label: date.toLocaleDateString('sr-Latn-RS', { weekday: 'short' }),
      date: date.toISOString().split('T')[0],
      displayDate: date.toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'numeric' }),
      selected: i === 0
    };
  });

  constructor(
    private alertController: AlertController,
    private menu: MenuController,
    private router: Router,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit() {
    this.userEmail = localStorage.getItem('userEmail') || '';
    const today = this.days.find(d => d.selected);
    if (today) {
      this.loadSessions(today.date);
      this.loadReservedForDate(today.date);
    }
  }

  selectDay(selectedDay: any) {
    this.days.forEach(day => day.selected = false);
    selectedDay.selected = true;
    this.selectedDate = new Date(selectedDay.date);

    this.loadSessions(selectedDay.date);
    this.loadReservedForDate(selectedDay.date);
  }

  loadSessions(date: string) {
  this.firebaseService.getData(`treninzi/${date}`).subscribe(sessionsData => {
    if (!sessionsData) {
      this.sessions = [];
      return;
    }

    const allSessions = Object.values(sessionsData);

    this.firebaseService.getData(`rezervacije/${date}`).subscribe(reservationsData => {
      const reservations = reservationsData ? Object.values(reservationsData) : [];

      const now = new Date();
      this.sessions = allSessions.map((session: any) => {
        const sessionKey = `${session.title}-${session.startTime}-${session.endTime}`;
        const sessionStart = new Date(`${date}T${session.startTime}`);

        if (sessionStart.getTime() <= now.getTime()) return null;

        session.isReserved = reservations.some((r: any) => r.session === sessionKey && r.email === this.userEmail);

        if (!session.taken) session.taken = 0;

        return session;
      }).filter(s => s !== null);
    });
  });
}


  async onReserve(session: any) {
    const dateKey = this.selectedDate.toISOString().split('T')[0];
    const sessionKey = `${session.title}-${session.startTime}-${session.endTime}`;

    if (!session.taken) session.taken = 0;

    if (session.taken < session.capacity) {
      session.taken++;

      this.firebaseService.putData(`treninzi/${dateKey}/${sessionKey}`, session).subscribe({
        next: async () => {
          session.isReserved = true;

          this.firebaseService.postData(`rezervacije/${dateKey}`, {
            session: sessionKey,
            email: this.userEmail
          }).subscribe({
            next: async () => {
              this.reservedTitleForSelectedDay = session.title;
              await this.presentAlert(`Uspešno ste rezervisali termin: ${session.title}`);
            },
            error: async () => {
              session.taken--;
              session.isReserved = false;
              await this.presentAlert('Greška prilikom rezervacije. Pokušajte ponovo.');
            }
          });
        },
        error: async () => {
          session.taken--;
          await this.presentAlert('Greška prilikom rezervacije treninga.');
        }
      });
    } else {
      await this.presentAlert('Termin je popunjen.');
    }
  }

  async onCancel(session: any) {
    const dateKey = this.selectedDate.toISOString().split('T')[0];
    const sessionKey = `${session.title}-${session.startTime}-${session.endTime}`;

    if (!session.taken || session.taken <= 0) {
      await this.presentAlert('Nemate rezervaciju za ovaj termin.');
      return;
    }

    session.taken--;
    session.isReserved = false;

    this.firebaseService.putData(`treninzi/${dateKey}/${sessionKey}`, session).subscribe({
      next: async () => {

        this.firebaseService.getData(`rezervacije/${dateKey}`).subscribe(reservations => {
          if (reservations) {
            const keyToDelete = Object.keys(reservations).find(k => reservations[k].session === sessionKey && reservations[k].email === this.userEmail);
            if (keyToDelete) {
              this.firebaseService.deleteData(`rezervacije/${dateKey}/${keyToDelete}`).subscribe();
            }
          }
        });

        this.reservedTitleForSelectedDay = null;
        await this.presentAlert('Uspešno ste otkazali rezervaciju.');
      },
      error: async () => {
        session.taken++;
        session.isReserved = true;
        await this.presentAlert('Greška prilikom otkazivanja. Pokušajte ponovo.');
      }
    });
  }

  loadReservedForDate(date: string) {
    this.reservedTitleForSelectedDay = localStorage.getItem(`reservedTitle-${date}`) || null;
  }

  async presentAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Obaveštenje',
      message,
      buttons: ['U redu']
    });
    await alert.present();
  }

  async logout() {
    await this.menu.close('mainMenu');
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
