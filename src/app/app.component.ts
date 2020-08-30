import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
  
export class AppComponent {
  title = 'eurokonkrete-com';
  className: string = "";

  onWindowScroll(event) {
    console.log(event, window);
    if (window.pageYOffset > 10 && window.innerWidth > 768) this.className = "scrolled";
    else this.className = "";
  }
}
