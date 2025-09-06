import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { Router } from '@angular/router';

import { OrderService } from '../../services/order.service';
import { PaymentMethod } from '../../types/order.types';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatChipsModule,
    MatGridListModule,
  ],
})
export class PaymentComponent {
  private orderService = inject(OrderService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Form
  paymentForm: FormGroup;

  // Service signals
  cartTotal = this.orderService.cartTotal;
  cartSubtotal = this.orderService.cartSubtotal;
  cartTax = this.orderService.cartTax;
  paymentMethod = this.orderService.paymentMethod;
  receivedAmount = this.orderService.receivedAmount;
  changeAmount = this.orderService.changeAmount;
  isProcessing = this.orderService.isPaymentProcessing;
  currentCustomer = this.orderService.currentCustomer;

  // Payment method options
  paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'cash', label: 'Cash', icon: 'payments' },
    { value: 'card', label: 'Credit/Debit Card', icon: 'credit_card' },
    { value: 'digital_wallet', label: 'Digital Wallet', icon: 'account_balance_wallet' },
    { value: 'gift_card', label: 'Gift Card', icon: 'card_giftcard' },
    { value: 'store_credit', label: 'Store Credit', icon: 'store' },
  ];

  // Quick amount buttons for cash payments
  quickAmounts = computed(() => {
    const total = this.cartTotal();
    const roundedTotal = Math.ceil(total);
    return [
      roundedTotal,
      roundedTotal + 5,
      roundedTotal + 10,
      roundedTotal + 20,
    ];
  });

  // Form validation
  isFormValid = computed(() => {
    return this.paymentMethod() !== null && 
           this.receivedAmount() >= this.cartTotal();
  });

  // Payment status
  paymentStatus = signal<'idle' | 'processing' | 'success' | 'error'>('idle');
  errorMessage = signal<string | null>(null);

  constructor() {
    this.paymentForm = this.fb.group({
      paymentMethod: ['', Validators.required],
      receivedAmount: [0, [Validators.required, Validators.min(0)]],
      cardNumber: [''],
      expiryDate: [''],
      cvv: [''],
      cardholderName: [''],
      giftCardNumber: [''],
      giftCardPin: [''],
    });

    // Watch for payment method changes
    this.paymentForm.get('paymentMethod')?.valueChanges.subscribe(method => {
      if (method) {
        this.orderService.setPaymentMethod(method);
        this.updateFormValidators(method);
      }
    });

    // Watch for received amount changes
    this.paymentForm.get('receivedAmount')?.valueChanges.subscribe(amount => {
      if (amount >= 0) {
        this.orderService.setReceivedAmount(amount);
      }
    });
  }

  // Payment method selection
  selectPaymentMethod(method: PaymentMethod): void {
    this.paymentForm.patchValue({ paymentMethod: method });
    this.orderService.setPaymentMethod(method);
    this.updateFormValidators(method);
  }

  // Quick amount selection for cash
  selectQuickAmount(amount: number): void {
    this.paymentForm.patchValue({ receivedAmount: amount });
    this.orderService.setReceivedAmount(amount);
  }

  // Update form validators based on payment method
  private updateFormValidators(method: PaymentMethod): void {
    const cardNumber = this.paymentForm.get('cardNumber');
    const expiryDate = this.paymentForm.get('expiryDate');
    const cvv = this.paymentForm.get('cvv');
    const cardholderName = this.paymentForm.get('cardholderName');
    const giftCardNumber = this.paymentForm.get('giftCardNumber');
    const giftCardPin = this.paymentForm.get('giftCardPin');
    const receivedAmount = this.paymentForm.get('receivedAmount');

    // Clear all validators first
    [cardNumber, expiryDate, cvv, cardholderName, giftCardNumber, giftCardPin].forEach(control => {
      control?.clearValidators();
      control?.updateValueAndValidity();
    });

    // Set validators based on payment method
    switch (method) {
      case 'card':
        cardNumber?.setValidators([Validators.required, Validators.pattern(/^\d{16}$/)]);
        expiryDate?.setValidators([Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]);
        cvv?.setValidators([Validators.required, Validators.pattern(/^\d{3,4}$/)]);
        cardholderName?.setValidators([Validators.required]);
        receivedAmount?.setValidators([Validators.required, Validators.min(this.cartTotal())]);
        break;

      case 'gift_card':
        giftCardNumber?.setValidators([Validators.required]);
        giftCardPin?.setValidators([Validators.required]);
        receivedAmount?.setValidators([Validators.required, Validators.min(this.cartTotal())]);
        break;

      case 'cash':
        receivedAmount?.setValidators([Validators.required, Validators.min(this.cartTotal())]);
        break;

      default:
        receivedAmount?.setValidators([Validators.required, Validators.min(this.cartTotal())]);
        break;
    }

    // Update validity
    [cardNumber, expiryDate, cvv, cardholderName, giftCardNumber, giftCardPin, receivedAmount].forEach(control => {
      control?.updateValueAndValidity();
    });
  }

  // Process payment
  async processPayment(): Promise<void> {
    if (!this.isFormValid()) {
      this.snackBar.open('Please complete all required fields', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
      return;
    }

    this.paymentStatus.set('processing');
    this.errorMessage.set(null);

    try {
      const result = await this.orderService.processPayment();
      
      if (result.success) {
        this.paymentStatus.set('success');
        this.snackBar.open('Payment processed successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
        
        // Navigate back to quick order after successful payment
        setTimeout(() => {
          this.router.navigate(['/quick-order']);
        }, 1500);
      } else {
        this.paymentStatus.set('error');
        this.errorMessage.set(result.error || 'Payment processing failed');
        this.snackBar.open(result.error || 'Payment processing failed', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      }
    } catch (error: any) {
      this.paymentStatus.set('error');
      this.errorMessage.set(error.message || 'An unexpected error occurred');
      this.snackBar.open(error.message || 'An unexpected error occurred', 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    }
  }

  // Navigation
  backToCart(): void {
    this.orderService.proceedToStep('cart');
  }

  backToCustomer(): void {
    this.orderService.proceedToStep('customer');
  }

  // Utility methods
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }

  getPaymentMethodIcon(method: PaymentMethod): string {
    return this.paymentMethods.find(pm => pm.value === method)?.icon || 'payment';
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
    return this.paymentMethods.find(pm => pm.value === method)?.label || method;
  }

  // Validation helpers
  isCardPayment(): boolean {
    return this.paymentMethod() === 'card';
  }

  isGiftCardPayment(): boolean {
    return this.paymentMethod() === 'gift_card';
  }

  isCashPayment(): boolean {
    return this.paymentMethod() === 'cash';
  }

  showChangeAmount(): boolean {
    return this.isCashPayment() && this.receivedAmount() > this.cartTotal();
  }

  // Form field helpers
  getFieldError(fieldName: string): string | null {
    const field = this.paymentForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['pattern']) return `Invalid ${fieldName} format`;
      if (field.errors['min']) return `Amount must be at least ${this.formatPrice(this.cartTotal())}`;
    }
    return null;
  }

  hasFieldError(fieldName: string): boolean {
    return this.getFieldError(fieldName) !== null;
  }
} 