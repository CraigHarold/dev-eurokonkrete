import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component'
import { AboutComponent } from './components/about/about.component';
import { CompanyComponent } from './components/company/company.component';
import { LocationComponent } from './components/location/location.component';

const routes: Routes = [
  {
    path: '', redirectTo: '', component: HomeComponent, pathMatch: 'full'
  },
  {
    path: 'about', component: AboutComponent
  },
  {
    path: 'company', component: CompanyComponent
  },
  {
    path: 'location', component: LocationComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
