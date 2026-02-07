import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductCard from '../ProductCard';
import { DesignProvider } from '@/hooks/useDesign';
import { LanguageProvider } from '@/hooks/useLanguage';

// Test wrapper with required providers
const TestWrapper = ({ children }) => (
    <LanguageProvider>
        <DesignProvider>
            {children}
        </DesignProvider>
    </LanguageProvider>
);

// Sample product data for tests
const mockProduct = {
    id: 1,
    name_fr: 'Test Product FR',
    name_nl: 'Test Product NL',
    sku: 'TEST-001',
    price_retail: 29.99,
    stock_qty: 50,
    unit: 'pc',
    image_url: null,
    vendor: 'Test Brand',
    barcode: '1234567890123',
    product_type: 'Test Type',
    variant_title: 'Blue / M',
    size: 'M',
    color: 'Blue',
    material: 'Cotton',
    weight: 0.5,
    weight_unit: 'kg',
    length: 30,
    width: 20,
    height: 10,
};

const renderProductCard = (props = {}) => {
    const defaultProps = {
        product: mockProduct,
        addToCart: jest.fn(),
        gridSize: 'medium',
        ...props,
    };

    return render(
        <TestWrapper>
            <ProductCard {...defaultProps} />
        </TestWrapper>
    );
};

describe('ProductCard component', () => {
    describe('Basic rendering', () => {
        test('renders product card', () => {
            renderProductCard();
            expect(screen.getByTestId('product-1')).toBeInTheDocument();
        });

        test('renders product name', () => {
            renderProductCard();
            expect(screen.getByText(/Test Product/)).toBeInTheDocument();
        });

        test('renders product price', () => {
            renderProductCard();
            expect(screen.getByText('€29.99')).toBeInTheDocument();
        });

        test('renders product SKU', () => {
            renderProductCard();
            expect(screen.getByText('TEST-001')).toBeInTheDocument();
        });

        test('renders unit', () => {
            renderProductCard();
            expect(screen.getByText('/ pc')).toBeInTheDocument();
        });
    });

    describe('Image handling', () => {
        test('renders placeholder when no image', () => {
            renderProductCard({ product: { ...mockProduct, image_url: null } });
            expect(screen.getByText('📦')).toBeInTheDocument();
        });

        test('renders image when URL provided', () => {
            renderProductCard({
                product: { ...mockProduct, image_url: 'http://example.com/image.jpg' }
            });
            const img = screen.getByRole('img');
            expect(img).toHaveAttribute('src', 'http://example.com/image.jpg');
        });

        test('image has correct alt text', () => {
            renderProductCard({
                product: { ...mockProduct, image_url: 'http://example.com/image.jpg' }
            });
            expect(screen.getByAltText('Test Product FR')).toBeInTheDocument();
        });

        test('image has lazy loading', () => {
            renderProductCard({
                product: { ...mockProduct, image_url: 'http://example.com/image.jpg' }
            });
            expect(screen.getByRole('img')).toHaveAttribute('loading', 'lazy');
        });
    });

    describe('Stock display', () => {
        test('does not show stock badge when stock is high', () => {
            renderProductCard({ product: { ...mockProduct, stock_qty: 50 } });
            // Stock badge only shows when stock < 10
            expect(screen.queryByText(/Stock:/)).not.toBeInTheDocument();
        });

        test('shows amber badge when stock is low', () => {
            renderProductCard({ product: { ...mockProduct, stock_qty: 5 } });
            // Medium grid shows "Stock: X" format
            const badge = screen.getByText(/5/);
            expect(badge).toBeInTheDocument();
            expect(badge.className).toContain('bg-amber-500');
        });

        test('shows red badge when out of stock', () => {
            renderProductCard({ product: { ...mockProduct, stock_qty: 0 } });
            // Badge shows "Stock: 0" format in medium grid
            const badge = screen.getByText(/Stock.*0/i);
            expect(badge).toBeInTheDocument();
            expect(badge.className).toContain('bg-red-500');
        });
    });

    describe('Grid sizes', () => {
        test('renders in small grid size', () => {
            renderProductCard({ gridSize: 'small' });
            const card = screen.getByTestId('product-1');
            expect(card.className).toContain('p-1');
        });

        test('renders in medium grid size (default)', () => {
            renderProductCard({ gridSize: 'medium' });
            expect(screen.getByTestId('product-1')).toBeInTheDocument();
        });

        test('renders in large grid size', () => {
            renderProductCard({ gridSize: 'large' });
            expect(screen.getByTestId('product-1')).toBeInTheDocument();
        });

        test('hides SKU in small grid', () => {
            renderProductCard({ gridSize: 'small' });
            expect(screen.queryByText('TEST-001')).not.toBeInTheDocument();
        });

        test('hides unit in small grid', () => {
            renderProductCard({ gridSize: 'small' });
            expect(screen.queryByText('/ pc')).not.toBeInTheDocument();
        });
    });

    describe('Click handler', () => {
        test('calls addToCart when clicked', async () => {
            const addToCart = jest.fn();
            renderProductCard({ addToCart });

            await userEvent.click(screen.getByTestId('product-1'));

            expect(addToCart).toHaveBeenCalledTimes(1);
        });

        test('calls addToCart with correct product', async () => {
            const addToCart = jest.fn();
            renderProductCard({ addToCart });

            await userEvent.click(screen.getByTestId('product-1'));

            expect(addToCart).toHaveBeenCalledWith(mockProduct);
        });

        test('handles multiple clicks', async () => {
            const addToCart = jest.fn();
            renderProductCard({ addToCart });

            const card = screen.getByTestId('product-1');
            await userEvent.click(card);
            await userEvent.click(card);
            await userEvent.click(card);

            expect(addToCart).toHaveBeenCalledTimes(3);
        });
    });

    describe('Attributes display', () => {
        test('displays variant title', () => {
            renderProductCard();
            expect(screen.getByText('Blue / M')).toBeInTheDocument();
        });

        test('displays size attribute', () => {
            renderProductCard();
            expect(screen.getByText('M')).toBeInTheDocument();
        });

        test('does not show attributes in small grid', () => {
            renderProductCard({ gridSize: 'small' });
            expect(screen.queryByText('Blue / M')).not.toBeInTheDocument();
        });
    });

    describe('Price formatting', () => {
        test('formats price with 2 decimals', () => {
            renderProductCard({ product: { ...mockProduct, price_retail: 100 } });
            expect(screen.getByText('€100.00')).toBeInTheDocument();
        });

        test('handles decimal prices', () => {
            renderProductCard({ product: { ...mockProduct, price_retail: 9.99 } });
            expect(screen.getByText('€9.99')).toBeInTheDocument();
        });

        test('handles large prices', () => {
            renderProductCard({ product: { ...mockProduct, price_retail: 1234.56 } });
            expect(screen.getByText('€1234.56')).toBeInTheDocument();
        });
    });

    describe('Different product variations', () => {
        test('renders product without optional fields', () => {
            const minimalProduct = {
                id: 2,
                name_fr: 'Minimal Product',
                sku: 'MIN-001',
                price_retail: 10,
                stock_qty: 100,
                unit: 'pc',
            };

            renderProductCard({ product: minimalProduct });
            expect(screen.getByTestId('product-2')).toBeInTheDocument();
            expect(screen.getByText('Minimal Product')).toBeInTheDocument();
        });

        test('renders product with tags', () => {
            const productWithTags = {
                ...mockProduct,
                tags: ['sale', 'new', 'featured'],
            };

            renderProductCard({ product: productWithTags });
            expect(screen.getByTestId('product-1')).toBeInTheDocument();
        });
    });

    describe('Styling', () => {
        test('has transition classes', () => {
            renderProductCard();
            const card = screen.getByTestId('product-1');
            expect(card.className).toContain('transition');
        });

        test('has hover scale effect', () => {
            renderProductCard();
            const card = screen.getByTestId('product-1');
            expect(card.className).toContain('active:scale-95');
        });
    });

    describe('Accessibility', () => {
        test('product card is a button', () => {
            renderProductCard();
            expect(screen.getByRole('button')).toBeInTheDocument();
        });

        test('button is focusable', () => {
            renderProductCard();
            const button = screen.getByRole('button');
            button.focus();
            expect(button).toHaveFocus();
        });
    });
});
