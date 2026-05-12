import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent {
  sidebarOpen = true;
  brandLogoUrl = '/tastybite-logo.png';
  private brandLogoFallbacks = ['/crown-kitchen-logo.svg', '/royal-platter-logo.png', '/royal-platter-logo.svg'];
  private brandLogoIndex = 0;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  onBrandLogoError(): void {
    if (this.brandLogoIndex < this.brandLogoFallbacks.length) {
      this.brandLogoUrl = this.brandLogoFallbacks[this.brandLogoIndex++];
    } else {
      this.brandLogoUrl = '';
    }
  }
}
