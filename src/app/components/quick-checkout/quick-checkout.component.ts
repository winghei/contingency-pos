import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-quick-checkout',
  templateUrl: './quick-checkout.component.html',
  styleUrls: ['./quick-checkout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatToolbarModule,
    MatDividerModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule
  ]
})
export class QuickCheckoutComponent {
  private orderService = inject(OrderService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  cartItems = this.orderService.cartItems;
  cartTotal = this.orderService.cartTotal;
  cartItemCount = this.orderService.cartItemCount;
  
  receivedAmount = signal<number>(0);
  isProcessing = signal<boolean>(false);
  orderSummaryExpanded = signal<boolean>(false);
  
  // Quick amount buttons (common cash amounts)
  quickAmounts = [5, 10, 20, 50, 100];
  
  // Computed change amount
  changeAmount = computed(() => {
    const received = this.receivedAmount();
    const total = this.cartTotal();
    return received >= total ? received - total : 0;
  });
  
  // Check if payment is sufficient
  isPaymentSufficient = computed(() => this.receivedAmount() >= this.cartTotal());
  
  // Check if exact change
  isExactChange = computed(() => this.receivedAmount() === this.cartTotal());

  ngOnInit() {
    // Redirect if cart is empty
    if (this.cartItems().length === 0) {
      this.router.navigate(['/quick-order']);
    }
  }

  setQuickAmount(amount: number) {
    this.receivedAmount.set(amount);
  }

  addAmount(amount: number) {
    this.receivedAmount.update(current => current + amount);
  }

  setExactAmount() {
    this.receivedAmount.set(this.cartTotal());
  }

  clearAmount() {
    this.receivedAmount.set(0);
  }

  onAmountChange(value: string) {
    const amount = parseFloat(value) || 0;
    this.receivedAmount.set(amount);
  }

  async processPayment() {
    if (!this.isPaymentSufficient()) {
      this.snackBar.open('Insufficient payment amount', 'Close', { duration: 3000 });
      return;
    }

    this.isProcessing.set(true);

    try {
      // Set payment method and amount in order service
      this.orderService.setPaymentMethod('cash');
      this.orderService.setReceivedAmount(this.receivedAmount());
      
      // Process the payment
      const result = await this.orderService.processPayment();
      
      if (result.success) {
        // Show success message with change information
        const change = this.changeAmount();
        let message = 'Payment successful!';
        if (change > 0) {
          message += ` Change: €${change.toFixed(2)}`;
        }
        
        this.snackBar.open(message, 'Close', { 
          duration: 5000,
          panelClass: 'success-snackbar'
        });
        
        // Navigate back to quick order immediately
        this.router.navigate(['/quick-order']);
      } else {
        this.snackBar.open(result.error || 'Payment failed. Please try again.', 'Close', { duration: 3000 });
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      this.snackBar.open('Payment processing error. Please try again.', 'Close', { duration: 3000 });
    } finally {
      this.isProcessing.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/quick-order']);
  }

  clearOrder() {
    if (confirm('Are you sure you want to clear the entire order? This action cannot be undone.')) {
      this.orderService.clearCart();
      this.snackBar.open('Order cleared successfully', 'Close', { duration: 3000 });
      this.router.navigate(['/quick-order']);
    }
  }

  toggleOrderSummary() {
    this.orderSummaryExpanded.update(expanded => !expanded);
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }
} 