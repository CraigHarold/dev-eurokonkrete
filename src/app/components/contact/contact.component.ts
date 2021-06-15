import { Component, OnInit, ViewChild } from '@angular/core';
// import { } from 'googlemaps';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html'
})
export class ContactComponent implements OnInit {
  // @ViewChild("map") mapElement: any;
  // map: google.maps.Map;
  // latitude: any = -25.344;
  // longitude: any = 131.036;
  // marker: google.maps.Marker;


  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    this.loadMap();
  }

  loadMap(){
    // let latlng = new google.maps.LatLng(
    //   this.latitude, this.longitude
    // );
    // let mapOptions = {
    //   center: latlng,
    //   zoom: 15,
    //   mapTypeId: google.maps.MapTypeId.ROADMAP
    // };
    // this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

    // // 

  }

}
