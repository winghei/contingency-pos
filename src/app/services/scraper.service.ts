import { Injectable, signal, computed, inject } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HttpClient } from '@angular/common/http';
import { 
  ScraperConfig, 
  ScrapingRequest, 
  ScrapingResponse, 
  ScraperState, 
  ScrapingTemplate,
  ScrapingHistory,
  ProductExtraction,
  ScraperError,
  ScraperErrorDetails,
  defaultScraperConfig,
  defaultScrapingTemplates,
  GeminiRequest,
  GeminiResponse
} from '../types/scraper.types';
import { Product, ProductForm } from '../types/product.types';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class ScraperService {
  private http = inject(HttpClient);

  // State management with signals
  private _config = signal<ScraperConfig>(defaultScraperConfig);
  private _state = signal<ScraperState>({
    isScraping: false,
    progress: 0,
    currentUrl: null,
    error: null,
    lastResult: null,
  });
  private _templates = signal<ScrapingTemplate[]>(defaultScrapingTemplates);
  private _history = signal<ScrapingHistory[]>([]);
  private _geminiModel: GoogleGenerativeAI | null = null;

  // Readonly signals for external access
  config = this._config.asReadonly();
  state = this._state.asReadonly();
  templates = this._templates.asReadonly();
  history = this._history.asReadonly();

  // Computed values
  isConfigured = computed(() => !!this._config().apiKey);
  canScrape = computed(() => this.isConfigured() && !this._state().isScraping);
  lastScrapingResult = computed(() => this._state().lastResult);

  constructor() {
    this.loadConfig();
    this.loadHistory();
    this.loadTemplates();
  }

  /**
   * Initialize the Gemini API client
   */
  private initializeGemini(): void {
    const config = this._config();
    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    try {
      this._geminiModel = new GoogleGenerativeAI(config.apiKey);
    } catch (error) {
      console.error('Failed to initialize Gemini API:', error);
      throw new Error('Failed to initialize Gemini API');
    }
  }

  /**
   * Update scraper configuration
   */
  updateConfig(config: Partial<ScraperConfig>): void {
    const currentConfig = this._config();
    const newConfig = { ...currentConfig, ...config };
    this._config.set(newConfig);
    this.saveConfig();
    
    // Reinitialize Gemini if API key changed
    if (config.apiKey && config.apiKey !== currentConfig.apiKey) {
      try {
        this.initializeGemini();
      } catch (error) {
        console.error('Failed to reinitialize Gemini:', error);
      }
    }
  }

  /**
   * Scrape a web page using Gemini API
   */
  async scrapePage(request: ScrapingRequest): Promise<ScrapingResponse> {
    const startTime = Date.now();
    
    try {
      // Validate request
      if (!request.url) {
        throw new Error('URL is required');
      }

      // Update state
      this._state.update(state => ({
        ...state,
        isScraping: true,
        progress: 0,
        currentUrl: request.url,
        error: null,
      }));

      // Initialize Gemini if not already done
      if (!this._geminiModel) {
        this.initializeGemini();
      }

      // Fetch page content
      this._state.update(state => ({ ...state, progress: 25 }));
      const pageContent = await this.fetchPageContent(request.url, request.timeout);

      // Prepare prompt for Gemini
      this._state.update(state => ({ ...state, progress: 50 }));
      const prompt = this.buildScrapingPrompt(request, pageContent);

      // Call Gemini API
      this._state.update(state => ({ ...state, progress: 75 }));
      const geminiResponse = await this.callGeminiAPI(prompt);

      // Parse response
      this._state.update(state => ({ ...state, progress: 90 }));
      const parsedData = this.parseGeminiResponse(geminiResponse);

      // Create response
      const processingTime = Date.now() - startTime;
      const response: ScrapingResponse = {
        success: true,
        data: parsedData,
        rawContent: pageContent,
        metadata: {
          url: request.url,
          timestamp: new Date().toISOString(),
          processingTime,
          modelUsed: this._config().model,
        },
      };

      // Update state
      this._state.update(state => ({
        ...state,
        isScraping: false,
        progress: 100,
        lastResult: response,
      }));

      // Save to history
      this.addToHistory(request.url, true, Object.keys(parsedData).length, processingTime);

      return response;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = this.handleScrapingError(error);
      
      const response: ScrapingResponse = {
        success: false,
        error: errorMessage,
        metadata: {
          url: request.url,
          timestamp: new Date().toISOString(),
          processingTime,
          modelUsed: this._config().model,
        },
      };

      this._state.update(state => ({
        ...state,
        isScraping: false,
        progress: 0,
        error: errorMessage,
        lastResult: response,
      }));

      this.addToHistory(request.url, false, 0, processingTime);
      throw new Error(errorMessage);
    }
  }

  /**
   * Extract product information from a web page
   */
  async extractProduct(url: string): Promise<ProductForm> {
    const request: ScrapingRequest = {
      url,
      instructions: 'Extract product information including name, price, description, image, and category. Return the data in JSON format with the following structure: { "name": "string", "price": number, "description": "string", "image": "string", "category": "string" }',
      timeout: 15000,
    };

    const response = await this.scrapePage(request);
    
    if (!response.success || !response.data) {
      throw new Error('Failed to extract product information');
    }

    // Convert extracted data to ProductForm
    const extractedData = response.data as ProductExtraction;
    
    return {
      name: extractedData.name || 'Unknown Product',
      price: extractedData.price || 0,
      description: extractedData.description || '',
      image: extractedData.image || '',
      category: extractedData.category || '',
      inStock: extractedData.inStock ?? true,
    };
  }

  /**
   * Fetch page content using a proxy or direct fetch
   */
  private async fetchPageContent(url: string, timeout: number): Promise<string> {
    try {
      // Try to fetch using a CORS proxy first
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      
      const response = await Promise.race([
        this.http.get(proxyUrl).toPromise(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        ),
      ]) as any;

      if (response?.contents) {
        return response.contents;
      }

      throw new Error('Failed to fetch page content');

    } catch (error) {
      console.error('Error fetching page content:', error);
      throw new Error(`Failed to fetch page content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build the prompt for Gemini API
   */
  private buildScrapingPrompt(request: ScrapingRequest, pageContent: string): string {
    let prompt = `You are a web scraping assistant. Extract structured data from the following HTML content.\n\n`;
    
    if (request.instructions) {
      prompt += `Instructions: ${request.instructions}\n\n`;
    }

    if (request.extractData && Object.keys(request.extractData).length > 0) {
      prompt += `Extract the following fields:\n`;
      Object.entries(request.extractData).forEach(([key, selector]) => {
        prompt += `- ${key}: ${selector}\n`;
      });
      prompt += `\n`;
    }

    prompt += `HTML Content:\n${pageContent.substring(0, 8000)}\n\n`;
    prompt += `Please return the extracted data in valid JSON format. If you cannot extract certain fields, use null for those values.`;

    return prompt;
  }

  /**
   * Call the Gemini API
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    if (!this._geminiModel) {
      throw new Error('Gemini API not initialized');
    }

    try {
      const model = this._geminiModel.getGenerativeModel({ 
        model: this._config().model,
        generationConfig: {
          temperature: this._config().temperature,
          topP: this._config().topP,
          topK: this._config().topK,
          maxOutputTokens: this._config().maxTokens,
        },
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();

    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse Gemini API response
   */
  private parseGeminiResponse(response: string): Record<string, unknown> {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // If no JSON found, return the raw response
      return { content: response };

    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return { content: response, parseError: 'Failed to parse JSON response' };
    }
  }

  /**
   * Handle scraping errors
   */
  private handleScrapingError(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return 'Invalid or missing API key';
      }
      if (error.message.includes('timeout')) {
        return 'Request timed out';
      }
      if (error.message.includes('network')) {
        return 'Network error occurred';
      }
      return error.message;
    }
    return 'An unknown error occurred';
  }

  /**
   * Add scraping result to history
   */
  private addToHistory(url: string, success: boolean, dataSize: number, processingTime: number): void {
    const historyItem: ScrapingHistory = {
      id: uuidv4(),
      url,
      timestamp: new Date().toISOString(),
      success,
      dataSize,
      processingTime,
    };

    this._history.update(history => [historyItem, ...history.slice(0, 49)]); // Keep last 50 items
    this.saveHistory();
  }

  /**
   * Save templates
   */
  saveTemplate(template: ScrapingTemplate): void {
    this._templates.update(templates => {
      const existingIndex = templates.findIndex(t => t.id === template.id);
      if (existingIndex >= 0) {
        const updated = [...templates];
        updated[existingIndex] = template;
        return updated;
      }
      return [...templates, template];
    });
    this.saveTemplates();
  }

  /**
   * Delete template
   */
  deleteTemplate(templateId: string): void {
    this._templates.update(templates => 
      templates.filter(t => t.id !== templateId)
    );
    this.saveTemplates();
  }

  /**
   * Clear scraping history
   */
  clearHistory(): void {
    this._history.set([]);
    this.saveHistory();
  }

  /**
   * Reset scraper state
   */
  resetState(): void {
    this._state.set({
      isScraping: false,
      progress: 0,
      currentUrl: null,
      error: null,
      lastResult: null,
    });
  }

  // Local storage methods
  private saveConfig(): void {
    try {
      localStorage.setItem('scraper-config', JSON.stringify(this._config()));
    } catch (error) {
      console.error('Failed to save scraper config:', error);
    }
  }

  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('scraper-config');
      if (saved) {
        const config = JSON.parse(saved);
        this._config.set(config);
      }
    } catch (error) {
      console.error('Failed to load scraper config:', error);
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem('scraper-history', JSON.stringify(this._history()));
    } catch (error) {
      console.error('Failed to save scraper history:', error);
    }
  }

  private loadHistory(): void {
    try {
      const saved = localStorage.getItem('scraper-history');
      if (saved) {
        const history = JSON.parse(saved);
        this._history.set(history);
      }
    } catch (error) {
      console.error('Failed to load scraper history:', error);
    }
  }

  private saveTemplates(): void {
    try {
      localStorage.setItem('scraper-templates', JSON.stringify(this._templates()));
    } catch (error) {
      console.error('Failed to save scraper templates:', error);
    }
  }

  private loadTemplates(): void {
    try {
      const saved = localStorage.getItem('scraper-templates');
      if (saved) {
        const templates = JSON.parse(saved);
        this._templates.set(templates);
      }
    } catch (error) {
      console.error('Failed to load scraper templates:', error);
    }
  }
} 