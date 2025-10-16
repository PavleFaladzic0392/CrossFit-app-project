import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonCheckbox,
  AlertController,
  IonText
} from '@ionic/angular/standalone';
import { RouterModule, Router } from '@angular/router';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonCheckbox,
    RouterModule,
    IonText
  ],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  registerForm!: FormGroup;

  constructor(private fb: FormBuilder, private alertCtrl: AlertController, private router: Router) {}

  ngOnInit() {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator }); 
  }


  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirm = form.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  async onRegister() {
    if (!this.registerForm.valid) {
      this.registerForm.markAllAsTouched();

      
      if (this.registerForm.errors?.['mismatch']) {

        await this.showAlert('Lozinka i potvrda lozinke se ne poklapaju.');
        return;
      }

      await this.showAlert('Popunite sva polja ispravno i prihvatite uslove.');
      return;
    }

    const { email, password } = this.registerForm.value;
    const auth = getAuth();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await this.showAlert('Uspešno ste registrovani!');
      this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error: any) {
      let message = 'Došlo je do greške. Pokušajte ponovo.';
      if (error.code === 'auth/email-already-in-use') message = 'Email je već registrovan.';
      else if (error.code === 'auth/invalid-email') message = 'Neispravna email adresa.';
      else if (error.code === 'auth/weak-password') message = 'Lozinka je previše slaba.';
      await this.showAlert(message);
    }
  }

  async showAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Obaveštenje',
      message,
      buttons: ['U redu']
    });
    await alert.present();
  }
}
