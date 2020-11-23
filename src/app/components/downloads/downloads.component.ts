import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-downloads',
  templateUrl: './downloads.component.html',
  styleUrls: ['./downloads.component.scss']
})
export class DownloadsComponent implements OnInit {
  downloads: any = [
    {
      title: "Data Sheets and Certifications",
      links: [
        {
          name: "PME Product Data Sheet (Pudlo Middle East TDS)",
          url: "http://nebula.wsimg.com/fb176894067a23934e18aa58b6b9d2ec?AccessKeyId=A5C4A86BE527E5C5CB0C&disposition=0&alloworigin=1"
        },
        {
          name: "PME MSDS (Pudlo Middle East MSDS)",
          url: "http://nebula.wsimg.com/aae3b369e9d800df39e0f0c6ec00db5d?AccessKeyId=A5C4A86BE527E5C5CB0C&disposition=0&alloworigin=1"
        },
        {
          name: "BBA Certificate",
          url: "http://nebula.wsimg.com/eaca6af85e70528416ce28698e952d97?AccessKeyId=A5C4A86BE527E5C5CB0C&disposition=0&alloworigin=1"
        },
        {
          name: "ISO 9001 Certificate",
          url: "http://nebula.wsimg.com/4d76f89a77a6cc24f408695e4e51b097?AccessKeyId=A5C4A86BE527E5C5CB0C&disposition=0&alloworigin=1"
        },
        {
          name: "ISO 14001 Certificate",
          url: "http://nebula.wsimg.com/df8453cd3a279bed3266b6e5f5b3df35?AccessKeyId=A5C4A86BE527E5C5CB0C&disposition=0&alloworigin=1"
        },
        {
          name: "WRAS Certificate",
          url: "http://nebula.wsimg.com/c2bb8e624439dd0f3f5b75d62c86c7e9?AccessKeyId=A5C4A86BE527E5C5CB0C&disposition=0&alloworigin=1"
        },
        {
          name: "CE Mark Certificate",
          url: "http://nebula.wsimg.com/537a384a32455b8766c36ef8d98a19a3?AccessKeyId=A5C4A86BE527E5C5CB0C&disposition=0&alloworigin=1"
        }
      ]
    },
    {
      title: "Marketing Literature",
      links: [
        {
          name: "PUDLO Brochure",
          url: "http://nebula.wsimg.com/8d9721bff2be6346308683b2da2cad03?AccessKeyId=A5C4A86BE527E5C5CB0C&disposition=0&alloworigin=1"
        },
        {
          name: "Technical Submittal",
          isText: true,
          url: "If you would like to request for our Technical Submittal, kindly complete the form below and we will revert back to you as soon as possible.  Thank you."
        }
      ]
    }
  ]
  constructor() { }

  ngOnInit(): void {
  }

}
