import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input component', () => {
    describe('Rendering', () => {
        test('renders input element', () => {
            render(<Input />);
            expect(screen.getByRole('textbox')).toBeInTheDocument();
        });

        test('renders with placeholder', () => {
            render(<Input placeholder="Enter text..." />);
            expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
        });

        test('forwards ref correctly', () => {
            const ref = React.createRef();
            render(<Input ref={ref} />);
            expect(ref.current).toBeInstanceOf(HTMLInputElement);
        });

        test('has correct displayName', () => {
            expect(Input.displayName).toBe('Input');
        });
    });

    describe('Types', () => {
        test('renders text input by default', () => {
            render(<Input />);
            // Input without type prop renders as text (default HTML behavior)
            // The component doesn't set an explicit type, so it's undefined
            const input = screen.getByRole('textbox');
            expect(input).toBeInTheDocument();
        });

        test('renders text type', () => {
            render(<Input type="text" />);
            expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
        });

        test('renders email type', () => {
            render(<Input type="email" placeholder="email" />);
            expect(screen.getByPlaceholderText('email')).toHaveAttribute('type', 'email');
        });

        test('renders password type', () => {
            render(<Input type="password" placeholder="password" />);
            expect(screen.getByPlaceholderText('password')).toHaveAttribute('type', 'password');
        });

        test('renders number type', () => {
            render(<Input type="number" placeholder="number" />);
            expect(screen.getByPlaceholderText('number')).toHaveAttribute('type', 'number');
        });

        test('renders search type', () => {
            render(<Input type="search" placeholder="search" />);
            expect(screen.getByPlaceholderText('search')).toHaveAttribute('type', 'search');
        });

        test('renders tel type', () => {
            render(<Input type="tel" placeholder="phone" />);
            expect(screen.getByPlaceholderText('phone')).toHaveAttribute('type', 'tel');
        });

        test('renders url type', () => {
            render(<Input type="url" placeholder="url" />);
            expect(screen.getByPlaceholderText('url')).toHaveAttribute('type', 'url');
        });
    });

    describe('Value handling', () => {
        test('displays initial value', () => {
            render(<Input defaultValue="Hello" />);
            expect(screen.getByRole('textbox')).toHaveValue('Hello');
        });

        test('handles controlled value', () => {
            const { rerender } = render(<Input value="initial" onChange={() => { }} />);
            expect(screen.getByRole('textbox')).toHaveValue('initial');

            rerender(<Input value="updated" onChange={() => { }} />);
            expect(screen.getByRole('textbox')).toHaveValue('updated');
        });

        test('updates value on user input', async () => {
            render(<Input defaultValue="" />);
            const input = screen.getByRole('textbox');

            await userEvent.type(input, 'Hello World');

            expect(input).toHaveValue('Hello World');
        });
    });

    describe('Event handling', () => {
        test('calls onChange handler when value changes', async () => {
            const handleChange = jest.fn();
            render(<Input onChange={handleChange} />);

            await userEvent.type(screen.getByRole('textbox'), 'a');

            expect(handleChange).toHaveBeenCalled();
        });

        test('onChange receives correct event', async () => {
            const handleChange = jest.fn();
            render(<Input onChange={handleChange} />);

            await userEvent.type(screen.getByRole('textbox'), 'x');

            expect(handleChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    target: expect.objectContaining({
                        value: 'x'
                    })
                })
            );
        });

        test('calls onFocus handler when focused', async () => {
            const handleFocus = jest.fn();
            render(<Input onFocus={handleFocus} />);

            await userEvent.click(screen.getByRole('textbox'));

            expect(handleFocus).toHaveBeenCalled();
        });

        test('calls onBlur handler when blurred', async () => {
            const handleBlur = jest.fn();
            render(<Input onBlur={handleBlur} />);

            const input = screen.getByRole('textbox');
            await userEvent.click(input);
            await userEvent.tab();

            expect(handleBlur).toHaveBeenCalled();
        });

        test('calls onKeyDown handler on key press', async () => {
            const handleKeyDown = jest.fn();
            render(<Input onKeyDown={handleKeyDown} />);

            const input = screen.getByRole('textbox');
            await userEvent.click(input);
            await userEvent.keyboard('{Enter}');

            expect(handleKeyDown).toHaveBeenCalled();
        });
    });

    describe('Disabled state', () => {
        test('renders disabled input', () => {
            render(<Input disabled />);
            expect(screen.getByRole('textbox')).toBeDisabled();
        });

        test('disabled input has correct styling', () => {
            render(<Input disabled />);
            const input = screen.getByRole('textbox');
            expect(input.className).toContain('disabled:cursor-not-allowed');
            expect(input.className).toContain('disabled:opacity-50');
        });

        test('disabled input does not receive focus on click', async () => {
            render(<Input disabled />);
            const input = screen.getByRole('textbox');

            await userEvent.click(input);

            expect(input).not.toHaveFocus();
        });
    });

    describe('Read-only state', () => {
        test('renders read-only input', () => {
            render(<Input readOnly defaultValue="Read only" />);
            expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
        });

        test('read-only input does not allow changes', async () => {
            render(<Input readOnly defaultValue="Original" />);
            const input = screen.getByRole('textbox');

            await userEvent.type(input, ' Modified');

            expect(input).toHaveValue('Original');
        });
    });

    describe('Custom className', () => {
        test('applies custom className', () => {
            render(<Input className="custom-class" />);
            expect(screen.getByRole('textbox').className).toContain('custom-class');
        });

        test('merges custom className with base classes', () => {
            render(<Input className="my-style" />);
            const input = screen.getByRole('textbox');
            expect(input.className).toContain('my-style');
            expect(input.className).toContain('rounded-md');
            expect(input.className).toContain('border');
        });
    });

    describe('Base styling', () => {
        test('has border styling', () => {
            render(<Input />);
            expect(screen.getByRole('textbox').className).toContain('border');
        });

        test('has rounded styling', () => {
            render(<Input />);
            expect(screen.getByRole('textbox').className).toContain('rounded-md');
        });

        test('has shadow styling', () => {
            render(<Input />);
            expect(screen.getByRole('textbox').className).toContain('shadow-sm');
        });

        test('has focus visible styling', () => {
            render(<Input />);
            const className = screen.getByRole('textbox').className;
            expect(className).toContain('focus-visible:ring');
        });
    });

    describe('HTML attributes', () => {
        test('accepts id attribute', () => {
            render(<Input id="my-input" />);
            expect(screen.getByRole('textbox')).toHaveAttribute('id', 'my-input');
        });

        test('accepts name attribute', () => {
            render(<Input name="username" />);
            expect(screen.getByRole('textbox')).toHaveAttribute('name', 'username');
        });

        test('accepts required attribute', () => {
            render(<Input required />);
            expect(screen.getByRole('textbox')).toBeRequired();
        });

        test('accepts maxLength attribute', () => {
            render(<Input maxLength={10} />);
            expect(screen.getByRole('textbox')).toHaveAttribute('maxLength', '10');
        });

        test('accepts minLength attribute', () => {
            render(<Input minLength={2} />);
            expect(screen.getByRole('textbox')).toHaveAttribute('minLength', '2');
        });

        test('accepts pattern attribute', () => {
            render(<Input pattern="[A-Za-z]+" />);
            expect(screen.getByRole('textbox')).toHaveAttribute('pattern', '[A-Za-z]+');
        });

        test('accepts autoComplete attribute', () => {
            render(<Input autoComplete="email" />);
            expect(screen.getByRole('textbox')).toHaveAttribute('autocomplete', 'email');
        });

        test('accepts autoFocus attribute', () => {
            render(<Input autoFocus />);
            expect(screen.getByRole('textbox')).toHaveFocus();
        });

        test('accepts aria attributes', () => {
            render(<Input aria-label="Search input" aria-describedby="help-text" />);
            const input = screen.getByRole('textbox');
            expect(input).toHaveAttribute('aria-label', 'Search input');
            expect(input).toHaveAttribute('aria-describedby', 'help-text');
        });

        test('accepts data attributes', () => {
            render(<Input data-testid="custom-input" data-form="main" />);
            const input = screen.getByTestId('custom-input');
            expect(input).toHaveAttribute('data-form', 'main');
        });
    });

    describe('Number input specifics', () => {
        test('accepts min and max for number type', () => {
            render(<Input type="number" min={0} max={100} placeholder="number" />);
            const input = screen.getByPlaceholderText('number');
            expect(input).toHaveAttribute('min', '0');
            expect(input).toHaveAttribute('max', '100');
        });

        test('accepts step for number type', () => {
            render(<Input type="number" step={0.01} placeholder="price" />);
            expect(screen.getByPlaceholderText('price')).toHaveAttribute('step', '0.01');
        });
    });
});
