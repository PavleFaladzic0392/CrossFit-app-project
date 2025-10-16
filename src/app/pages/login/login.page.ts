import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { 
  AlertController,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton
} from '@ionic/angular/standalone';

import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'; 

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
      localStorage.setItem('userEmail', this.email); 
      this.router.navigate(['/admin-home'], { replaceUrl: true });
      return;
    }

    
    const auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
      console.log('Ulogovan korisnik:', userCredential.user.email);

      
      localStorage.setItem('userEmail', userCredential.user.email || this.email);

      this.router.navigate(['/home'], { replaceUrl: true });
    } catch (error: any) {
      console.error('Greška pri logovanju:', error);
      this.handleFirebaseError(error.code);
    }
  }

  async handleFirebaseError(errorCode: string) {
    let message = 'Došlo je do greške. Pokušajte ponovo.';
    switch (errorCode) {
      case 'auth/invalid-email':
        message = 'Neispravna email adresa.';
        break;
      case 'auth/user-not-found':
        message = 'Korisnik sa ovim emailom ne postoji.';
        break;
      case 'auth/wrong-password':
        message = 'Pogrešna lozinka.';
        break;
      case 'auth/too-many-requests':
        message = 'Previše pokušaja. Pokušajte kasnije.';
        break;
    }
    await this.presentAlert(message);
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
