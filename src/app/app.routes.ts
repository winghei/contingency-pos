import { Routes } from "@angular/router";
import { authGuard } from "./guards/auth.guard";

export const routes: Routes = [
  {
    path: "login",
    loadComponent: () =>
      import("./components/login/login.component").then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: "",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./components/quick-order/quick-order.component").then(
        (m) => m.QuickOrderComponent
      ),
  },
  {
    path: "quick-order",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./components/quick-order/quick-order.component").then(
        (m) => m.QuickOrderComponent
      ),
  },
  {
    path: "management",
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        "./components/product-management/product-management.component"
      ).then((m) => m.ProductManagementComponent),
  },
  {
    path: "orders",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./components/orders/orders.component").then(
        (m) => m.OrdersComponent
      ),
  },
  {
    path: "quick-checkout",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./components/quick-checkout/quick-checkout.component").then(
        (m) => m.QuickCheckoutComponent
      ),
  },
  {
    path: "scraper",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./components/scraper/scraper.component").then(
        (m) => m.ScraperComponent
      ),
  },
  {
    path: "files",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./components/file-manager/file-manager.component").then(
        (m) => m.FileManagerComponent
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
    redirectTo: "/login",
  },
];
