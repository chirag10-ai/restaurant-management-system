import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="main-header">
      <div class="container">
        <div class="logo">
          <a routerLink="/" class="logo-link">
            <img *ngIf="logoUrl" [src]="logoUrl" alt="TastyBite" class="logo-img" (error)="onLogoError()">
            <span class="brand-text">TastyBite</span>
          </a>
        </div>
        
        <nav class="nav-menu">
          <ul class="nav-list">
            <li class="nav-item" *ngIf="isLoggedIn && !isAdmin">
              <a routerLink="/home" routerLinkActive="active" class="nav-link">Home</a>
            </li>
            <li class="nav-item" *ngIf="isLoggedIn && !isAdmin">
              <a routerLink="/menu" routerLinkActive="active" class="nav-link">Menu</a>
            </li>
            <li class="nav-item" *ngIf="isLoggedIn && !isAdmin">
              <a routerLink="/booking" routerLinkActive="active" class="nav-link">Book Table</a>
            </li>
            <li class="nav-item" *ngIf="isLoggedIn && !isAdmin">
              <a routerLink="/about" routerLinkActive="active" class="nav-link">About</a>
            </li>
            <li class="nav-item" *ngIf="isLoggedIn && !isAdmin">
              <a routerLink="/contact" routerLinkActive="active" class="nav-link">Contact</a>
            </li>
            
            <li class="nav-item" *ngIf="!isLoggedIn">
              <a routerLink="/login" routerLinkActive="active" class="nav-link">Login</a>
            </li>
            <li class="nav-item" *ngIf="!isLoggedIn">
              <a routerLink="/register" routerLinkActive="active" class="nav-link">Register</a>
            </li>
            
            <li class="nav-item" *ngIf="isLoggedIn && isAdmin">
              <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-link">Admin Panel</a>
            </li>
            
            <li class="nav-item" *ngIf="isLoggedIn && !isAdmin">
              <a routerLink="/profile" routerLinkActive="active" class="nav-link">Profile</a>
            </li>
            <li class="nav-item" *ngIf="isLoggedIn">
              <button (click)="logout()" class="logout-btn">Logout</button>
            </li>
          </ul>
        </nav>
        
        <div class="mobile-menu-toggle" (click)="toggleMobileMenu()">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      
      <div class="mobile-menu" *ngIf="mobileMenuOpen">
        <ul class="mobile-nav-list">
          <li class="mobile-nav-item" *ngIf="isLoggedIn && !isAdmin">
            <a routerLink="/home" (click)="closeMobileMenu()" routerLinkActive="active" class="mobile-nav-link">Home</a>
          </li>
          <li class="mobile-nav-item" *ngIf="isLoggedIn && !isAdmin">
            <a routerLink="/menu" (click)="closeMobileMenu()" routerLinkActive="active" class="mobile-nav-link">Menu</a>
          </li>
          <li class="mobile-nav-item" *ngIf="isLoggedIn && !isAdmin">
            <a routerLink="/booking" (click)="closeMobileMenu()" routerLinkActive="active" class="mobile-nav-link">Book Table</a>
          </li>
          <li class="mobile-nav-item" *ngIf="isLoggedIn && !isAdmin">
            <a routerLink="/about" (click)="closeMobileMenu()" routerLinkActive="active" class="mobile-nav-link">About</a>
          </li>
          <li class="mobile-nav-item" *ngIf="isLoggedIn && !isAdmin">
            <a routerLink="/contact" (click)="closeMobileMenu()" routerLinkActive="active" class="mobile-nav-link">Contact</a>
          </li>
          
          <li class="mobile-nav-item" *ngIf="!isLoggedIn">
            <a routerLink="/login" (click)="closeMobileMenu()" routerLinkActive="active" class="mobile-nav-link">Login</a>
          </li>
          <li class="mobile-nav-item" *ngIf="!isLoggedIn">
            <a routerLink="/register" (click)="closeMobileMenu()" routerLinkActive="active" class="mobile-nav-link">Register</a>
          </li>
          
          <li class="mobile-nav-item" *ngIf="isLoggedIn && isAdmin">
            <a routerLink="/admin/dashboard" (click)="closeMobileMenu()" routerLinkActive="active" class="mobile-nav-link">Admin Panel</a>
          </li>
          
          <li class="mobile-nav-item" *ngIf="isLoggedIn && !isAdmin">
            <a routerLink="/profile" (click)="closeMobileMenu()" routerLinkActive="active" class="mobile-nav-link">Profile</a>
          </li>
          <li class="mobile-nav-item" *ngIf="isLoggedIn">
            <button (click)="logout(); closeMobileMenu();" class="mobile-logout-btn">Logout</button>
          </li>
        </ul>
      </div>
    </header>
  `,
  styles: [`
    .main-header {
      background-color: #2c3e50;
      color: white;
      padding: 0.5rem 0;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    
    .logo-link {
      color: white;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .logo-img {
      height: 36px;
      width: auto;
      display: block;
    }
    
    .brand-text {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    
    .nav-menu {
      display: flex;
    }
    
    .nav-list {
      display: flex;
      list-style: none;
      margin: 0;
      padding: 0;
      align-items: center;
    }
    
    .nav-item {
      margin-left: 1.5rem;
    }
    
    .nav-link {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background-color 0.3s;
    }
    
    .nav-link:hover,
    .nav-link.active {
      background-color: #34495e;
    }
    
    .logout-btn {
      background-color: #e74c3c;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    .logout-btn:hover {
      background-color: #c0392b;
    }
    
    .mobile-menu-toggle {
      display: none;
      flex-direction: column;
      cursor: pointer;
    }
    
    .mobile-menu-toggle span {
      width: 25px;
      height: 3px;
      background-color: white;
      margin: 3px 0;
      transition: 0.3s;
    }
    
    .mobile-menu {
      display: none;
    }
    
    @media (max-width: 768px) {
      .nav-menu {
        display: none;
      }
      
      .mobile-menu-toggle {
        display: flex;
      }
      
      .mobile-menu {
        display: block;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background-color: #2c3e50;
        box-shadow: 0 10px 10px rgba(0, 0, 0, 0.1);
      }
      
      .mobile-nav-list {
        display: flex;
        flex-direction: column;
        list-style: none;
        margin: 0;
        padding: 1rem;
      }
      
      .mobile-nav-item {
        margin: 0.5rem 0;
      }
      
      .mobile-nav-link {
        color: white;
        text-decoration: none;
        padding: 0.75rem;
        border-radius: 4px;
        display: block;
      }
      
      .mobile-nav-link:hover,
      .mobile-nav-link.active {
        background-color: #34495e;
      }
      
      .mobile-logout-btn {
        background-color: #e74c3c;
        color: white;
        border: none;
        padding: 0.75rem;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
        text-align: left;
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  isLoggedIn = false;
  isAdmin = false;
  mobileMenuOpen = false;
  logoUrl = '/tastybite-logo.png';
  private logoFallbacks = ['/crown-kitchen-logo.svg', '/royal-platter-logo.png', '/royal-platter-logo.svg'];
  private logoIndex = 0;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkLoginStatus();
    console.log('Header component initialized. isLoggedIn:', this.isLoggedIn);
    
    // Subscribe to authentication status changes
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.isAdmin = user?.role === 'admin';
      console.log('Auth state changed. isLoggedIn:', this.isLoggedIn, 'user:', user);
    });
  }

  checkLoginStatus(): void {
    this.isLoggedIn = this.authService.isAuthenticated();
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role === 'admin';
    console.log('checkLoginStatus called. isLoggedIn:', this.isLoggedIn, 'user:', user);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  onLogoError(): void {
    if (this.logoIndex < this.logoFallbacks.length) {
      this.logoUrl = this.logoFallbacks[this.logoIndex++];
    } else {
      this.logoUrl = '';
    }
  }
}
