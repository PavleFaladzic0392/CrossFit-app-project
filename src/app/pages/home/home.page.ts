import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuController, AlertController, IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { getDatabase, ref, onValue } from 'firebase/database';

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
    private router: Router
  ) {}

  ngOnInit() {
    const today = this.days.find(d => d.selected);
    if (today) {
      this.loadSessions(today.date);
    }
  }

  selectDay(selectedDay: any) {
    this.days.forEach(day => (day.selected = false));
    selectedDay.selected = true;
    this.selectedDate = new Date(selectedDay.date);
    this.loadSessions(selectedDay.date);
  }

  // Učitavanje treninga iz Firebase sa filterom za prošle treninge
  loadSessions(date: string) {
    const db = getDatabase();
    const sessionsRef = ref(db, `treninzi/${date}`);
    onValue(sessionsRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const allSessions = Object.values(data);

        // Filtriramo treninge čije je vreme početka prošlo
        const now = new Date();
        this.sessions = allSessions.filter((session: any) => {
          const sessionStart = new Date(`${date}T${session.startTime}`);
          return sessionStart.getTime() > now.getTime();
        });
      } else {
        this.sessions = [];
      }
    });
  }

  async onReserve(session: any) {
    const reservations = this.getUserReservations();
    const sessionKey = `${session.title}-${session.startTime}-${session.endTime}`;

    if (reservations.includes(sessionKey)) {
      await this.presentAlert('Već ste rezervisali ovaj termin.');
      return;
    }

    if (!session.taken) session.taken = 0;

    if (session.taken < session.capacity) {
      session.taken++;
      reservations.push(sessionKey);
      this.saveUserReservations(reservations);
      await this.presentAlert(`Uspešno ste rezervisali termin: ${session.title}`);
    } else {
      await this.presentAlert('Termin je popunjen.');
    }
  }

  async onCancel(session: any) {
    const now = new Date();
    const trainingStart = new Date(`${this.selectedDate.toISOString().split('T')[0]}T${session.startTime}`);
    const timeDiffMs = trainingStart.getTime() - now.getTime();
    const oneHourMs = 60 * 60 * 1000;
    const reservations = this.getUserReservations();
    const sessionKey = `${session.title}-${session.startTime}-${session.endTime}`;

    if (!reservations.includes(sessionKey)) {
      await this.presentAlert('Nemate rezervaciju za ovaj termin.');
      return;
    }

    if (timeDiffMs >= oneHourMs) {
      session.taken--;
      const updatedReservations = reservations.filter(r => r !== sessionKey);
      this.saveUserReservations(updatedReservations);
      await this.presentAlert('Uspešno ste otkazali rezervaciju.');
    } else {
      await this.presentAlert('Otkazivanje je moguće najkasnije 1 sat pre početka treninga.');
    }
  }

  getUserReservations(): string[] {
    const data = localStorage.getItem('userReservations');
    return data ? JSON.parse(data) : [];
  }

  saveUserReservations(reservations: string[]) {
    localStorage.setItem('userReservations', JSON.stringify(reservations));
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
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
