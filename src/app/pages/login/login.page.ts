import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AlertController, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    RouterModule,
    RouterLink,
  ]
})
export class LoginPage {
  email: string = '';
  password: string = '';

  private adminEmail = 'admin@admin.com';
  private adminPassword = 'admin123';

  constructor(private router: Router, private alertCtrl: AlertController) {}

  async login() {
    if (!this.email || !this.password) {
      await this.presentAlert('Unesite email i lozinku.');
      return;
    }

    if (this.email === this.adminEmail && this.password === this.adminPassword) {
      this.router.navigate(['/admin-home'], { replaceUrl: true });
      return;
    }

    this.router.navigate(['/home'], { replaceUrl: true });
  }

  async presentAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Obaveštenje',
      message,
      buttons: ['U redu']
    });
    await alert.present();
  }
}


