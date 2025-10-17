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
      this.selectedDate = new Date(today.date);
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
    this.firebaseService.getData(`treninzi/${date}`).subscribe(data => {
      if (data) {
        const allSessions = Object.values(data);
        const now = new Date();
        this.sessions = allSessions.map((session: any) => {
          const sessionStart = new Date(`${date}T${session.startTime}`);
          
          const reserved = localStorage.getItem(`reserved-${date}`) === session.title;
          return { ...session, isReserved: reserved, sessionStart };
        }).filter((session: any) => session.sessionStart.getTime() > now.getTime());
      } else {
        this.sessions = [];
      }
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
          localStorage.setItem(`reserved-${dateKey}`, session.title);
          this.reservedTitleForSelectedDay = session.title;

          await this.presentAlert(`Uspešno ste rezervisali termin: ${session.title}`);
        },
        error: async () => {
          session.taken--;
          await this.presentAlert('Greška prilikom rezervacije. Pokušajte ponovo.');
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
    this.firebaseService.putData(`treninzi/${dateKey}/${sessionKey}`, session).subscribe({
      next: async () => {
        session.isReserved = false;
        localStorage.removeItem(`reserved-${dateKey}`);
        this.reservedTitleForSelectedDay = null;

        await this.presentAlert(`Uspešno ste otkazali termin: ${session.title}`);
      },
      error: async () => {
        session.taken++;
        await this.presentAlert('Greška prilikom otkazivanja. Pokušajte ponovo.');
      }
    });
  }

  loadReservedForDate(date: string) {
    const reserved = localStorage.getItem(`reserved-${date}`);
    this.reservedTitleForSelectedDay = reserved || null;
    
    this.sessions = this.sessions.map(s => ({
      ...s,
      isReserved: s.title === reserved
    }));
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
