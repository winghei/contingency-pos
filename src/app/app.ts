import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
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

  ngOnInit(): void {
    this.productService.loadProductsFromStorage();
    this.orderService.loadFromStorage();
  }


}
