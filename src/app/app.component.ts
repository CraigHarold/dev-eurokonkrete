import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
  
export class AppComponent {
  title = 'eurokonkrete-com';
  className: string = "";
  onWindowScroll(event) {
    // console.log(event, window.pageYOffset);
    // if (window.pageYOffset > 60) this.className = "scrolledHeader";
    // else this.className = "";
  }
}
