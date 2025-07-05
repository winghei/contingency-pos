import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { Order, OrderStatus } from '../../types/order.types';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    ReactiveFormsModule,
  ],
})
export class OrdersComponent {
  private orderService = inject(OrderService);
  private fb = inject(FormBuilder);

  // Filter form
  filterForm: FormGroup;

  // Filter signals
  private _startDate = signal<Date | null>(null);
  private _endDate = signal<Date | null>(null);
  private _statusFilter = signal<OrderStatus | 'all'>('all');
  private _searchTerm = signal<string>('');
  
  // Mobile expansion state
  private _expandedOrders = signal<Record<string, boolean>>({});

  // Computed filtered orders
  filteredOrders = computed(() => {
    let orders = this.orderService.orders();
    
    // Filter by date range
    if (this._startDate() || this._endDate()) {
      orders = orders.filter(order => {
        const orderDate = new Date(order.createdAt || '');
        const startDate = this._startDate();
        const endDate = this._endDate();
        
        if (startDate && orderDate < startDate) return false;
        if (endDate && orderDate > endDate) return false;
        return true;
      });
    }

    // Filter by status
    if (this._statusFilter() !== 'all') {
      orders = orders.filter(order => order.status === this._statusFilter());
    }

    // Filter by search term
    const searchTerm = this._searchTerm().toLowerCase();
    if (searchTerm) {
      orders = orders.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTerm) ||
        order.customer?.name.toLowerCase().includes(searchTerm) ||
        order.items.some(item => item.product.name.toLowerCase().includes(searchTerm))
      );
    }

    return orders.sort((a, b) => 
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  });

  // Summary statistics
  summaryStats = computed(() => {
    const orders = this.filteredOrders();
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const statusCounts = orders.reduce((counts, order) => {
      counts[order.status] = (counts[order.status] || 0) + 1;
      return counts;
    }, {} as Record<OrderStatus, number>);

    const paymentMethods = orders.reduce((methods, order) => {
      order.payments.forEach(payment => {
        methods[payment.method] = (methods[payment.method] || 0) + 1;
      });
      return methods;
    }, {} as Record<string, number>);

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      statusCounts,
      paymentMethods,
      topProducts: this.getTopProducts(orders),
    };
  });

  // Table columns
  displayedColumns = ['orderNumber', 'customer', 'items', 'total', 'status', 'check_in', 'date', 'actions'];
  
  // Mobile expansion state
  expandedOrders = this._expandedOrders.asReadonly();

  constructor() {
    this.filterForm = this.fb.group({
      startDate: [null],
      endDate: [null],
      status: ['all'],
      search: [''],
    });

    // Watch form changes
    this.filterForm.valueChanges.subscribe(values => {
      this._startDate.set(values.startDate);
      this._endDate.set(values.endDate);
      this._statusFilter.set(values.status);
      this._searchTerm.set(values.search || '');
    });
  }

  private getTopProducts(orders: Order[]) {
    const productCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const productName = item.product.name;
        if (!productCounts[productName]) {
          productCounts[productName] = { name: productName, quantity: 0, revenue: 0 };
        }
        productCounts[productName].quantity += item.quantity;
        productCounts[productName].revenue += item.totalPrice;
      });
    });

    return Object.values(productCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }

  clearFilters(): void {
    this.filterForm.patchValue({
      startDate: null,
      endDate: null,
      status: 'all',
      search: '',
    });
  }

  getStatusColor(status: OrderStatus): string {
    const colors: Record<OrderStatus, string> = {
      draft: 'grey',
      pending_payment: 'orange',
      paid: 'blue',
      preparing: 'purple',
      ready: 'green',
      completed: 'green',
      cancelled: 'red',
      refunded: 'red',
    };
    return colors[status] || 'grey';
  }

  getStatusIcon(status: OrderStatus): string {
    const icons: Record<OrderStatus, string> = {
      draft: 'edit',
      pending_payment: 'payment',
      paid: 'check_circle',
      preparing: 'restaurant',
      ready: 'local_shipping',
      completed: 'done_all',
      cancelled: 'cancel',
      refunded: 'money_off',
    };
    return icons[status] || 'help';
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getOrderItemsSummary(items: any[]): string {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueItems = items.length;
    return `${itemCount} items (${uniqueItems} products)`;
  }

  getPaymentCalculation(order: Order): { received: number; change: number; exact: boolean } {
    const received = order.amountReceived || 0;
    const change = order.changeAmount || 0;
    const exact = received === order.total;
    
    return { received, change, exact };
  }

  viewOrderDetails(order: Order): void {
    // TODO: Implement order details view
    console.log('View order details:', order);
  }

  exportOrders(): void {
    const orders = this.filteredOrders();
    const dataStr = JSON.stringify(orders, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `orders-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }

  toggleOrderExpansion(orderId: string): void {
    this._expandedOrders.update(expanded => ({
      ...expanded,
      [orderId]: !expanded[orderId]
    }));
  }

  toggleCheckIn(orderId: string, currentCheckIn: boolean): void {
    this.orderService.updateOrderCheckIn(orderId, !currentCheckIn);
  }
} 