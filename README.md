# ContingencyPos

A modern Point of Sale (POS) system built with Angular 20, featuring product management, order processing, checkout functionality, and AI-powered web scraping capabilities.

## 🚀 Features

### Core POS Functionality
- **Product Management**: Add, edit, and manage products with images, categories, and inventory tracking
- **Quick Order Interface**: Streamlined ordering system for fast transactions
- **Order Processing**: Complete order lifecycle from draft to completion
- **Checkout System**: Multiple payment methods (cash, card, digital wallet, gift cards)
- **Customer Management**: Customer profiles with loyalty points and contact information
- **Tax & Discount Support**: Configurable tax rates and discount calculations

### Advanced Features
- **AI-Powered Web Scraper**: Extract product information from e-commerce websites using Google's Gemini AI
- **Real-time Inventory**: Track stock levels and availability
- **Order History**: Complete order tracking and management
- **Responsive Design**: Works on desktop and mobile devices
- **Type-Safe**: Built with TypeScript and Zod validation

## 🛠️ Technology Stack

- **Frontend**: Angular 20 with standalone components
- **State Management**: Angular Signals for reactive state
- **UI Framework**: Angular Material + Bootstrap 5
- **Validation**: Zod schema validation
- **AI Integration**: Google Generative AI (Gemini)
- **Styling**: SCSS with modern CSS features

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd contingency-pos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   ng serve
   ```

4. **Open your browser**
   Navigate to `http://localhost:4200/`

## 🎯 Usage

### Getting Started
1. **Product Setup**: Start by adding products in the Management section
2. **Quick Orders**: Use the Quick Order interface for fast transactions
3. **Checkout**: Process payments through the checkout system
4. **Order Management**: Track and manage orders in the Orders section

### Web Scraper
1. **Configure API Key**: Set up your Google Gemini API key
2. **Select Template**: Choose from predefined scraping templates
3. **Enter URL**: Provide the website URL to scrape
4. **Extract Data**: Use AI to extract product information
5. **Import Products**: Add scraped products to your inventory

## 📁 Project Structure

```
src/app/
├── components/
│   ├── orders/              # Order management interface
│   ├── payment/             # Payment processing
│   ├── product-form/        # Product creation/editing
│   ├── product-list/        # Product display
│   ├── product-management/  # Main product management
│   ├── quick-checkout/      # Fast checkout process
│   ├── quick-order/         # Quick order interface
│   └── scraper/            # AI web scraper
├── services/
│   ├── order.service.ts     # Order business logic
│   ├── product.service.ts   # Product management
│   └── scraper.service.ts  # Web scraping service
└── types/
    ├── order.types.ts       # Order-related types
    ├── product.types.ts     # Product-related types
    └── scraper.types.ts    # Scraper-related types
```

## 🔧 Configuration

### Environment Setup
- **Angular 20**: Latest Angular features with standalone components
- **TypeScript**: Strict mode enabled for type safety
- **Zod Validation**: Runtime type checking and validation
- **Angular Material**: Modern UI components
- **Bootstrap 5**: Responsive design framework

### AI Scraper Configuration
The web scraper uses Google's Gemini AI. You'll need to:
1. Obtain a Google AI API key
2. Configure the scraper settings in the application
3. Set up scraping templates for different website types

## 🚀 Development

### Available Scripts
```bash
# Development server
npm start
ng serve

# Build for production
npm run build
ng build

# Watch mode for development
npm run watch
ng build --watch --configuration development

# Generate new components
ng generate component component-name
```

### Code Quality
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Angular Style Guide**: Follows Angular best practices

## 🏗️ Architecture

### Modern Angular Patterns
- **Standalone Components**: No NgModules required
- **Signal-based State**: Reactive state management
- **OnPush Change Detection**: Performance optimization
- **Lazy Loading**: Route-based code splitting
- **Type-safe Forms**: Zod validation integration

### State Management
- **Angular Signals**: Primary state management
- **RxJS**: For async operations and HTTP requests
- **Service-based**: Centralized business logic

## 🔒 Security Features

- **Input Validation**: Zod schema validation
- **Type Safety**: TypeScript strict mode
- **XSS Protection**: Angular's built-in sanitization
- **Secure API**: Proper error handling and validation

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices
- Touch-screen POS terminals

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the code examples
- Open an issue on GitHub

## 🔄 Version History

- **v0.0.0**: Initial release with core POS functionality
- Angular 20 with modern patterns
- AI-powered web scraper
- Complete order management system

---

Built with ❤️ using Angular 20 and modern web technologies.
