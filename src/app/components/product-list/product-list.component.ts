import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { ProductService } from '../../services/product.service';
import { Product } from '../../types/product.types';
import { ProductFormComponent, ProductFormDialogData } from '../product-form/product-form.component';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule
  ]
})
export class ProductListComponent {
  protected productService = inject(ProductService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  openAddProductDialog(): void {
    const dialogRef = this.dialog.open(ProductFormComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: { mode: 'add' } as ProductFormDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Product added successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  editProduct(product: Product): void {
    const dialogRef = this.dialog.open(ProductFormComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: { product, mode: 'edit' } as ProductFormDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Product updated successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  duplicateProduct(product: Product): void {
    const duplicateData = {
      name: `${product.name} (Copy)`,
      price: product.price,
      image: product.image,
      description: product.description,
      category: product.category,
      inStock: product.inStock,
    };

    const dialogRef = this.dialog.open(ProductFormComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: { product: duplicateData, mode: 'add' } as ProductFormDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Product duplicated successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  async toggleStock(product: Product): Promise<void> {
    if (product.id) {
      const updatedProduct = { ...product, inStock: !product.inStock };
      const result = await this.productService.updateProduct(product.id, updatedProduct);
      
      if (result) {
        const status = result.inStock ? 'in stock' : 'out of stock';
        this.snackBar.open(`${result.name} marked as ${status}`, 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
    }
  }

  async deleteProduct(product: Product): Promise<void> {
    if (product.id && confirm(`Are you sure you want to delete "${product.name}"?`)) {
      const success = await this.productService.deleteProduct(product.id);
      
      if (success) {
        this.snackBar.open('Product deleted successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
    }
  }

  onImageError(event: any): void {
    // Hide broken image and show placeholder
    event.target.style.display = 'none';
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
} 