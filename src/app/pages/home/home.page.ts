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
  reservedTitleForSelectedDay: string | null = null; // 👈 naziv rezervisanog treninga za izabrani dan

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
      this.loadReservedForDate(today.date);
    }
  }

  selectDay(selectedDay: any) {
    this.days.forEach(day => (day.selected = false));
    selectedDay.selected = true;
    this.selectedDate = new Date(selectedDay.date);
    this.loadSessions(selectedDay.date);
    this.loadReservedForDate(selectedDay.date); // 👈 Učitaj rezervaciju za taj dan
  }

  loadSessions(date: string) {
    const db = getDatabase();
    const sessionsRef = ref(db, `treninzi/${date}`);
    onValue(sessionsRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const allSessions = Object.values(data);
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
    const dateKey = this.selectedDate.toISOString().split('T')[0];
    const sessionKey = `${session.title}-${session.startTime}-${session.endTime}`;

    if (!reservations[dateKey]) reservations[dateKey] = [];

    if (reservations[dateKey].includes(sessionKey)) {
      await this.presentAlert('Već ste rezervisali ovaj termin za ovaj dan.');
      return;
    }

    if (!session.taken) session.taken = 0;

    if (session.taken < session.capacity) {
      session.taken++;
      reservations[dateKey].push(sessionKey);
      this.saveUserReservations(reservations);

      // 👇 Čuvamo koji trening je rezervisan za taj dan
      this.reservedTitleForSelectedDay = session.title;
      this.saveReservedForDate(dateKey, session.title);

      await this.presentAlert(`Uspešno ste rezervisali termin: ${session.title}`);
    } else {
      await this.presentAlert('Termin je popunjen.');
    }
  }

  async onCancel(session: any) {
    const now = new Date();
    const dateKey = this.selectedDate.toISOString().split('T')[0];
    const trainingStart = new Date(`${dateKey}T${session.startTime}`);
    const timeDiffMs = trainingStart.getTime() - now.getTime();
    const oneHourMs = 60 * 60 * 1000;
    const reservations = this.getUserReservations();
    const sessionKey = `${session.title}-${session.startTime}-${session.endTime}`;

    if (!reservations[dateKey] || !reservations[dateKey].includes(sessionKey)) {
      await this.presentAlert('Nemate rezervaciju za ovaj termin.');
      return;
    }

    if (timeDiffMs >= oneHourMs) {
      session.taken--;
      reservations[dateKey] = reservations[dateKey].filter((r: string) => r !== sessionKey);
      this.saveUserReservations(reservations);

      // 👇 Ako je ovo bio prikazani trening, obriši ga iz prikaza
      this.reservedTitleForSelectedDay = null;
      localStorage.removeItem(`reservedTitle-${dateKey}`);

      await this.presentAlert('Uspešno ste otkazali rezervaciju.');
    } else {
      await this.presentAlert('Otkazivanje je moguće najkasnije 1 sat pre početka treninga.');
    }
  }

  getUserReservations(): Record<string, string[]> {
    const data = localStorage.getItem('userReservationsByDay');
    return data ? JSON.parse(data) : {};
  }

  saveUserReservations(reservations: Record<string, string[]>) {
    localStorage.setItem('userReservationsByDay', JSON.stringify(reservations));
  }

  saveReservedForDate(date: string, title: string) {
    localStorage.setItem(`reservedTitle-${date}`, title);
  }

  loadReservedForDate(date: string) {
    this.reservedTitleForSelectedDay = localStorage.getItem(`reservedTitle-${date}`);
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
