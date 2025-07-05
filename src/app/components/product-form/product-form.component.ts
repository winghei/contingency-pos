import { Component, ChangeDetectionStrategy, inject, input, output, effect, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';

import { ProductService } from '../../services/product.service';
import { Product, ProductForm, defaultProduct } from '../../types/product.types';

export interface ProductFormDialogData {
  product?: Product;
  mode: 'add' | 'edit';
}

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSelectModule,
    MatAutocompleteModule,
  ]
})
export class ProductFormComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ProductFormComponent>);
  private data = inject(MAT_DIALOG_DATA) as ProductFormDialogData;
  protected productService = inject(ProductService);

  // Signals
  private imageUrl = signal<string>('');
  protected imagePreview = signal<string>('');

  // Form
  productForm: FormGroup;

  // Get existing categories from products
  private existingCategories = computed(() => {
    const categories = new Set<string>();
    
    // Add default categories
    const defaultCategories = [
      'Beverages',
      'Bread & Pastries',
      'Cakes & Desserts',
      'Coffee & Tea',
      'Dairy & Eggs',
      'Fresh Produce',
      'Frozen Foods',
      'Grains & Cereals',
      'Meat & Poultry',
      'Nuts & Seeds',
      'Oils & Condiments',
      'Pizza & Italian',
      'Sandwiches & Wraps',
      'Snacks & Chips',
      'Soups & Salads',
      'Spices & Seasonings',
      'Sweets & Candy',
      'Vegetables & Fruits'
    ];
    
    defaultCategories.forEach(category => categories.add(category));
    
    // Add categories from existing products
    this.productService.products().forEach(product => {
      if (product.category && product.category.trim()) {
        categories.add(product.category.trim());
      }
    });
    
    return Array.from(categories).sort();
  });

  // Filter categories based on input
  protected filteredCategories = computed(() => {
    const inputValue = this.productForm.get('category')?.value || '';
    if (!inputValue) {
      return this.existingCategories();
    }
    return this.existingCategories().filter(category =>
      category.toLowerCase().includes(inputValue.toLowerCase())
    );
  });

  constructor() {
    // Initialize form
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      image: [''],
      description: ['', [Validators.maxLength(500)]],
      category: [''],
      inStock: [true]
    });

    // Load existing product data if editing
    if (this.data?.product) {
      this.loadProductData(this.data.product);
    }

    // Watch for image URL changes to update preview
    effect(() => {
      const imageUrl = this.productForm.get('image')?.value;
      if (imageUrl && imageUrl.trim() && this.isValidUrl(imageUrl)) {
        this.imagePreview.set(imageUrl);
      } else {
        this.imagePreview.set('');
      }
    });

    // Watch for form changes
    this.productForm.get('image')?.valueChanges.subscribe(value => {
      this.imageUrl.set(value || '');
    });

    // Watch for category input changes to update filtered categories
    this.productForm.get('category')?.valueChanges.subscribe(value => {
      // Trigger recomputation of filtered categories
      this.filteredCategories();
    });
  }

  protected isEditMode(): boolean {
    return this.data?.mode === 'edit';
  }

  private loadProductData(product: Product): void {
    this.productForm.patchValue({
      name: product.name,
      price: product.price,
      image: product.image || '',
      description: product.description || '',
      category: product.category || '',
      inStock: product.inStock
    });
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  async onSubmit(): Promise<void> {
   
    if (this.productForm.valid) {
      const formValue = this.productForm.value as ProductForm;
      
      // Clear previous errors
      this.productService.clearError();
    
      let result: Product | null = null;

      if (this.isEditMode() && this.data.product?.id) {
        // Update existing product
        result = await this.productService.updateProduct(this.data.product.id, formValue);
      } else {
        // Add new product
        result = await this.productService.addProduct(formValue);
      }

      if (result) {
        // Close dialog with success result
        this.dialogRef.close(result);
      }
      // Error handling is done through the service's error signal
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 