import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AboutComponent } from './components/about/about.component';
import { ContactComponent } from './components/contact/contact.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { MenuComponent } from './components/menu/menu.component';
import { BookingComponent } from './components/booking/booking.component';
import { AdminLayoutComponent } from './components/admin/layout/admin-layout.component';
import { AdminDashboardComponent } from './components/admin/dashboard/admin-dashboard.component';
import { AdminMenuComponent } from './components/admin/menu/admin-menu.component';

import { AdminUsersComponent } from './components/admin/users/admin-users.component';
import { AdminBookingsComponent } from './components/admin/bookings/admin-bookings.component';
import { AdminContactsComponent } from './components/admin/contacts/admin-contacts.component';
import { AdminOrdersComponent } from './components/admin/orders/admin-orders.component';

import { PaymentComponent } from './components/payment/payment.component';
import { PaymentPageComponent } from './components/payment-page/payment-page.component';
import { PaymentConfirmationComponent } from './components/payment-confirmation/payment-confirmation.component';
import { AuthGuard, GuestGuard, AdminGuard } from './services/auth.guard';
import { AdminRevenueComponent } from './components/admin/revenue/admin-revenue.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AdminUserProfilesComponent } from './components/admin/profile/admin-user-profiles.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'booking', component: BookingComponent },
  { path: 'payment/:id', component: PaymentComponent },
  { path: 'secure-payment/:id', component: PaymentPageComponent },
  { path: 'payment-confirmation', component: PaymentConfirmationComponent },
  { path: 'login', component: LoginComponent, canActivate: [GuestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [GuestGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'menu', component: AdminMenuComponent },

      { path: 'users', component: AdminUsersComponent },
      { path: 'bookings', component: AdminBookingsComponent },
      { path: 'orders', component: AdminOrdersComponent },
      { path: 'contacts', component: AdminContactsComponent },
      { path: 'revenue', component: AdminRevenueComponent },
      { path: 'user-profiles', component: AdminUserProfilesComponent }
    ]
  },
  { path: '**', redirectTo: '/home' }
];
