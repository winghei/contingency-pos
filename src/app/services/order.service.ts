import { Injectable, signal, computed, inject } from "@angular/core";
import { v4 as uuidv4 } from "uuid";
import {
  CartItem,
  CartState,
  PaymentState,
  CheckoutState,
  Customer,
  Order,
  Payment,
  PaymentMethod,
  TaxConfig,
  defaultCartState,
  defaultPaymentState,
  defaultTaxConfig,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  calculateChange,
  validateCartItem,
  validatePayment,
  OrderSchema,
  PaymentSchema,
} from "../types/order.types";
import { Product } from "../types/product.types";
import { ProductService } from "./product.service";

@Injectable({
  providedIn: "root",
})
export class OrderService {
  private productService = inject(ProductService);

  // Private signals for state management
  private _cartState = signal<CartState>(defaultCartState);
  private _paymentState = signal<PaymentState>(defaultPaymentState);
  private _currentStep = signal<"cart" | "customer" | "payment" | "complete">(
    "cart"
  );
  private _taxConfig = signal<TaxConfig>(defaultTaxConfig);
  private _orders = signal<Order[]>([]);
  private _customers = signal<Customer[]>([]);

  // Public readonly signals
  cartState = this._cartState.asReadonly();
  paymentState = this._paymentState.asReadonly();
  currentStep = this._currentStep.asReadonly();
  taxConfig = this._taxConfig.asReadonly();
  orders = this._orders.asReadonly();
  customers = this._customers.asReadonly();

  // Computed signals for cart totals
  cartItems = computed(() => this._cartState().items);
  cartItemCount = computed(() =>
    this._cartState().items.reduce((count, item) => count + item.quantity, 0)
  );
  cartSubtotal = computed(() => this._cartState().subtotal);
  cartTax = computed(() => this._cartState().tax);
  cartTotal = computed(() => this._cartState().total);
  currentCustomer = computed(() => this._cartState().customer);

  // Computed signals for payment
  paymentMethod = computed(() => this._paymentState().method);
  receivedAmount = computed(() => this._paymentState().receivedAmount);
  changeAmount = computed(() => this._paymentState().changeAmount);
  isPaymentProcessing = computed(() => this._paymentState().processing);

  // Computed checkout state
  checkoutState = computed(
    (): CheckoutState => ({
      cart: this._cartState(),
      payment: this._paymentState(),
      currentStep: this._currentStep(),
    })
  );

  // Computed validation
  isCartValid = computed(() => this._cartState().items.length > 0);
  isPaymentValid = computed(() => {
    const payment = this._paymentState();
    return (
      payment.method !== null &&
      payment.receivedAmount >= this._cartState().total
    );
  });

  constructor() {
    this.loadFromStorage();
  }

  // Cart Management
  addToCart(product: Product, quantity: number = 1): void {
    const currentState = this._cartState();
    const existingItemIndex = currentState.items.findIndex(
      (item) => item.productId === product.id
    );

    let updatedItems: CartItem[];

    if (existingItemIndex >= 0) {
      // Update existing item
      updatedItems = currentState.items.map((item, index) =>
        index === existingItemIndex
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      // Add new item
      const newItem: CartItem = {
        productId: product.id,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
          inStock: product.inStock,
        },
        quantity,
      };

      const validation = validateCartItem(newItem);
      if (!validation.success) {
        this.setCartError(validation.errors.join(", "));
        return;
      }

      updatedItems = [...currentState.items, newItem];
    }

    this.updateCartTotals(updatedItems);
  }

  updateCartItemQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const currentState = this._cartState();
    const updatedItems = currentState.items.map((item) =>
      item.productId === productId ? { ...item, quantity } : item
    );

    this.updateCartTotals(updatedItems);
  }

  removeFromCart(productId: string): void {
    const currentState = this._cartState();
    const updatedItems = currentState.items.filter(
      (item) => item.productId !== productId
    );
    this.updateCartTotals(updatedItems);
  }

  clearCart(): void {
    this._cartState.set({
      ...defaultCartState,
      customer: this._cartState().customer, // Keep customer if selected
    });
    this.resetPayment();
    this._currentStep.set("cart");
  }

  private updateCartTotals(items: CartItem[]): void {
    const subtotal = calculateSubtotal(items);
    const tax = calculateTax(subtotal, this._taxConfig().rate);
    const total = calculateTotal(subtotal, tax, 0); // No discount for now

    this._cartState.update((state) => ({
      ...state,
      items,
      subtotal,
      tax,
      total,
      error: null,
    }));

    this.saveToStorage();
  }

  // Customer Management
  setCustomer(customer: Customer | null): void {
    this._cartState.update((state) => ({
      ...state,
      customer,
    }));
    this.saveToStorage();
  }

  addCustomer(customer: Customer): void {
    const customerWithId = {
      ...customer,
      id: customer.id || uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this._customers.update((customers) => [...customers, customerWithId]);
    this.saveCustomersToStorage();
  }

  // Payment Management
  setPaymentMethod(method: PaymentMethod): void {
    this._paymentState.update((state) => ({
      ...state,
      method,
      error: null,
    }));
  }

  setReceivedAmount(amount: number): void {
    const total = this._cartState().total;
    const change = calculateChange(total, amount);

    this._paymentState.update((state) => ({
      ...state,
      receivedAmount: amount,
      changeAmount: change,
      error: null,
    }));
  }

  resetPayment(): void {
    this._paymentState.set(defaultPaymentState);
  }

  // Checkout Process
  proceedToStep(step: "cart" | "customer" | "payment" | "complete"): void {
    this._currentStep.set(step);
  }

  async processPayment(): Promise<{
    success: boolean;
    orderId?: string;
    error?: string;
  }> {
    const cartState = this._cartState();
    const paymentState = this._paymentState();

    if (!this.isCartValid() || !this.isPaymentValid()) {
      return { success: false, error: "Invalid cart or payment information" };
    }

    this._paymentState.update((state) => ({
      ...state,
      processing: true,
      error: null,
    }));

    try {
      // Create order
      const order = await this.createOrder(cartState, paymentState);

      // Save order
      this._orders.update((orders) => [...orders, order]);
      this.saveOrdersToStorage();

      // Clear cart and reset states
      this.clearCart();
      this._currentStep.set("complete");

      return { success: true, orderId: order.id };
    } catch (error: any) {
      this._paymentState.update((state) => ({
        ...state,
        processing: false,
        error: error.message || "Payment processing failed",
      }));
      return {
        success: false,
        error: error.message || "Payment processing failed",
      };
    }
  }

  private async createOrder(
    cartState: CartState,
    paymentState: PaymentState
  ): Promise<Order> {
    const orderId = uuidv4();
    const orderNumber = `ORD-${Date.now()}`;

    const payment: Payment = {
      id: uuidv4(),
      method: paymentState.method!,
      amount: cartState.total,
      receivedAmount: paymentState.receivedAmount,
      changeAmount: paymentState.changeAmount,
      status: "completed",
      processedAt: new Date(),
    };

    const order: Order = {
      id: orderId,
      orderNumber,
      customer: cartState.customer || undefined,
      items: cartState.items.map((item) => ({
        id: uuidv4(),
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.product.price,
        totalPrice: item.product.price * item.quantity,
        notes: item.notes,
      })),
      subtotal: cartState.subtotal,
      tax: cartState.tax,
      discount: cartState.discount,
      total: cartState.total,
      amountReceived: paymentState.receivedAmount,
      changeAmount: paymentState.changeAmount,
      payments: [payment],
      status: "completed",
      check_in: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: new Date(),
    };

    // Validate order
    const validation = OrderSchema.safeParse(order);
    if (!validation.success) {
      throw new Error("Invalid order data");
    }

    return order;
  }

  // Tax Configuration
  updateTaxConfig(config: Partial<TaxConfig>): void {
    this._taxConfig.update((current) => ({ ...current, ...config }));

    // Recalculate cart totals with new tax rate
    if (this._cartState().items.length > 0) {
      this.updateCartTotals(this._cartState().items);
    }
  }

  // Error Handling
  private setCartError(error: string): void {
    this._cartState.update((state) => ({ ...state, error }));
  }

  clearErrors(): void {
    this._cartState.update((state) => ({ ...state, error: null }));
    this._paymentState.update((state) => ({ ...state, error: null }));
  }

  // Data Persistence
  private saveToStorage(): void {
    try {
      const cartData = {
        items: this._cartState().items,
        customer: this._cartState().customer,
        currentStep: this._currentStep(),
      };
      localStorage.setItem("pos-cart", JSON.stringify(cartData));
    } catch (error) {
      console.error("Failed to save cart to storage:", error);
    }
  }

  private saveOrdersToStorage(): void {
    try {
      localStorage.setItem("pos-orders", JSON.stringify(this._orders()));
    } catch (error) {
      console.error("Failed to save orders to storage:", error);
    }
  }

  private saveCustomersToStorage(): void {
    try {
      localStorage.setItem("pos-customers", JSON.stringify(this._customers()));
    } catch (error) {
      console.error("Failed to save customers to storage:", error);
    }
  }

  loadFromStorage(): void {
    try {
      // Load cart
      const cartData = localStorage.getItem("pos-cart");
      if (cartData) {
        const parsed = JSON.parse(cartData);
        if (parsed.items && Array.isArray(parsed.items)) {
          this.updateCartTotals(parsed.items);
          if (parsed.customer) {
            this.setCustomer(parsed.customer);
          }
          if (parsed.currentStep) {
            this._currentStep.set(parsed.currentStep);
          }
        }
      }

      // Load orders
      const ordersData = localStorage.getItem("pos-orders");
      if (ordersData) {
        const orders = JSON.parse(ordersData);
        if (Array.isArray(orders)) {
          this._orders.set(orders);
        }
      }

      // Load customers
      const customersData = localStorage.getItem("pos-customers");
      if (customersData) {
        const customers = JSON.parse(customersData);
        if (Array.isArray(customers)) {
          this._customers.set(customers);
        }
      }
    } catch (error) {
      console.error("Failed to load data from storage:", error);
    }
  }

  // Demo Data
  loadDemoCustomers(): void {
    const demoCustomers: Customer[] = [
      {
        id: uuidv4(),
        name: "John Doe",
        email: "john@example.com",
        phone: "555-0123",
        address: "123 Main St, City, State 12345",
        loyaltyPoints: 150,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "555-0456",
        address: "456 Oak Ave, City, State 12345",
        loyaltyPoints: 75,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: "Bob Johnson",
        email: "bob@example.com",
        phone: "555-0789",
        loyaltyPoints: 200,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    this._customers.set(demoCustomers);
    this.saveCustomersToStorage();
  }

  // Analytics
  getTotalSales(): number {
    return this._orders().reduce((total, order) => total + order.total, 0);
  }

  getOrdersByDateRange(startDate: Date, endDate: Date): Order[] {
    return this._orders().filter((order) => {
      const orderDate = new Date(order.createdAt!);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }

  getTopCustomers(limit: number = 5): Customer[] {
    return [...this._customers()]
      .sort((a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0))
      .slice(0, limit);
  }

  updateOrderCheckIn(orderId: string, checkIn: boolean): void {
    this._orders.update(orders => 
      orders.map(order => 
        order.id === orderId 
          ? { ...order, check_in: checkIn, updatedAt: new Date() }
          : order
      )
    );
    this.saveOrdersToStorage();
  }
}
