import { Component, ChangeDetectionStrategy, input, output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ScraperService } from '../../services/scraper.service';
import { ProductService } from '../../services/product.service';
import { 
  ScraperConfig, 
  ScrapingRequest, 
  ScrapingResponse, 
  ScrapingTemplate,
  ProductExtraction 
} from '../../types/scraper.types';
import { ProductForm } from '../../types/product.types';

@Component({
  selector: 'app-scraper',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
    MatTabsModule,
    MatIconModule,
    MatExpansionModule,
    MatChipsModule,
  ],
  templateUrl: './scraper.component.html',
  styleUrls: ['./scraper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScraperComponent {
  private fb = inject(FormBuilder);
  private scraperService = inject(ScraperService);
  private productService = inject(ProductService);
  private snackBar = inject(MatSnackBar);

  // Signals from service
  config = this.scraperService.config;
  state = this.scraperService.state;
  templates = this.scraperService.templates;
  history = this.scraperService.history;
  isConfigured = this.scraperService.isConfigured;
  canScrape = this.scraperService.canScrape;
  lastResult = this.scraperService.lastScrapingResult;

  // Local signals
  savingConfig = signal(false);
  isScraping = computed(() => this.state().isScraping);
  progress = computed(() => this.state().progress);
  currentUrl = computed(() => this.state().currentUrl);
  error = computed(() => this.state().error);

  // Forms
  configForm: FormGroup;
  scrapingForm: FormGroup;

  constructor() {
    this.configForm = this.fb.group({
      apiKey: ['', [Validators.required]],
      model: ['gemini-1.5-flash'],
      maxTokens: [4096, [Validators.min(1), Validators.max(8192)]],
      temperature: [0.7, [Validators.min(0), Validators.max(2)]],
      topP: [0.8, [Validators.min(0), Validators.max(1)]],
      topK: [40, [Validators.min(1), Validators.max(40)]],
    });

    this.scrapingForm = this.fb.group({
      url: ['', [Validators.required, Validators.pattern('https?://.+')]],
      instructions: [''],
      templateId: [''],
      timeout: [10000, [Validators.min(1000), Validators.max(30000)]],
    });

    // Load current config into form
    this.configForm.patchValue(this.config(), { emitEvent: false });
  }

  async saveConfig(): Promise<void> {
    if (this.configForm.invalid) return;

    this.savingConfig.set(true);
    
    try {
      const config: ScraperConfig = this.configForm.value;
      this.scraperService.updateConfig(config);
      
      this.snackBar.open('Configuration saved successfully', 'Close', {
        duration: 3000,
      });
    } catch (error) {
      this.snackBar.open('Failed to save configuration', 'Close', {
        duration: 3000,
      });
    } finally {
      this.savingConfig.set(false);
    }
  }

  async startScraping(): Promise<void> {
    if (this.scrapingForm.invalid) return;

    const formValue = this.scrapingForm.value;
    const request: ScrapingRequest = {
      url: formValue.url,
      instructions: formValue.instructions,
      timeout: formValue.timeout,
    };

    try {
      await this.scraperService.scrapePage(request);
      
      this.snackBar.open('Scraping completed successfully', 'Close', {
        duration: 3000,
      });
    } catch (error) {
      this.snackBar.open(`Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'Close', {
        duration: 5000,
      });
    }
  }

  async extractProduct(): Promise<void> {
    if (this.scrapingForm.invalid) return;

    const url = this.scrapingForm.get('url')?.value;
    if (!url) return;

    try {
      const productForm = await this.scraperService.extractProduct(url);
      this.productService.addProduct(productForm);
      
      this.snackBar.open('Product extracted and added successfully', 'Close', {
        duration: 3000,
      });
    } catch (error) {
      this.snackBar.open(`Product extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'Close', {
        duration: 5000,
      });
    }
  }

  addProductFromScrapedData(data: Record<string, unknown>): void {
    try {
      const productForm: ProductForm = {
        name: (data['name'] as string) || 'Unknown Product',
        price: (data['price'] as number) || 0,
        description: (data['description'] as string) || '',
        image: (data['image'] as string) || '',
        category: (data['category'] as string) || '',
        inStock: (data['inStock'] as boolean) ?? true,
      };

      this.productService.addProduct(productForm);
      
      this.snackBar.open('Product added successfully', 'Close', {
        duration: 3000,
      });
    } catch (error) {
      this.snackBar.open('Failed to add product', 'Close', {
        duration: 3000,
      });
    }
  }

  clearHistory(): void {
    this.scraperService.clearHistory();
    this.snackBar.open('History cleared', 'Close', {
      duration: 2000,
    });
  }

  formatJson(data: unknown): string {
    return JSON.stringify(data, null, 2);
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  isProductData(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;
    
    const obj = data as Record<string, unknown>;
    return 'name' in obj || 'price' in obj || 'description' in obj;
  }
} 