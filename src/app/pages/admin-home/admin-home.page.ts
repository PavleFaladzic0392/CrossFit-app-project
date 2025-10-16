import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, MenuController } from '@ionic/angular';
import { Router } from '@angular/router';
import { getDatabase, ref, set, onValue } from 'firebase/database';

@Component({
  selector: 'app-admin-home',
  templateUrl: './admin-home.page.html',
  styleUrls: ['./admin-home.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AdminHomePage {
  // Dani u horizontalnom prikazu
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

  // Trenutno selektovan dan
  get selectedDay() {
    return this.days.find(d => d.selected);
  }

  // Forma za dodavanje novog treninga
  showNewSessionForm = false;
  newSession: any = { title: '', startTime: '', endTime: '', capacity: 0 };

  // Svi treninzi grupisani po danima
  sessionsByDay: { [date: string]: any[] } = {};

  constructor(
    private alertController: AlertController,
    private menu: MenuController,
    private router: Router
  ) {
    this.loadAllFromFirebase(); // učitavanje svih treninga pri startu
  }

  // Selektovanje dana
  selectDay(day: any) {
    this.days.forEach(d => d.selected = false);
    day.selected = true;
  }

  // Dodavanje novog treninga za selektovani dan
  addNewSession() {
    if (!this.newSession.title || !this.newSession.startTime || !this.newSession.endTime || this.newSession.capacity <= 0) {
      this.presentAlert('Popunite sve podatke ispravno!');
      return;
    }

    const date = this.selectedDay?.date;
    if (!date) return;

    if (!this.sessionsByDay[date]) {
      this.sessionsByDay[date] = [];
    }

    this.sessionsByDay[date].push({ ...this.newSession, editing: false });

    this.presentAlert('Trening dodat lokalno ✅');

    // Reset forme
    this.newSession = { title: '', startTime: '', endTime: '', capacity: 0 };
    this.showNewSessionForm = false;
  }

  // Dobijanje treninga za selektovani dan
  getSessionsForSelectedDay() {
    const date = this.selectedDay?.date;
    return date && this.sessionsByDay[date] ? this.sessionsByDay[date] : [];
  }

  // Omogućava izmenu treninga
  editSession(session: any) {
    session.editing = true;
  }

  // Čuvanje izmenjenog treninga
  saveSession(session: any) {
    session.editing = false;
    this.presentAlert('Trening je uspešno izmenjen ✅');
  }

  // Slanje svih treninga u Firebase
  async sendAllToFirebase() {
    const db = getDatabase();
    try {
      // merge: učitava postojeće podatke, kombinuje sa lokalnim i šalje nazad
      const refDb = ref(db, 'treninzi/');
      onValue(refDb, snapshot => {
        const existingData = snapshot.val() || {};
        const mergedData = { ...existingData, ...this.sessionsByDay };
        set(ref(db, 'treninzi/'), mergedData);
      });
      this.presentAlert('Svi treninzi su poslati u Firebase ✅');
    } catch (error) {
      this.presentAlert('Došlo je do greške prilikom slanja u Firebase!');
      console.error(error);
    }
  }

  // Učitavanje svih treninga iz Firebase
  loadAllFromFirebase() {
    const db = getDatabase();
    const refDb = ref(db, 'treninzi/');
    onValue(refDb, snapshot => {
      const data = snapshot.val();
      if (data) {
        this.sessionsByDay = data;
      }
    });
  }

  // Lokalni alert
  async presentAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Obaveštenje',
      message,
      buttons: ['U redu']
    });
    await alert.present();
  }

  // Logout
  async logout() {
    await this.menu.close('mainMenu');
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
