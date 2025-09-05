import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { Order, OrderStatus } from '../types/order.types';

@Injectable({ providedIn: 'root' })
export class PdfExportService {
  
  exportOrdersToPdf(orders: Order[], filename?: string): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Helper function to add text
    const addText = (text: string, x: number, y: number, fontSize: number = 9, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.text(text, x, y);
      return y + (fontSize * 0.35);
    };

    // Helper function to add a line
    const addLine = (y: number) => {
      doc.line(margin, y, pageWidth - margin, y);
      return y + 3;
    };

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Header
    yPosition = addText('Orders Report', margin, yPosition, 16, true);
    yPosition = addText(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, yPosition + 3, 8);
    yPosition = addText(`Total Orders: ${orders.length}`, margin, yPosition + 2, 8);
    
    // Calculate summary statistics
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    yPosition = addText(`Total Revenue: €${totalRevenue.toFixed(2)} | Avg Order: €${averageOrderValue.toFixed(2)}`, margin, yPosition + 2, 8);
    
    yPosition = addLine(yPosition + 5);

    // Table format with maximized width utilization
    const availableWidth = pageWidth - (margin * 2);
    const colWidths = [25, 30, 50, 25, 18, 15, 25]; // Maximized widths: Order#, Customer, Items, Total, Status, Check-in, Date
    const totalColumnWidth = colWidths.reduce((sum, width) => sum + width, 0);
    
    // Scale columns to fit available width if needed
    const scaleFactor = availableWidth / totalColumnWidth;
    const scaledWidths = colWidths.map(width => width * scaleFactor);
    
    const colPositions = [margin];
    for (let i = 1; i < scaledWidths.length; i++) {
      colPositions[i] = colPositions[i - 1] + scaledWidths[i - 1];
    }

    // Header row
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const headers = ['Order #', 'Customer', 'Items', 'Total', 'Status', 'Check In', 'Date'];
    headers.forEach((header, index) => {
      doc.text(header, colPositions[index], yPosition);
    });
    yPosition = addLine(yPosition + 3);

    // Orders data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);

    orders.forEach((order) => {
      checkNewPage(12); // Reserve space for one row with potential multi-line content

      // Order Number (with text wrapping)
      const orderNumberLines = doc.splitTextToSize(order.orderNumber, scaledWidths[0] - 2);
      doc.text(orderNumberLines, colPositions[0], yPosition);

      // Customer (matching UI format)
      let customerText = '';
      if (order.customer) {
        customerText = order.customer.name;
        if (order.customer.email) {
          customerText += `\n${order.customer.email}`;
        }
      } else {
        customerText = 'Walk-in customer';
      }
      const customerLines = doc.splitTextToSize(customerText, scaledWidths[1] - 2);
      doc.text(customerLines, colPositions[1], yPosition);

      // Items (matching UI format with summary and preview)
      const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
      const uniqueItems = order.items.length;
      let itemsText = `${itemCount} items (${uniqueItems} products)\n`;
      
      // Add first 2 items preview
      order.items.slice(0, 2).forEach(item => {
        itemsText += `${item.product.name} (${item.quantity})\n`;
      });
      
      if (order.items.length > 2) {
        itemsText += `+${order.items.length - 2} more`;
      }
      
      const itemsLines = doc.splitTextToSize(itemsText, scaledWidths[2] - 2);
      doc.text(itemsLines, colPositions[2], yPosition);

      // Total (matching UI format with tax and payment info)
      let totalText = `€${order.total.toFixed(2)}`;
      if (order.tax > 0) {
        totalText += `\n+€${order.tax.toFixed(2)} tax`;
      }
      if (order.amountReceived && order.amountReceived > 0) {
        totalText += `\nReceived: €${order.amountReceived.toFixed(2)}`;
        if (order.changeAmount && order.changeAmount > 0) {
          totalText += `\nChange: €${order.changeAmount.toFixed(2)}`;
        }
      }
      
      const totalLines = doc.splitTextToSize(totalText, scaledWidths[3] - 2);
      doc.text(totalLines, colPositions[3], yPosition);

      // Status (matching UI format)
      const statusText = order.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      doc.text(statusText, colPositions[4], yPosition);

      // Check In (matching UI format)
      const checkInText = order.check_in ? 'Yes' : 'No';
      doc.text(checkInText, colPositions[5], yPosition);

      // Date (matching UI format)
      const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) : 'N/A';
      const dateLines = doc.splitTextToSize(orderDate, scaledWidths[6] - 2);
      doc.text(dateLines, colPositions[6], yPosition);

      // Move to next row (calculate max height needed for this row)
      const maxLines = Math.max(
        orderNumberLines.length,
        customerLines.length,
        itemsLines.length,
        totalLines.length,
        dateLines.length,
        1
      );
      yPosition += (maxLines * 3) + 2; // 3 units per line + spacing
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 25, pageHeight - 8);
      doc.text('Contingency POS', margin, pageHeight - 8);
    }

    // Save the PDF
    const defaultFilename = `orders-list-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename || defaultFilename);
  }

  exportOrderSummaryToPdf(orders: Order[], filename?: string): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;

    // Helper function to add text
    const addText = (text: string, x: number, y: number, fontSize: number = 10, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.text(text, x, y);
      return y + (fontSize * 0.4);
    };

    // Header
    yPosition = addText('Orders Summary Report', margin, yPosition, 20, true);
    yPosition = addText(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition + 10, 12);
    yPosition = addText(`Total Orders: ${orders.length}`, margin, yPosition + 5, 12);

    // Calculate statistics
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const statusCounts = orders.reduce((counts, order) => {
      counts[order.status] = (counts[order.status] || 0) + 1;
      return counts;
    }, {} as Record<OrderStatus, number>);

    const paymentMethods = orders.reduce((methods, order) => {
      order.payments.forEach(payment => {
        methods[payment.method] = (methods[payment.method] || 0) + 1;
      });
      return methods;
    }, {} as Record<string, number>);

    // Summary statistics
    yPosition += 20;
    yPosition = addText('Summary Statistics', margin, yPosition, 16, true);
    yPosition = addText(`Total Revenue: €${totalRevenue.toFixed(2)}`, margin, yPosition + 10, 12);
    yPosition = addText(`Average Order Value: €${averageOrderValue.toFixed(2)}`, margin, yPosition + 5, 12);

    // Status breakdown
    yPosition += 10;
    yPosition = addText('Order Status Breakdown', margin, yPosition, 14, true);
    Object.entries(statusCounts).forEach(([status, count]) => {
      const statusText = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      yPosition = addText(`${statusText}: ${count} orders`, margin, yPosition + 5, 10);
    });

    // Payment methods
    if (Object.keys(paymentMethods).length > 0) {
      yPosition += 10;
      yPosition = addText('Payment Methods', margin, yPosition, 14, true);
      Object.entries(paymentMethods).forEach(([method, count]) => {
        const methodText = method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        yPosition = addText(`${methodText}: ${count} payments`, margin, yPosition + 5, 10);
      });
    }

    // Top products
    const productCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const productName = item.product.name;
        if (!productCounts[productName]) {
          productCounts[productName] = { name: productName, quantity: 0, revenue: 0 };
        }
        productCounts[productName].quantity += item.quantity;
        productCounts[productName].revenue += item.totalPrice;
      });
    });

    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    if (topProducts.length > 0) {
      yPosition += 10;
      yPosition = addText('Top 5 Products', margin, yPosition, 14, true);
      topProducts.forEach((product, index) => {
        yPosition = addText(`${index + 1}. ${product.name} - ${product.quantity} sold (€${product.revenue.toFixed(2)})`, margin, yPosition + 5, 10);
      });
    }

    // Save the PDF
    const defaultFilename = `orders-summary-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename || defaultFilename);
  }
}
