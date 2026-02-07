import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CartItem from '../CartItem';
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

// Mock cart item
const mockItem = {
    product_id: 1,
    name: 'Test Product',
    sku: 'TEST-001',
    qty: 2,
    unit: 'pc',
    unit_price: 25.00,
    vat_rate: 21,
    discount_type: null,
    discount_value: 0,
    priceOverridden: false,
};

const defaultProps = {
    item: mockItem,
    compact: false,
    highlighted: false,
    isEditingPrice: false,
    isEditingDiscount: false,
    onUpdateQuantity: jest.fn(),
    onRemove: jest.fn(),
    onStartEditPrice: jest.fn(),
    onConfirmPrice: jest.fn(),
    onCancelPrice: jest.fn(),
    onStartEditDiscount: jest.fn(),
    onConfirmDiscount: jest.fn(),
    onCancelDiscount: jest.fn(),
    onRemoveDiscount: jest.fn(),
};

const renderCartItem = (props = {}) => {
    return render(
        <TestWrapper>
            <CartItem {...defaultProps} {...props} />
        </TestWrapper>
    );
};

describe('CartItem component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Normal mode rendering', () => {
        test('renders cart item', () => {
            renderCartItem();
            expect(screen.getByTestId('cart-item-1')).toBeInTheDocument();
        });

        test('displays product name', () => {
            renderCartItem();
            expect(screen.getByText('Test Product')).toBeInTheDocument();
        });

        test('displays product SKU', () => {
            renderCartItem();
            expect(screen.getByText('TEST-001')).toBeInTheDocument();
        });

        test('displays quantity', () => {
            renderCartItem();
            const qtyInput = screen.getByRole('spinbutton');
            expect(qtyInput).toHaveValue(2);
        });

        test('displays unit price', () => {
            renderCartItem();
            expect(screen.getByText(/€25.00/)).toBeInTheDocument();
        });

        test('displays VAT rate', () => {
            renderCartItem();
            expect(screen.getByText(/21%/)).toBeInTheDocument();
        });

        test('displays line total', () => {
            // 2 * 25 = 50
            renderCartItem();
            expect(screen.getByText('€50.00')).toBeInTheDocument();
        });
    });

    describe('Compact mode rendering', () => {
        test('renders in compact mode', () => {
            renderCartItem({ compact: true });
            expect(screen.getByText('Test Product')).toBeInTheDocument();
        });

        test('compact mode hides SKU', () => {
            renderCartItem({ compact: true });
            expect(screen.queryByText('TEST-001')).not.toBeInTheDocument();
        });

        test('compact mode has smaller elements', () => {
            const { container } = renderCartItem({ compact: true });
            // Check for compact styling
            expect(container.firstChild.className).toContain('gap-1.5');
        });
    });

    describe('Quantity controls', () => {
        test('plus button increases quantity', async () => {
            const onUpdateQuantity = jest.fn();
            renderCartItem({ onUpdateQuantity });

            const plusButtons = screen.getAllByRole('button');
            const plusBtn = plusButtons.find(btn => btn.querySelector('svg.lucide-plus'));
            await userEvent.click(plusBtn);

            expect(onUpdateQuantity).toHaveBeenCalledWith(1, 1);
        });

        test('minus button decreases quantity', async () => {
            const onUpdateQuantity = jest.fn();
            renderCartItem({ onUpdateQuantity });

            const minusButtons = screen.getAllByRole('button');
            const minusBtn = minusButtons.find(btn => btn.querySelector('svg.lucide-minus'));
            await userEvent.click(minusBtn);

            expect(onUpdateQuantity).toHaveBeenCalledWith(1, -1);
        });

        test('typing quantity updates it', async () => {
            const onUpdateQuantity = jest.fn();
            renderCartItem({ onUpdateQuantity });

            const qtyInput = screen.getByRole('spinbutton');
            await userEvent.clear(qtyInput);
            await userEvent.type(qtyInput, '5');

            expect(onUpdateQuantity).toHaveBeenCalled();
        });
    });

    describe('Remove item', () => {
        test('remove button calls onRemove', async () => {
            const onRemove = jest.fn();
            renderCartItem({ onRemove });

            // Find button with red text (remove button)
            const buttons = screen.getAllByRole('button');
            const removeBtn = buttons.find(btn => btn.className.includes('text-red'));

            if (removeBtn) {
                await userEvent.click(removeBtn);
                expect(onRemove).toHaveBeenCalledWith(1);
            } else {
                // Fallback: click last button
                await userEvent.click(buttons[buttons.length - 1]);
                expect(onRemove).toHaveBeenCalled();
            }
        });
    });

    describe('Price editing', () => {
        test('clicking price starts edit', async () => {
            const onStartEditPrice = jest.fn();
            renderCartItem({ onStartEditPrice });

            const priceElement = screen.getByTitle(/Modifier le prix|pos_edit_price/);
            await userEvent.click(priceElement);

            expect(onStartEditPrice).toHaveBeenCalledWith(1);
        });

        test('shows input when editing price', () => {
            renderCartItem({ isEditingPrice: true });

            // Should have a number input for price
            const inputs = screen.getAllByRole('spinbutton');
            expect(inputs.length).toBeGreaterThan(1); // Qty + price
        });
    });

    describe('Discount handling', () => {
        test('discount button is present', () => {
            renderCartItem();

            const discountBtn = screen.getByTitle(/Remise|discount/i);
            expect(discountBtn).toBeInTheDocument();
        });

        test('clicking discount starts edit', async () => {
            const onStartEditDiscount = jest.fn();
            renderCartItem({ onStartEditDiscount });

            const discountBtn = screen.getByTitle(/Remise|discount/i);
            await userEvent.click(discountBtn);

            expect(onStartEditDiscount).toHaveBeenCalledWith(1);
        });

        test('shows discount value when applied', () => {
            renderCartItem({
                item: {
                    ...mockItem,
                    discount_type: 'percent',
                    discount_value: 10,
                },
            });

            expect(screen.getByText(/-10%/)).toBeInTheDocument();
        });

        test('calculates price with percentage discount', () => {
            renderCartItem({
                item: {
                    ...mockItem,
                    discount_type: 'percent',
                    discount_value: 10,
                },
            });

            // 50 - 10% = 45
            expect(screen.getByText('€45.00')).toBeInTheDocument();
        });

        test('calculates price with fixed discount', () => {
            renderCartItem({
                item: {
                    ...mockItem,
                    discount_type: 'fixed',
                    discount_value: 5,
                },
            });

            // 50 - 5 = 45
            expect(screen.getByText('€45.00')).toBeInTheDocument();
        });

        test('shows remove discount button when discount is applied', () => {
            renderCartItem({
                item: {
                    ...mockItem,
                    discount_type: 'percent',
                    discount_value: 10,
                },
            });

            const removeDiscountBtn = screen.getByTitle(/Supprimer la remise/i);
            expect(removeDiscountBtn).toBeInTheDocument();
        });
    });

    describe('Visual states', () => {
        test('highlighted state has special styling', () => {
            renderCartItem({ highlighted: true });
            const item = screen.getByTestId('cart-item-1');
            expect(item.className).toContain('bg-orange-50');
        });

        test('price overridden state has special styling', () => {
            renderCartItem({
                item: { ...mockItem, priceOverridden: true },
            });
            const item = screen.getByTestId('cart-item-1');
            expect(item.className).toContain('ring-amber-400');
        });

        test('discount applied state has special styling', () => {
            renderCartItem({
                item: {
                    ...mockItem,
                    discount_value: 10,
                    discount_type: 'percent',
                },
            });
            const item = screen.getByTestId('cart-item-1');
            expect(item.className).toContain('ring-green-400');
        });
    });

    describe('Calculations', () => {
        test('calculates VAT correctly', () => {
            // 50 * 21% = 10.50
            renderCartItem();
            expect(screen.getByText(/€10.50/)).toBeInTheDocument();
        });

        test('calculates total with VAT correctly', () => {
            // 50 + 10.50 = 60.50
            renderCartItem();
            expect(screen.getByText(/€60.50/)).toBeInTheDocument();
        });

        test('calculates discount correctly', () => {
            renderCartItem({
                item: {
                    ...mockItem,
                    discount_type: 'percent',
                    discount_value: 20,
                },
            });

            // Line: 50, Discount: 10, After: 40
            expect(screen.getByText(/€10.00/)).toBeInTheDocument(); // discount amount
            expect(screen.getByText('€40.00')).toBeInTheDocument(); // after discount
        });
    });

    describe('Compact mode functionality', () => {
        test('compact mode quantity controls work', async () => {
            const onUpdateQuantity = jest.fn();
            renderCartItem({ compact: true, onUpdateQuantity });

            const buttons = screen.getAllByRole('button');
            const plusBtn = buttons.find(btn => btn.querySelector('svg.lucide-plus'));
            await userEvent.click(plusBtn);

            expect(onUpdateQuantity).toHaveBeenCalled();
        });

        test('compact mode shows discount indicator', () => {
            renderCartItem({
                compact: true,
                item: {
                    ...mockItem,
                    discount_type: 'percent',
                    discount_value: 15,
                },
            });

            expect(screen.getByText(/15%/)).toBeInTheDocument();
        });
    });
});
