import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonSpinner } from '@ionic/angular/standalone'; // ✅ Dodaj IonSpinner

@Component({
  selector: 'app-loader',
  templateUrl: './loader.page.html',
  styleUrls: ['./loader.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSpinner, // ✅ Dodaj ovde
    CommonModule,
    FormsModule
  ]
})
export class LoaderPage implements OnInit {

  constructor() { }

  ngOnInit() { 
    console.log("hello");
    
  }

}
