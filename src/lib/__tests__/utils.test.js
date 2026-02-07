import { cn } from '../utils';

describe('cn utility function', () => {
    describe('Basic functionality', () => {
        test('returns empty string for no arguments', () => {
            expect(cn()).toBe('');
        });

        test('returns single class unchanged', () => {
            expect(cn('foo')).toBe('foo');
        });

        test('joins multiple classes with space', () => {
            expect(cn('foo', 'bar')).toBe('foo bar');
        });

        test('handles undefined values', () => {
            expect(cn('foo', undefined, 'bar')).toBe('foo bar');
        });

        test('handles null values', () => {
            expect(cn('foo', null, 'bar')).toBe('foo bar');
        });

        test('handles false values', () => {
            expect(cn('foo', false, 'bar')).toBe('foo bar');
        });

        test('handles empty strings', () => {
            expect(cn('foo', '', 'bar')).toBe('foo bar');
        });
    });

    describe('Conditional classes', () => {
        test('includes class when condition is true', () => {
            const isActive = true;
            expect(cn('base', isActive && 'active')).toBe('base active');
        });

        test('excludes class when condition is false', () => {
            const isActive = false;
            expect(cn('base', isActive && 'active')).toBe('base');
        });

        test('works with ternary operator', () => {
            expect(cn('base', true ? 'yes' : 'no')).toBe('base yes');
            expect(cn('base', false ? 'yes' : 'no')).toBe('base no');
        });
    });

    describe('Object syntax', () => {
        test('includes keys with truthy values', () => {
            expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
        });

        test('handles all falsy values', () => {
            expect(cn({ foo: false, bar: null, baz: undefined })).toBe('');
        });
    });

    describe('Array syntax', () => {
        test('flattens arrays of classes', () => {
            expect(cn(['foo', 'bar'])).toBe('foo bar');
        });

        test('handles nested arrays', () => {
            expect(cn(['foo', ['bar', 'baz']])).toBe('foo bar baz');
        });
    });

    describe('Tailwind merge functionality', () => {
        test('merges conflicting padding classes', () => {
            expect(cn('p-2', 'p-4')).toBe('p-4');
        });

        test('merges conflicting margin classes', () => {
            expect(cn('m-2', 'm-4')).toBe('m-4');
        });

        test('merges conflicting background classes', () => {
            expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
        });

        test('merges conflicting text color classes', () => {
            expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
        });

        test('merges conflicting font-size classes', () => {
            expect(cn('text-sm', 'text-lg')).toBe('text-lg');
        });

        test('merges conflicting width classes', () => {
            expect(cn('w-4', 'w-8')).toBe('w-8');
        });

        test('merges conflicting height classes', () => {
            expect(cn('h-4', 'h-8')).toBe('h-8');
        });

        test('merges conflicting flex classes', () => {
            expect(cn('flex-row', 'flex-col')).toBe('flex-col');
        });

        test('merges conflicting rounded classes', () => {
            expect(cn('rounded-md', 'rounded-lg')).toBe('rounded-lg');
        });

        test('keeps non-conflicting classes', () => {
            expect(cn('p-2', 'm-4', 'bg-red-500')).toBe('p-2 m-4 bg-red-500');
        });

        test('preserves hover state classes', () => {
            const result = cn('hover:bg-red-500', 'hover:bg-blue-500');
            expect(result).toBe('hover:bg-blue-500');
        });

        test('preserves focus state classes', () => {
            const result = cn('focus:ring-2', 'focus:ring-4');
            expect(result).toBe('focus:ring-4');
        });
    });

    describe('Complex real-world scenarios', () => {
        test('merges component base with custom classes', () => {
            const baseClasses = 'flex items-center px-4 py-2 bg-blue-500 text-white';
            const customClasses = 'px-6 bg-red-500'; // Override padding and bg
            expect(cn(baseClasses, customClasses)).toBe('flex items-center py-2 text-white px-6 bg-red-500');
        });

        test('handles button variant pattern', () => {
            const base = 'inline-flex items-center rounded-md font-medium';
            const variant = 'bg-primary text-primary-foreground';
            const size = 'h-9 px-4 py-2';
            const custom = 'w-full';

            const result = cn(base, variant, size, custom);
            expect(result).toContain('inline-flex');
            expect(result).toContain('items-center');
            expect(result).toContain('bg-primary');
            expect(result).toContain('w-full');
        });

        test('handles disabled state override', () => {
            const base = 'bg-blue-500 hover:bg-blue-600 cursor-pointer';
            const disabled = 'opacity-50 cursor-not-allowed pointer-events-none';

            const result = cn(base, disabled);
            expect(result).toContain('opacity-50');
            expect(result).toContain('bg-blue-500');
        });
    });
});
