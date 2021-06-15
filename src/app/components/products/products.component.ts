import { Component } from "@angular/core";
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: "products",
    templateUrl: './products.component.html'
})

export class ProductsComponent {
    id: string;
    sub;
    constructor(private route: ActivatedRoute) { }

    ngOnInit(): void {
        this.sub = this.route.paramMap.subscribe(params => {
            this.id = params.get("id");
            console.log("id", this.id);
            
            var id;
            switch(this.id) {
                default: 
                    if (!this.id) {
                        id = document.getElementById("products");
                    } else {
                        id = document.getElementById(this.id);
                    }
                    id.scrollIntoView();
                break;
            }
        });
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }
}