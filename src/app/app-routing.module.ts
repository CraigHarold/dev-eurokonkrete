import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component'
import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';
import { DownloadsComponent } from './components/downloads/downloads.component';
import { ProductsComponent } from './components/products/products.component';

const routes: Routes = [
  {
    path: '', redirectTo: '', component: HomeComponent, pathMatch: 'full'
  },
  {
    path: 'about', component: AboutComponent
  },
  {
    path: 'contact', component: ContactComponent
  },
  {
    path: 'downloads', component: DownloadsComponent
  },
  {
    path: "products", component: ProductsComponent
  },
  {
    path: "products/:id", component: ProductsComponent
  },
  {
    path: "products/pudlocwp/:id", component: ProductsComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
