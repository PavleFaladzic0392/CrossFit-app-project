import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MenuController } from '@ionic/angular';
import {
  IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonListHeader,
  IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet,
  IonButton
} from '@ionic/angular/standalone';

// ✅ Firebase test importi
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonListHeader,
    IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet,
    IonButton, RouterLink
  ]
})
export class AppComponent implements OnInit {
  public appPages = [
    { title: 'Home', url: '/home', icon: 'home' },
    { title: 'Admin', url: '/admin-home', icon: 'person' }
  ];

  constructor(private router: Router, private menuCtrl: MenuController) {}

  
  ngOnInit() {
    
  }

  logout() {
    this.menuCtrl.close().then(() => {
      this.router.navigate(['/login'], { replaceUrl: true });
    });
  }
}
