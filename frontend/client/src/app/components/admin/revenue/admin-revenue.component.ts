import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RevenueService, RevenueSummary, Transaction } from '../../../services/revenue.service';
import { Payment } from '../../../services/payment.service';

@Component({
  selector: 'app-admin-revenue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-revenue.component.html',
  styleUrls: ['./admin-revenue.component.css']
})
export class AdminRevenueComponent implements OnInit {
  revenueSummary: RevenueSummary | null = null;
  payments: Transaction[] = []; // Changed to Transaction type to handle both payments and bookings
  loading = true;
  error: string | null = null;
  expandedSections: {
    dailyRevenue: boolean;
    monthlyRevenue: boolean;
    paymentMethods: boolean;
    topCustomers: boolean;
    revenueByCategory: boolean;
    transactions: boolean;
  } = {
    dailyRevenue: true,
    monthlyRevenue: false,
    paymentMethods: false,
    topCustomers: false,
    revenueByCategory: true,
    transactions: true
  };

  selectedCategory: 'all' | 'booking' | 'menuItems' = 'booking';
  filteredTransactions: Transaction[] = [];

  constructor(private revenueService: RevenueService) {}

  ngOnInit(): void {
    this.loadRevenueData();
  }

  loadRevenueData(): void {
    this.loading = true;
    this.error = null;

    // Load revenue summary
    this.revenueService.getRevenueSummary().subscribe({
      next: (summary) => {
        this.revenueSummary = summary;
        
        // Load transactions (payments and bookings) separately
        this.revenueService.getPayments().subscribe({
          next: (transactions) => {
            console.log('Received transactions from backend:', transactions);
            this.payments = transactions;
            this.selectCategory(this.selectedCategory); // Apply current filter to new data
            this.loading = false;
          },
          error: (err) => {
            this.error = 'Failed to load payment data';
            console.error('Error loading payments:', err);
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.error = 'Failed to load revenue data';
        console.error('Error loading revenue summary:', err);
        this.loading = false;
      }
    });
  }

  selectCategory(category: 'all' | 'booking' | 'menuItems'): void {
    this.selectedCategory = category;
    
    if (category === 'all') {
      this.filteredTransactions = this.payments;
    } else if (category === 'booking') {
      this.filteredTransactions = this.payments.filter(t => t.type === 'booking');
    } else if (category === 'menuItems') {
      this.filteredTransactions = this.payments.filter(t => t.type === 'payment');
    }
    
    // Auto-expand transactions section if it was collapsed
    this.expandedSections.transactions = true;
    
    // Scroll to transactions section if a specific category is selected
    if (category !== 'all') {
      setTimeout(() => {
        const element = document.querySelector('.transactions-details-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return `₹${amount.toFixed(2)}`;
  }

  toggleSection(section: keyof typeof this.expandedSections): void {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  // Method to expand all sections when clicking on Total Revenue
  expandAllSections(): void {
    for (const section in this.expandedSections) {
      this.expandedSections[section as keyof typeof this.expandedSections] = true;
    }
  }

  // Method to expand specific sections based on the card clicked
  expandSectionByCard(cardType: string): void {
    // First expand all sections
    this.expandAllSections();
    
    switch(cardType) {
      case 'orders':
        // Expand sections related to orders
        this.expandedSections.dailyRevenue = true;
        this.expandedSections.monthlyRevenue = true;
        this.expandedSections.topCustomers = true;
        this.expandedSections.transactions = true;
        break;
      case 'bookings':
        // Expand sections related to bookings
        this.expandedSections.revenueByCategory = true;
        this.expandedSections.monthlyRevenue = true;
        this.expandedSections.transactions = true;
        break;
      case 'avgValue':
        // Expand sections that show average value related data
        this.expandedSections.paymentMethods = true;
        this.expandedSections.topCustomers = true;
        this.expandedSections.dailyRevenue = true;
        this.expandedSections.transactions = true;
        break;
      default:
        // If no specific card type matches, expand all
        this.expandAllSections();
    }
  }

  calculateDailyBarWidth(revenue: number): number {
    if (!this.revenueSummary || !this.revenueSummary.dailyRevenue || this.revenueSummary.dailyRevenue.length === 0) return 0;
    const maxRevenue = Math.max(...this.revenueSummary.dailyRevenue.map(d => d.revenue));
    return maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
  }

  calculateMonthlyBarWidth(revenue: number): number {
    if (!this.revenueSummary || !this.revenueSummary.monthlyRevenue || this.revenueSummary.monthlyRevenue.length === 0) return 0;
    const maxRevenue = Math.max(...this.revenueSummary.monthlyRevenue.map(m => m.revenue));
    return maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
  }

  // Bar chart calculation methods for daily revenue
  calculateBarPosition(index: number): number {
    const chartWidth = 730; // Width of chart area (800 - 70 for margins)
    const barCount = this.revenueSummary?.dailyRevenue?.length || 1;
    const barWidth = this.calculateBarWidth();
    const spacing = (chartWidth - (barCount * barWidth)) / (barCount + 1);
    return 50 + spacing + index * (barWidth + spacing); // 50 is left margin
  }

  calculateBarWidth(): number {
    const chartWidth = 730; // Width of chart area (800 - 70 for margins)
    const barCount = this.revenueSummary?.dailyRevenue?.length || 1;
    const spacingFactor = 0.8; // Leave some space between bars
    return (chartWidth / barCount) * spacingFactor;
  }

  calculateBarHeight(revenue: number, dailyRevenue: {date: string, revenue: number}[]): number {
    const chartHeight = 200; // Height of chart area (270 - 70 for margins and labels)
    const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue));
    return maxRevenue > 0 ? (revenue / maxRevenue) * chartHeight : 0;
  }

  calculateBarYPosition(revenue: number, dailyRevenue: {date: string, revenue: number}[]): number {
    const chartHeight = 200; // Height of chart area (270 - 70 for margins and labels)
    const chartBottom = 270; // Y position of bottom of chart
    const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue));
    const barHeight = maxRevenue > 0 ? (revenue / maxRevenue) * chartHeight : 0;
    return chartBottom - barHeight; // Start drawing from bottom
  }

  getBarColor(index: number): string {
    // Use different colors for each bar or cycle through a color palette
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#42e695', '#ff9a9e'];
    return colors[index % colors.length];
  }

  formatShortDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  getMaxRevenueLabel(): string {
    if (!this.revenueSummary || !this.revenueSummary.dailyRevenue || this.revenueSummary.dailyRevenue.length === 0) return '0';
    const maxRevenue = Math.max(...this.revenueSummary.dailyRevenue.map(d => d.revenue));
    return this.formatCurrency(maxRevenue);
  }

  getMidRevenueLabel(): string {
    if (!this.revenueSummary || !this.revenueSummary.dailyRevenue || this.revenueSummary.dailyRevenue.length === 0) return '0';
    const maxRevenue = Math.max(...this.revenueSummary.dailyRevenue.map(d => d.revenue));
    return this.formatCurrency(maxRevenue / 2);
  }

  // Helper method to get transaction type display text
  getTransactionType(transaction: Transaction): string {
    if (transaction.type === 'booking') {
      return 'Booking';
    } else {
      return 'Order';
    }
  }

  // Helper method to get transaction ID for display
  getTransactionId(transaction: Transaction): string {
    if (!transaction) return 'N/A';
    return transaction._id || 'N/A';
  }
}