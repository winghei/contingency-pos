import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatDividerModule } from "@angular/material/divider";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";

import { ProductService } from "../../services/product.service";
import { ProductListComponent } from "../product-list/product-list.component";
import {
  ProductFormComponent,
  ProductFormDialogData,
} from "../product-form/product-form.component";

@Component({
  selector: "app-product-management",
  templateUrl: "./product-management.component.html",
  styleUrls: ["./product-management.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    ProductListComponent,
  ],
})
export class ProductManagementComponent {
  protected productService = inject(ProductService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  openProductForm(): void {
    const dialogRef = this.dialog.open(ProductFormComponent, {
      width: "500px",
      maxWidth: "90vw",
      data: { mode: "add" } as ProductFormDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open("Product added successfully!", "Close", {
          duration: 3000,
          horizontalPosition: "center",
          verticalPosition: "bottom",
        });
      }
    });
  }

  goToQuickOrder(): void {
    this.router.navigate(["/quick-order"]);
  }

  loadDemoData(): void {
    if (confirm("This will add demo products to your inventory. Continue?")) {
      this.productService.loadDemoData();
      this.snackBar.open("Demo data loaded successfully!", "Close", {
        duration: 3000,
        horizontalPosition: "center",
        verticalPosition: "bottom",
      });
    }
  }

  loadDitschProducts(): void {
    if (confirm("This will scrape and load current Ditsch products. Continue?")) {
      this.productService.loadDitschProducts().then(() => {
        this.snackBar.open("Ditsch products loaded successfully!", "Close", {
          duration: 3000,
          horizontalPosition: "center",
          verticalPosition: "bottom",
        });
      }).catch((error) => {
        this.snackBar.open("Failed to load Ditsch products: " + error, "Close", {
          duration: 5000,
          horizontalPosition: "center",
          verticalPosition: "bottom",
        });
      });
    }
  }

  clearData(): void {
    if (
      confirm(
        "Are you sure you want to delete all products? This action cannot be undone."
      )
    ) {
      this.productService.clearAllProducts();
      this.snackBar.open("All products cleared!", "Close", {
        duration: 3000,
        horizontalPosition: "center",
        verticalPosition: "bottom",
      });
    }
  }

  exportData(): void {
    try {
      const products = this.productService.products();
      const dataStr = JSON.stringify(products, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(dataBlob);
      link.download = `pos-products-${
        new Date().toISOString().split("T")[0]
      }.json`;
      link.click();

      this.snackBar.open("Products exported successfully!", "Close", {
        duration: 3000,
        horizontalPosition: "center",
        verticalPosition: "bottom",
      });
    } catch (error) {
      this.snackBar.open("Failed to export products", "Close", {
        duration: 3000,
        horizontalPosition: "center",
        verticalPosition: "bottom",
      });
    }
  }

  importData(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const products = JSON.parse(e.target?.result as string);
            // Validate and import products
            if (Array.isArray(products)) {
              products.forEach((product) => {
                this.productService.addProduct(product);
              });
              this.snackBar.open("Products imported successfully!", "Close", {
                duration: 3000,
                horizontalPosition: "center",
                verticalPosition: "bottom",
              });
            }
          } catch (error) {
            this.snackBar.open("Failed to import products", "Close", {
              duration: 3000,
              horizontalPosition: "center",
              verticalPosition: "bottom",
            });
          }
        };
        reader.readAsText(file);
      }
    };

    input.click();
  }
}
