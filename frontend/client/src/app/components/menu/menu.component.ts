import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MenuService, MenuItem } from '../../services/menu.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  menuItems: MenuItem[] = [];
  loading = true;
  categories: string[] = [];
  itemQuantities: { [key: string]: number } = {};

  constructor(
    private menuService: MenuService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMenuItems();
  }

  loadMenuItems(): void {
    this.loading = true;
    this.menuService.getMenuItems().subscribe({
      next: (items) => {
        // Items from the API are already filtered to available items
        this.menuItems = items;
        // Initialize quantities to 0
        this.menuItems.forEach(item => {
          this.itemQuantities[item._id!] = 0;
        });
        // Since we removed categories, we'll display all items together
        this.categories = ['all'];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading menu items:', error);
        this.loading = false;
      }
    });
  }

  updateQuantity(itemId: string, change: number): void {
    const currentQty = this.itemQuantities[itemId] || 0;
    const newQty = Math.max(0, currentQty + change);
    this.itemQuantities[itemId] = newQty;
  }

  addToCart(item: MenuItem): void {
    const quantity = this.itemQuantities[item._id!] || 0;
    if (quantity > 0) {
      this.cartService.addToCart(item, quantity);
      // Reset the quantity after adding to cart
      this.itemQuantities[item._id!] = 0;
    }
  }

  goToBooking(): void {
    // Add all selected items to cart
    this.menuItems.forEach(item => {
      const quantity = this.itemQuantities[item._id!] || 0;
      if (quantity > 0) {
        this.cartService.addToCart(item, quantity);
        // Reset the quantity after adding to cart
        this.itemQuantities[item._id!] = 0;
      }
    });
    
    // Navigate to booking page
    this.router.navigate(['/booking']);
  }

  goToPayment(): void {
    // Add all selected items to cart
    this.menuItems.forEach(item => {
      const quantity = this.itemQuantities[item._id!] || 0;
      if (quantity > 0) {
        this.cartService.addToCart(item, quantity);
        // Reset the quantity after adding to cart
        this.itemQuantities[item._id!] = 0;
      }
    });

    // Check if there are items in the cart
    const cartItems = this.cartService.getCartItems();
    if (cartItems.length === 0) {
      alert('Please select at least one item before proceeding to payment.');
      return;
    }

    // Calculate total price
    const totalPrice = this.cartService.getCartTotal();

    // Create an order with table number 0 (for takeout/delivery) and navigate to booking page
    // Since booking page is used for both table booking and order placement, we'll use it
    this.router.navigate(['/booking'], { 
      queryParams: { 
        orderOnly: 'true',
        totalPrice: totalPrice 
      } 
    });
  }

  getImageUrl(imagePath: string): string {
    // If the image path is already a full URL, return it as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    // If it's a relative path, prepend the backend URL
    return `http://localhost:5000${imagePath}`;
  }
}