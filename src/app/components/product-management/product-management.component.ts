import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
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
import { AuthService } from "../../services/auth.service";
import { ExportImportService, SavedExport } from "../../services/export-import.service";
import { ProductListComponent } from "../product-list/product-list.component";
import {
  ProductFormComponent,
  ProductFormDialogData,
} from "../product-form/product-form.component";
import { ExportMethodDialogComponent } from "../dialogs/export-method-dialog.component";
import { ImportMethodDialogComponent } from "../dialogs/import-method-dialog.component";
import { ExportNameDialogComponent } from "../dialogs/export-name-dialog.component";
import { ExportSelectionDialogComponent } from "../dialogs/export-selection-dialog.component";
import { ExportManagementDialogComponent } from "../dialogs/export-management-dialog.component";
import { UserSelectionDialogComponent } from "../dialogs/user-selection-dialog.component";

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
  private authService = inject(AuthService);
  private exportImportService = inject(ExportImportService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  // Computed signal to check if current user is sherwin
  protected isSherwinUser = computed(() => {
    const currentUser = this.authService.getCurrentUsername();
    return currentUser === 'sherwin';
  });

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

  async exportData(): Promise<void> {
    try {
      const products = this.productService.products();
      if (products.length === 0) {
        this.snackBar.open("No products to export", "Close", {
          duration: 3000,
          horizontalPosition: "center",
          verticalPosition: "bottom",
        });
        return;
      }

      // Ask user for export method
      const exportMethod = await this.showExportMethodDialog();
      if (!exportMethod) return;

      if (exportMethod === 'local') {
        // Export to local file
        const exportName = await this.getExportName();
        const filename = exportName ? `${exportName}.json` : `pos-products-${new Date().toISOString().split('T')[0]}.json`;
        this.exportImportService.exportToLocalFile(products, filename);
        
        this.snackBar.open("Products exported to local file!", "Close", {
          duration: 3000,
          horizontalPosition: "center",
          verticalPosition: "bottom",
        });
      } else if (exportMethod === 'server') {
        // Export to server
        const exportName = await this.getExportName();
        const username = this.authService.getCurrentUsername();
        
        if (!username) {
          this.snackBar.open("Please log in to save exports to server", "Close", {
            duration: 3000,
            horizontalPosition: "center",
            verticalPosition: "bottom",
          });
          return;
        }

        const response = await this.exportImportService.saveExportToServer({
          username,
          products,
          exportName: exportName || 'Product Export'
        });

        this.snackBar.open(`Export saved to server: ${response.export.name}`, "Close", {
          duration: 3000,
          horizontalPosition: "center",
          verticalPosition: "bottom",
        });
      }
    } catch (error) {
      this.snackBar.open("Failed to export products: " + (error as Error).message, "Close", {
        duration: 5000,
        horizontalPosition: "center",
        verticalPosition: "bottom",
      });
    }
  }

  async importData(): Promise<void> {
    try {
      // Ask user for import method
      const importMethod = await this.showImportMethodDialog();
      if (!importMethod) return;

      if (importMethod === 'local') {
        // Import from local file
        const products = await this.exportImportService.importFromLocalFile();
        await this.importProducts(products);
      } else if (importMethod === 'server') {
        // Import from server
        const username = this.authService.getCurrentUsername();
        
        if (!username) {
          this.snackBar.open("Please log in to load exports from server", "Close", {
            duration: 3000,
            horizontalPosition: "center",
            verticalPosition: "bottom",
          });
          return;
        }

        const savedExports = await this.exportImportService.getSavedExports(username);
        if (savedExports.length === 0) {
          this.snackBar.open("No saved exports found on server", "Close", {
            duration: 3000,
            horizontalPosition: "center",
            verticalPosition: "bottom",
          });
          return;
        }

        const selectedExport = await this.showExportSelectionDialog(savedExports);
        if (!selectedExport) return;

        const exportData = await this.exportImportService.loadExportFromServer(username, selectedExport.filename!);
        await this.importProducts(exportData.products);
      }
    } catch (error) {
      this.snackBar.open("Failed to import products: " + (error as Error).message, "Close", {
        duration: 5000,
        horizontalPosition: "center",
        verticalPosition: "bottom",
      });
    }
  }

  async manageSavedExports(): Promise<void> {
    try {
      const currentUser = this.authService.getCurrentUsername();
      
      if (!currentUser) {
        this.snackBar.open("Please log in to manage saved exports", "Close", {
          duration: 3000,
          horizontalPosition: "center",
          verticalPosition: "bottom",
        });
        return;
      }

      // First, show user selection dialog
      const userSelectionDialog = this.dialog.open(UserSelectionDialogComponent, {
        width: '500px',
        maxWidth: '95vw',
        maxHeight: '80vh',
        data: { 
          currentUser: currentUser,
          title: 'Select User to View Exports'
        }
      });

      userSelectionDialog.afterClosed().subscribe(async (result) => {
        if (result && result.selectedUser) {
          const selectedUser = result.selectedUser;
          
          try {
            const savedExports = await this.exportImportService.getSavedExports(selectedUser);
            
            const exportManagementDialog = this.dialog.open(ExportManagementDialogComponent, {
              width: '600px',
              maxWidth: '95vw',
              maxHeight: '80vh',
              data: { 
                exports: savedExports,
                username: selectedUser,
                currentUser: currentUser
              }
            });

            exportManagementDialog.afterClosed().subscribe(async (importResult) => {
              if (importResult && importResult.action === 'import' && importResult.export) {
                // Import the selected export
                try {
                  const exportData = await this.exportImportService.loadExportFromServer(selectedUser, importResult.export.filename!);
                  await this.importProducts(exportData.products);
                } catch (error) {
                  this.snackBar.open("Failed to import export: " + (error as Error).message, "Close", {
                    duration: 5000,
                    horizontalPosition: "center",
                    verticalPosition: "bottom",
                  });
                }
              }
            });
          } catch (error) {
            this.snackBar.open("Failed to load exports for user: " + (error as Error).message, "Close", {
              duration: 5000,
              horizontalPosition: "center",
              verticalPosition: "bottom",
            });
          }
        }
      });
    } catch (error) {
      this.snackBar.open("Failed to load saved exports: " + (error as Error).message, "Close", {
        duration: 5000,
        horizontalPosition: "center",
        verticalPosition: "bottom",
      });
    }
  }



  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.snackBar.open('Logged out successfully', 'Close', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  // Helper methods for export/import dialogs
  private async showExportMethodDialog(): Promise<string | null> {
    return new Promise((resolve) => {
      const dialog = this.dialog.open(ExportMethodDialogComponent, {
        width: '400px',
        maxWidth: '95vw',
        data: { title: 'Export Products' }
      });

      dialog.afterClosed().subscribe(result => {
        resolve(result);
      });
    });
  }

  private async showImportMethodDialog(): Promise<string | null> {
    return new Promise((resolve) => {
      const dialog = this.dialog.open(ImportMethodDialogComponent, {
        width: '400px',
        maxWidth: '95vw',
        data: { title: 'Import Products' }
      });

      dialog.afterClosed().subscribe(result => {
        resolve(result);
      });
    });
  }

  private async getExportName(): Promise<string | null> {
    return new Promise((resolve) => {
      const dialog = this.dialog.open(ExportNameDialogComponent, {
        width: '400px',
        maxWidth: '95vw',
        data: { title: 'Export Name' }
      });

      dialog.afterClosed().subscribe(result => {
        resolve(result);
      });
    });
  }

  private async showExportSelectionDialog(exports: SavedExport[]): Promise<SavedExport | null> {
    return new Promise((resolve) => {
      const dialog = this.dialog.open(ExportSelectionDialogComponent, {
        width: '600px',
        maxWidth: '95vw',
        maxHeight: '80vh',
        data: { exports }
      });

      dialog.afterClosed().subscribe(result => {
        resolve(result);
      });
    });
  }

  private async importProducts(products: any[]): Promise<void> {
    if (!Array.isArray(products)) {
      throw new Error('Invalid products data');
    }

    let importedCount = 0;
    let failedCount = 0;
    const failedProducts: string[] = [];

    console.log(`Starting import of ${products.length} products`);

    for (const [index, product] of products.entries()) {
      try {
        // Log the product being imported for debugging
        console.log(`Importing product ${index + 1}/${products.length}:`, {
          name: product?.name || 'Unknown',
          id: product?.id || 'No ID',
          hasPrice: typeof product?.price === 'number',
          hasName: typeof product?.name === 'string' && product.name.trim().length > 0
        });

        const result = await this.productService.addProduct(product);
        if (result) {
          importedCount++;
        } else {
          failedCount++;
          failedProducts.push(product?.name || `Product ${index + 1}`);
        }
      } catch (error) {
        failedCount++;
        const productName = product?.name || `Product ${index + 1}`;
        failedProducts.push(productName);
        console.warn(`Failed to import product ${index + 1}:`, {
          product: product,
          error: error
        });
      }
    }

    // Show detailed feedback
    let message = `Import completed: ${importedCount} products imported successfully`;
    if (failedCount > 0) {
      message += `, ${failedCount} products failed to import`;
      if (failedProducts.length <= 5) {
        message += ` (${failedProducts.join(', ')})`;
      } else {
        message += ` (${failedProducts.slice(0, 5).join(', ')} and ${failedProducts.length - 5} more)`;
      }
    }

    this.snackBar.open(message, "Close", {
      duration: failedCount > 0 ? 8000 : 3000,
      horizontalPosition: "center",
      verticalPosition: "bottom",
    });

    // Log summary for debugging
    console.log('Import summary:', {
      total: products.length,
      imported: importedCount,
      failed: failedCount,
      failedProducts: failedProducts
    });
  }
}
