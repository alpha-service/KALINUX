import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, buttonVariants } from '../button';

describe('Button component', () => {
    describe('Rendering', () => {
        test('renders button with text', () => {
            render(<Button>Click me</Button>);
            expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
        });

        test('renders button with children', () => {
            render(
                <Button>
                    <span data-testid="icon">🎯</span>
                    <span>Label</span>
                </Button>
            );
            expect(screen.getByTestId('icon')).toBeInTheDocument();
            expect(screen.getByText('Label')).toBeInTheDocument();
        });

        test('forwards ref correctly', () => {
            const ref = React.createRef();
            render(<Button ref={ref}>Button</Button>);
            expect(ref.current).toBeInstanceOf(HTMLButtonElement);
        });

        test('renders as child element when asChild is true', () => {
            render(
                <Button asChild>
                    <a href="/test">Link Button</a>
                </Button>
            );
            const link = screen.getByRole('link');
            expect(link).toBeInTheDocument();
            expect(link).toHaveAttribute('href', '/test');
        });
    });

    describe('Variants', () => {
        test('renders default variant', () => {
            render(<Button>Default</Button>);
            const button = screen.getByRole('button');
            expect(button.className).toContain('bg-primary');
        });

        test('renders destructive variant', () => {
            render(<Button variant="destructive">Delete</Button>);
            const button = screen.getByRole('button');
            expect(button.className).toContain('bg-destructive');
        });

        test('renders outline variant', () => {
            render(<Button variant="outline">Outline</Button>);
            const button = screen.getByRole('button');
            expect(button.className).toContain('border');
        });

        test('renders secondary variant', () => {
            render(<Button variant="secondary">Secondary</Button>);
            const button = screen.getByRole('button');
            expect(button.className).toContain('bg-secondary');
        });

        test('renders ghost variant', () => {
            render(<Button variant="ghost">Ghost</Button>);
            const button = screen.getByRole('button');
            expect(button.className).toContain('hover:bg-accent');
        });

        test('renders link variant', () => {
            render(<Button variant="link">Link</Button>);
            const button = screen.getByRole('button');
            expect(button.className).toContain('underline-offset');
        });
    });

    describe('Sizes', () => {
        test('renders default size', () => {
            render(<Button>Default Size</Button>);
            const button = screen.getByRole('button');
            expect(button.className).toContain('h-9');
            expect(button.className).toContain('px-4');
        });

        test('renders sm size', () => {
            render(<Button size="sm">Small</Button>);
            const button = screen.getByRole('button');
            expect(button.className).toContain('h-8');
            expect(button.className).toContain('px-3');
        });

        test('renders lg size', () => {
            render(<Button size="lg">Large</Button>);
            const button = screen.getByRole('button');
            expect(button.className).toContain('h-10');
            expect(button.className).toContain('px-8');
        });

        test('renders icon size', () => {
            render(<Button size="icon">🔍</Button>);
            const button = screen.getByRole('button');
            expect(button.className).toContain('h-9');
            expect(button.className).toContain('w-9');
        });
    });

    describe('Disabled state', () => {
        test('renders disabled button', () => {
            render(<Button disabled>Disabled</Button>);
            const button = screen.getByRole('button');
            expect(button).toBeDisabled();
        });

        test('disabled button has correct styling', () => {
            render(<Button disabled>Disabled</Button>);
            const button = screen.getByRole('button');
            expect(button.className).toContain('disabled:opacity-50');
            expect(button.className).toContain('disabled:pointer-events-none');
        });

        test('disabled button does not trigger click', async () => {
            const handleClick = jest.fn();
            render(<Button disabled onClick={handleClick}>Disabled</Button>);

            const button = screen.getByRole('button');
            await userEvent.click(button);

            expect(handleClick).not.toHaveBeenCalled();
        });
    });

    describe('Event handling', () => {
        test('calls onClick handler when clicked', async () => {
            const handleClick = jest.fn();
            render(<Button onClick={handleClick}>Click me</Button>);

            await userEvent.click(screen.getByRole('button'));

            expect(handleClick).toHaveBeenCalledTimes(1);
        });

        test('calls onClick with event object', async () => {
            const handleClick = jest.fn();
            render(<Button onClick={handleClick}>Click</Button>);

            await userEvent.click(screen.getByRole('button'));

            expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
        });

        test('handles multiple clicks', async () => {
            const handleClick = jest.fn();
            render(<Button onClick={handleClick}>Multi Click</Button>);

            const button = screen.getByRole('button');
            await userEvent.click(button);
            await userEvent.click(button);
            await userEvent.click(button);

            expect(handleClick).toHaveBeenCalledTimes(3);
        });
    });

    describe('Custom className', () => {
        test('applies custom className', () => {
            render(<Button className="custom-class">Custom</Button>);
            const button = screen.getByRole('button');
            expect(button.className).toContain('custom-class');
        });

        test('merges custom className with variant classes', () => {
            render(<Button className="extra-style" variant="destructive">Merged</Button>);
            const button = screen.getByRole('button');
            expect(button.className).toContain('extra-style');
            expect(button.className).toContain('bg-destructive');
        });
    });

    describe('HTML attributes', () => {
        test('accepts type attribute', () => {
            render(<Button type="submit">Submit</Button>);
            expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
        });

        test('accepts id attribute', () => {
            render(<Button id="test-button">ID Button</Button>);
            expect(screen.getByRole('button')).toHaveAttribute('id', 'test-button');
        });

        test('accepts data attributes', () => {
            render(<Button data-testid="custom-btn" data-action="save">Data</Button>);
            const button = screen.getByTestId('custom-btn');
            expect(button).toHaveAttribute('data-action', 'save');
        });

        test('accepts aria attributes', () => {
            render(<Button aria-label="Close dialog">X</Button>);
            expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Close dialog');
        });
    });

    describe('Display name', () => {
        test('has correct displayName', () => {
            expect(Button.displayName).toBe('Button');
        });
    });
});

describe('buttonVariants function', () => {
    test('returns default classes with no arguments', () => {
        const classes = buttonVariants();
        expect(classes).toContain('inline-flex');
        expect(classes).toContain('items-center');
        expect(classes).toContain('rounded-md');
    });

    test('returns classes for specific variant', () => {
        const classes = buttonVariants({ variant: 'destructive' });
        expect(classes).toContain('bg-destructive');
    });

    test('returns classes for specific size', () => {
        const classes = buttonVariants({ size: 'lg' });
        expect(classes).toContain('h-10');
        expect(classes).toContain('px-8');
    });

    test('combines variant and size', () => {
        const classes = buttonVariants({ variant: 'outline', size: 'sm' });
        expect(classes).toContain('border');
        expect(classes).toContain('h-8');
    });

    test('merges custom className', () => {
        const classes = buttonVariants({ className: 'my-custom-class' });
        expect(classes).toContain('my-custom-class');
    });
});
