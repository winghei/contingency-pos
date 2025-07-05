# Web Scraper with Gemini AI

This Angular POS application includes a powerful web scraper that utilizes Google's Gemini AI to extract structured data from web pages. The scraper is designed to work with the existing product management system, allowing you to easily import products from e-commerce websites.

## Features

- **AI-Powered Scraping**: Uses Google's Gemini API to intelligently extract data from web pages
- **Product Integration**: Directly import scraped product data into your POS inventory
- **Configurable Templates**: Pre-built templates for different types of content
- **Real-time Progress**: Visual progress tracking during scraping operations
- **History Management**: Track and review past scraping operations
- **Error Handling**: Comprehensive error handling and user feedback
- **Responsive Design**: Works on desktop and mobile devices

## Setup

### 1. Get a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key for use in the application

### 2. Configure the Scraper

1. Navigate to the **Scraper** section in the application
2. Go to the **Configuration** tab
3. Enter your Gemini API key
4. Adjust model settings if needed:
   - **Model**: Choose between Gemini 1.5 Flash, 1.5 Pro, or Pro
   - **Max Tokens**: Maximum response length (1-8192)
   - **Temperature**: Controls randomness (0-2)
   - **Top P**: Controls diversity (0-1)
5. Click **Save Configuration**

## Usage

### Basic Scraping

1. Go to the **Scraping** tab
2. Enter the URL you want to scrape
3. (Optional) Add specific instructions for data extraction
4. Click **Start Scraping**
5. Monitor the progress bar
6. Review results in the **Results** tab

### Product Extraction

1. Navigate to a product page URL
2. Click **Extract Product** for automatic product detection
3. Review the extracted product data
4. Click **Add as Product** to import into your inventory

### Using Templates

The scraper includes pre-built templates for common use cases:

- **Product Page Scraper**: Extracts product information from e-commerce pages
- **Content Scraper**: Extracts general content, titles, and images
- **Data Table Scraper**: Extracts tabular data from web pages

## API Configuration

### Supported Models

- `gemini-1.5-flash`: Fastest, good for most scraping tasks
- `gemini-1.5-pro`: More capable, better for complex extractions
- `gemini-pro`: Legacy model, still effective

### Model Parameters

- **Temperature** (0-2): Higher values make responses more creative
- **Top P** (0-1): Controls response diversity
- **Max Tokens** (1-8192): Maximum response length
- **Timeout** (1000-30000ms): Request timeout in milliseconds

## Examples

### Product Page Scraping

```javascript
// Example: Scraping an Amazon product page
URL: https://www.amazon.com/product-page
Instructions: "Extract product name, price, description, and image URL"
```

### Content Extraction

```javascript
// Example: Extracting article content
URL: https://example.com/article
Instructions: "Extract the main article content, title, and author"
```

### Custom Data Extraction

```javascript
// Example: Extracting specific data fields
URL: https://example.com/data-page
Instructions: "Extract all prices, product names, and availability status"
```

## Error Handling

The scraper handles various error scenarios:

- **Invalid API Key**: Check your Gemini API key configuration
- **Network Errors**: Verify internet connection and URL accessibility
- **Timeout Errors**: Increase timeout value for slow-loading pages
- **Parse Errors**: Check if the page content is accessible

## Best Practices

### For Product Scraping

1. **Use Product-Specific URLs**: Target individual product pages rather than category pages
2. **Clear Instructions**: Provide specific instructions for data extraction
3. **Verify Results**: Always review extracted data before importing
4. **Respect Rate Limits**: Don't overwhelm target websites with rapid requests

### For Content Scraping

1. **Respect Robots.txt**: Check website's scraping policies
2. **Use Appropriate Timeouts**: Set reasonable timeouts for different sites
3. **Handle Dynamic Content**: Some sites may require JavaScript rendering
4. **Validate Data**: Always verify extracted data quality

## Troubleshooting

### Common Issues

1. **"API Key Required" Error**
   - Ensure you've entered a valid Gemini API key
   - Check that the API key has proper permissions

2. **"Failed to Fetch Page Content" Error**
   - Verify the URL is accessible
   - Check if the site blocks automated requests
   - Try increasing the timeout value

3. **"Gemini API Error"**
   - Check your internet connection
   - Verify API key is valid and has sufficient quota
   - Try using a different model

4. **Poor Data Quality**
   - Provide more specific instructions
   - Try a different model (e.g., switch to Gemini Pro)
   - Adjust temperature and top-p parameters

### Performance Tips

1. **Use Gemini 1.5 Flash** for faster responses
2. **Set appropriate timeouts** based on site speed
3. **Batch similar requests** when possible
4. **Cache results** to avoid re-scraping

## Security Considerations

- **API Key Security**: Never share your Gemini API key
- **Rate Limiting**: Respect API usage limits
- **Data Privacy**: Be mindful of what data you extract
- **Terms of Service**: Respect website terms of service

## Integration with POS System

The scraper is fully integrated with the POS system:

- **Direct Import**: Scraped products can be added directly to inventory
- **Data Validation**: Automatic validation of product data
- **Category Management**: Extracted categories are preserved
- **Image Handling**: Product images are automatically imported

## Advanced Features

### Custom Templates

You can create custom scraping templates for specific websites:

1. Go to the **Configuration** tab
2. Define selectors and instructions
3. Save as a reusable template
4. Use templates for consistent data extraction

### History Management

- View past scraping operations
- Track success/failure rates
- Monitor processing times
- Clear history as needed

### Data Export

- Export scraped data as JSON
- Import data into other systems
- Backup scraping configurations

## Support

For issues or questions:

1. Check the error messages in the Results tab
2. Verify your API key and configuration
3. Test with simple URLs first
4. Review the troubleshooting section above

## Technical Details

### Architecture

- **Frontend**: Angular 20+ with Material Design
- **AI Service**: Google Gemini API
- **State Management**: Angular Signals
- **HTTP Client**: Angular HttpClient with CORS proxy

### Dependencies

- `@google/generative-ai`: Gemini API client
- `@angular/material`: UI components
- `uuid`: Unique ID generation
- `zod`: Data validation

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

This scraper functionality is part of the Contingency POS system and follows the same licensing terms. 