import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3>Crown Kitchen</h3>
          <p>Experience premium dining with our world-class service and exquisite cuisine.</p>
        </div>
        
        <div class="footer-section">
          <h4>Contact Us</h4>
          <ul>
            <li>📞 +91 72838 47108</li>
            <li>✉️ info&#64;crownkitchen.com</li>
            <li>📍 123 Food Street, Culinary District, Mumbai - 400001</li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a routerLink="/home" routerLinkActive="active">Home</a></li>
            <li><a routerLink="/menu" routerLinkActive="active">Menu</a></li>
            <li><a routerLink="/booking" routerLinkActive="active">Book a Table</a></li>
            <li><a routerLink="/profile" routerLinkActive="active">Profile</a></li>
            <li><a routerLink="/contact" routerLinkActive="active">Contact</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Opening Hours</h4>
          <ul>
            <li>Monday - Friday: 11:00 AM - 11:00 PM</li>
            <li>Saturday - Sunday: 10:00 AM - 12:00 AM</li>
          </ul>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; 2026 Crown Kitchen. All rights reserved. | Designed with ❤️ for amazing dining experiences</p>
      </div>
    </footer>
  `,
  styles: [`
    .app-footer {
      background: linear-gradient(135deg, #2c3e50, #1a1a2e);
      color: white;
      padding: 2rem 0 0;
      margin-top: auto;
    }
    
    .footer-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    
    .footer-section h3 {
      color: #f39c12;
      margin-bottom: 1rem;
      font-size: 1.5rem;
    }
    
    .footer-section h4 {
      color: #f1c40f;
      margin-bottom: 1rem;
      font-size: 1.1rem;
    }
    
    .footer-section ul {
      list-style: none;
      padding: 0;
    }
    
    .footer-section ul li {
      margin-bottom: 0.5rem;
      opacity: 0.8;
    }
    
    .footer-section a {
      color: #ddd;
      text-decoration: none;
      transition: color 0.3s;
    }
    
    .footer-section a:hover {
      color: #f39c12;
    }
    
    .footer-section a.active {
      color: #f39c12;
      font-weight: bold;
      text-decoration: underline;
    }
    
    .footer-bottom {
      background-color: rgba(0, 0, 0, 0.3);
      padding: 1.5rem;
      text-align: center;
      margin-top: 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .footer-bottom p {
      margin: 0;
      opacity: 0.7;
    }
    
    @media (max-width: 768px) {
      .footer-content {
        grid-template-columns: 1fr;
        gap: 1.5rem;
        padding: 0 1rem;
      }
    }
  `]
})
export class FooterComponent {}
