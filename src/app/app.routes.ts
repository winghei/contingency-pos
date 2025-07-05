import { inject } from "@angular/core";
import { Router, Routes } from "@angular/router";
import { ProductService } from "./services/product.service";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "/quick-order",
    pathMatch: "full",
  },
  {
    path: "management",
    loadComponent: () =>
      import(
        "./components/product-management/product-management.component"
      ).then((m) => m.ProductManagementComponent),
  },
  {
    path: "orders",
    loadComponent: () =>
      import("./components/orders/orders.component").then(
        (m) => m.OrdersComponent
      ),
  },
  {
    path: "quick-order",
    canActivate: [() => {
      const productService = inject(ProductService);
      const router = inject(Router);
      
      if (productService.productCount() > 0) {
        return true;
      } else {
        router.navigate(['/management']);
        return false;
      }
    }],
    loadComponent: () =>
      import("./components/quick-order/quick-order.component").then(
        (m) => m.QuickOrderComponent
      ),
  },
  {
    path: "quick-checkout",
    loadComponent: () =>
      import("./components/quick-checkout/quick-checkout.component").then(
        (m) => m.QuickCheckoutComponent
      ),
  },
  {
    path: "scraper",
    loadComponent: () =>
      import("./components/scraper/scraper.component").then(
        (m) => m.ScraperComponent
      ),
  },
  // Legacy redirect for existing bookmarks
  {
    path: "products",
    redirectTo: "/management",
    pathMatch: "full",
  },
  {
    path: "**",
    redirectTo: "/management",
  },
];
