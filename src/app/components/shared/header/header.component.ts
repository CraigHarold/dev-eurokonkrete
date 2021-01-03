import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'header',
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit {
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

}
