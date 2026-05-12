import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MenuItem } from './menu.service';

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$ = this.cartSubject.asObservable();

  constructor() {}

  addToCart(item: MenuItem, quantity: number = 1): void {
    const currentCart = this.cartSubject.value;
    const existingItemIndex = currentCart.findIndex(cartItem => cartItem.item._id === item._id);

    if (existingItemIndex > -1) {
      // Update quantity if item already exists
      const updatedCart = [...currentCart];
      updatedCart[existingItemIndex].quantity += quantity;
      this.cartSubject.next(updatedCart);
    } else {
      // Add new item to cart
      const newCartItem: CartItem = { item, quantity };
      this.cartSubject.next([...currentCart, newCartItem]);
    }
  }

  removeFromCart(itemId: string): void {
    const currentCart = this.cartSubject.value;
    const updatedCart = currentCart.filter(cartItem => cartItem.item._id !== itemId);
    this.cartSubject.next(updatedCart);
  }

  updateQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(itemId);
      return;
    }

    const currentCart = this.cartSubject.value;
    const itemIndex = currentCart.findIndex(cartItem => cartItem.item._id === itemId);

    if (itemIndex > -1) {
      const updatedCart = [...currentCart];
      updatedCart[itemIndex].quantity = quantity;
      this.cartSubject.next(updatedCart);
    }
  }

  clearCart(): void {
    this.cartSubject.next([]);
  }

  getCartTotal(): number {
    return this.cartSubject.value.reduce((total, cartItem) => {
      return total + (cartItem.item.price * cartItem.quantity);
    }, 0);
  }

  getCartItems(): CartItem[] {
    return this.cartSubject.value;
  }

  getCartItemCount(): number {
    return this.cartSubject.value.reduce((count, cartItem) => count + cartItem.quantity, 0);
  }
}