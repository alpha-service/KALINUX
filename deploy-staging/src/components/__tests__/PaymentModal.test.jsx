import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentModal from '../PaymentModal';
import { LanguageProvider } from '@/hooks/useLanguage';

// Wrapper component that provides required context
const TestWrapper = ({ children }) => (
    <LanguageProvider>
        {children}
    </LanguageProvider>
);

const renderPaymentModal = (props = {}) => {
    const defaultProps = {
        open: true,
        onClose: jest.fn(),
        total: 100,
        onPaymentComplete: jest.fn(),
        ...props,
    };

    return render(
        <TestWrapper>
            <PaymentModal {...defaultProps} />
        </TestWrapper>
    );
};

describe('PaymentModal component', () => {
    describe('Rendering', () => {
        test('renders modal when open is true', () => {
            renderPaymentModal({ open: true });
            expect(screen.getByTestId('payment-modal')).toBeInTheDocument();
        });

        test('does not render modal when open is false', () => {
            renderPaymentModal({ open: false });
            expect(screen.queryByTestId('payment-modal')).not.toBeInTheDocument();
        });

        test('displays total amount', () => {
            renderPaymentModal({ total: 99.99 });
            expect(screen.getByText('€99.99')).toBeInTheDocument();
        });

        test('displays TOTAL label', () => {
            renderPaymentModal();
            expect(screen.getByText('TOTAL')).toBeInTheDocument();
        });
    });

    describe('Payment methods', () => {
        test('renders all 3 payment method buttons', () => {
            renderPaymentModal();

            expect(screen.getByTestId('payment-method-cash')).toBeInTheDocument();
            expect(screen.getByTestId('payment-method-card')).toBeInTheDocument();
            expect(screen.getByTestId('payment-method-bank_transfer')).toBeInTheDocument();
        });

        test('cash is selected by default', () => {
            renderPaymentModal();

            const cashButton = screen.getByTestId('payment-method-cash');
            expect(cashButton.className).toContain('border-brand-navy');
        });

        test('clicking card changes selected method', async () => {
            renderPaymentModal();

            await userEvent.click(screen.getByTestId('payment-method-card'));

            const cardButton = screen.getByTestId('payment-method-card');
            expect(cardButton.className).toContain('border-brand-navy');
        });

        test('clicking bank transfer changes selected method', async () => {
            renderPaymentModal();

            await userEvent.click(screen.getByTestId('payment-method-bank_transfer'));

            const bankButton = screen.getByTestId('payment-method-bank_transfer');
            expect(bankButton.className).toContain('border-brand-navy');
        });
    });

    describe('Cash payment', () => {
        test('shows amount input for cash payment', () => {
            renderPaymentModal();
            expect(screen.getByTestId('amount-tendered')).toBeInTheDocument();
        });

        test('hides amount input when card is selected', async () => {
            renderPaymentModal();

            await userEvent.click(screen.getByTestId('payment-method-card'));

            expect(screen.queryByTestId('amount-tendered')).not.toBeInTheDocument();
        });

        test('amount input is pre-filled with total on open', () => {
            renderPaymentModal({ total: 50.00 });

            const input = screen.getByTestId('amount-tendered');
            expect(input).toHaveValue(50);
        });

        test('quick cash buttons are displayed', () => {
            renderPaymentModal();

            expect(screen.getByRole('button', { name: '€10' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '€20' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '€50' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '€100' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '€200' })).toBeInTheDocument();
        });

        test('clicking quick cash button sets amount', async () => {
            renderPaymentModal({ total: 15 });

            const input = screen.getByTestId('amount-tendered');
            await userEvent.click(screen.getByRole('button', { name: '€50' }));

            expect(input).toHaveValue(50);
        });

        test('change is calculated when amount exceeds total', async () => {
            renderPaymentModal({ total: 75 });

            await userEvent.click(screen.getByRole('button', { name: '€100' }));

            // Should show €25 change
            expect(screen.getByText('€25.00')).toBeInTheDocument();
        });

        test('no change shown when amount equals total', async () => {
            renderPaymentModal({ total: 50 });

            await userEvent.click(screen.getByRole('button', { name: '€50' }));

            // Should not show change section
            expect(screen.queryByText('€0.00')).not.toBeInTheDocument();
        });

        test('user can type custom amount', async () => {
            renderPaymentModal({ total: 33.50 });

            const input = screen.getByTestId('amount-tendered');
            await userEvent.clear(input);
            await userEvent.type(input, '40');

            expect(input).toHaveValue(40);
        });
    });

    describe('Action buttons', () => {
        test('cancel button is present', () => {
            renderPaymentModal();
            expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
        });

        test('confirm button is present', () => {
            renderPaymentModal();
            expect(screen.getByTestId('confirm-payment-btn')).toBeInTheDocument();
        });

        test('clicking cancel calls onClose', async () => {
            const onClose = jest.fn();
            renderPaymentModal({ onClose });

            await userEvent.click(screen.getByRole('button', { name: /annuler/i }));

            expect(onClose).toHaveBeenCalled();
        });

        test('clicking confirm calls onPaymentComplete', async () => {
            const onPaymentComplete = jest.fn();
            renderPaymentModal({ total: 50, onPaymentComplete });

            await userEvent.click(screen.getByTestId('confirm-payment-btn'));

            expect(onPaymentComplete).toHaveBeenCalled();
        });

        test('onPaymentComplete receives payment data', async () => {
            const onPaymentComplete = jest.fn();
            renderPaymentModal({ total: 50, onPaymentComplete });

            await userEvent.click(screen.getByTestId('confirm-payment-btn'));

            expect(onPaymentComplete).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        method: 'cash',
                        amount: 50
                    })
                ])
            );
        });
    });

    describe('Mixed payments', () => {
        test('can switch between payment methods', async () => {
            renderPaymentModal({ total: 100 });

            // Start with cash
            expect(screen.getByTestId('payment-method-cash').className).toContain('border-brand-navy');

            // Switch to card
            await userEvent.click(screen.getByTestId('payment-method-card'));
            expect(screen.getByTestId('payment-method-card').className).toContain('border-brand-navy');

            // Switch to bank transfer
            await userEvent.click(screen.getByTestId('payment-method-bank_transfer'));
            expect(screen.getByTestId('payment-method-bank_transfer').className).toContain('border-brand-navy');
        });
    });

    describe('Accessibility', () => {
        test('modal has correct dialog role', () => {
            renderPaymentModal();
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        test('payment method buttons are clickable', async () => {
            renderPaymentModal();

            const buttons = [
                screen.getByTestId('payment-method-cash'),
                screen.getByTestId('payment-method-card'),
                screen.getByTestId('payment-method-bank_transfer'),
            ];

            for (const button of buttons) {
                expect(button).toBeEnabled();
            }
        });
    });

    describe('Edge cases', () => {
        test('handles zero total', () => {
            renderPaymentModal({ total: 0 });
            expect(screen.getByText('€0.00')).toBeInTheDocument();
        });

        test('handles large total', () => {
            renderPaymentModal({ total: 9999.99 });
            expect(screen.getByText('€9999.99')).toBeInTheDocument();
        });

        test('handles decimal total', () => {
            renderPaymentModal({ total: 123.45 });
            expect(screen.getByText('€123.45')).toBeInTheDocument();
        });
    });
});
