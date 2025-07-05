import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { Product } from '../../types/product.types';
import { CartItem } from '../../types/order.types';

@Component({
  selector: 'app-quick-order',
  templateUrl: './quick-order.component.html',
  styleUrls: ['./quick-order.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatBadgeModule,
    MatToolbarModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    FormsModule
  ]
})
export class QuickOrderComponent {
  private productService = inject(ProductService);
  private orderService = inject(OrderService);
  private router = inject(Router);

  products = this.productService.products;
  cartItems = this.orderService.cartItems;
  cartTotal = this.orderService.cartTotal;
  cartItemCount = this.orderService.cartItemCount;
  
  selectedCategory = signal<string>('all');
  
  // Get unique categories from products
  categories = computed(() => {
    const cats = new Set(this.products().map(p => p.category).filter(c => c !== undefined));
    return ['all', ...Array.from(cats)];
  });

  // Filter products by category
  filteredProducts = computed(() => {
    const category = this.selectedCategory();
    let filtered;
    if (category === 'all') {
      filtered = this.products().filter(p => p.inStock);
    } else {
      filtered = this.products().filter(p => p.category === category && p.inStock);
    }
    
    // Sort to show top products first
    return filtered.sort((a, b) => {
      const aIsTop = this.topProducts().some(p => p.id === a.id);
      const bIsTop = this.topProducts().some(p => p.id === b.id);
      if (aIsTop && !bIsTop) return -1;
      if (!aIsTop && bIsTop) return 1;
      return 0;
    });
  });

  // Get top 5 products (most popular or frequently ordered)
  topProducts = computed(() => {
    const allProducts = this.products().filter(p => p.inStock);
    // For now, just take the first 5 products, but this could be enhanced
    // to show most frequently ordered products based on order history
    return allProducts.slice(0, 5);
  });

  ngOnInit() {
    // Load demo data if no products exist
    if (this.products().length === 0) {
      this.productService.loadDemoData();
    }
  }

  selectCategory(category: string) {
    this.selectedCategory.set(category);
  }

  addToCart(product: Product) {
    this.orderService.addToCart(product, 1);
  }

  updateQuantity(productId: string, change: number) {
    const currentItem = this.cartItems().find((item: CartItem) => item.product.id === productId);
    if (currentItem) {
      const newQuantity = currentItem.quantity + change;
      if (newQuantity <= 0) {
        this.orderService.removeFromCart(productId);
      } else {
        this.orderService.updateCartItemQuantity(productId, newQuantity);
      }
    }
  }

  getCartQuantity(productId: string): number {
    const item = this.cartItems().find((item: CartItem) => item.product.id === productId);
    return item ? item.quantity : 0;
  }

  isTopProduct(productId: string): boolean {
    return this.topProducts().some(p => p.id === productId);
  }

  clearCart() {
    this.orderService.clearCart();
  }

  proceedToCheckout() {
    if (this.cartItems().length === 0) return;
    this.router.navigate(['/quick-checkout']);
  }

  goToManagement() {
    this.router.navigate(['/management']);
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }
} 