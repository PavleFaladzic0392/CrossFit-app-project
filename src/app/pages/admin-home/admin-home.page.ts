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

 
  get selectedDay() {
    return this.days.find(d => d.selected);
  }

  
  showNewSessionForm = false;
  newSession: any = { title: '', startTime: '', endTime: '', capacity: 0 };

  
  sessionsByDay: { [date: string]: any[] } = {};

  constructor(
    private alertController: AlertController,
    private menu: MenuController,
    private router: Router
  ) {
    this.loadAllFromFirebase(); 
  }

 
  selectDay(day: any) {
    this.days.forEach(d => d.selected = false);
    day.selected = true;
  }

  
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

   
    this.newSession = { title: '', startTime: '', endTime: '', capacity: 0 };
    this.showNewSessionForm = false;
  }

 
  getSessionsForSelectedDay() {
    const date = this.selectedDay?.date;
    return date && this.sessionsByDay[date] ? this.sessionsByDay[date] : [];
  }

 
  editSession(session: any) {
    session.editing = true;
  }

 
  saveSession(session: any) {
    session.editing = false;
    this.presentAlert('Trening je uspešno izmenjen ✅');
  }

 
  async sendAllToFirebase() {
    const db = getDatabase();
    try {
     
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
