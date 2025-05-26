import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ReelsComponent } from "./reels/reels.component";

@Component({
  selector: 'app-root',
  imports: [ ReelsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
}
