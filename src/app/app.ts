import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';
import { AuthService } from './services/auth.service';
import { PwaInstallComponent } from './components/pwa-install/pwa-install.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PwaInstallComponent],
  template: `
    <router-outlet />
    <app-pwa-install />
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      width: 100vw;
    }
  `],
})
export class App implements OnInit{
  protected title = 'contingency-pos';
  
  // Inject services to ensure they're initialized at app startup
  // This will trigger localStorage loading for all saved data
  private productService = inject(ProductService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    // Initialize services - AuthService automatically loads from localStorage
    this.productService.loadProductsFromStorage();
    this.orderService.loadFromStorage();
  }


}
