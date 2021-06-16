import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})
export class SideNavComponent implements OnInit {
    showProductDropdown: boolean;
    headers = [
        {
            "name": "Home",
            "url": "/",
            "sequence": 1
        },
        {
            "name": "About",
            "url": "",
            "sequence": 2,
            "subChild": [
                {
                    "name": "Pudlo",
                    "url": "/about",
                }
            ]
        },
        {
            "name": "Downloads",
            "url": "/downloads",
            "sequence": 3
        },
        {
            "name": "Contact",
            "url": "/contact",
            "sequence": 4
        }
    ];
  constructor() { }

  @Input() className: string;

  ngOnInit(): void {
  }

  homeClick() {
    //   setTimeout(() => {
    //     window.location.reload(true);
    //   },0);
  }

  dropdownClick(id) {
      switch (id) {
          case "products" : 
          this.showProductDropdown = !this.showProductDropdown
          break;
      }
  }

}
