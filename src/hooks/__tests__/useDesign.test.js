import { render, screen } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { DesignProvider, useDesign, DESIGNS, DESIGN_CONFIG, getDesignClasses } from '../useDesign';

// Test wrapper component
const wrapper = ({ children }) => (
    <DesignProvider>{children}</DesignProvider>
);

describe('useDesign hook', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
        document.documentElement.style.cssText = '';
        document.documentElement.removeAttribute('data-design');
    });

    describe('DESIGNS constants', () => {
        test('has all 4 design modes defined', () => {
            expect(DESIGNS.CLASSIC).toBe('classic');
            expect(DESIGNS.MODERN).toBe('modern');
            expect(DESIGNS.MINIMAL).toBe('minimal');
            expect(DESIGNS.CUSTOM).toBe('custom');
        });
    });

    describe('DESIGN_CONFIG', () => {
        test('CLASSIC design has correct configuration', () => {
            const config = DESIGN_CONFIG[DESIGNS.CLASSIC];

            expect(config.name).toBe('Classic / Classique');
            expect(config.nameNL).toBe('Klassiek');
            expect(config.sidebarStyle).toBe('solid');
            expect(config.cardStyle).toBe('shadow');
            expect(config.buttonStyle).toBe('solid');
            expect(config.useGradients).toBe(false);
            expect(config.useGlass).toBe(false);
            expect(config.useShadows).toBe(true);
        });

        test('MODERN design has correct configuration', () => {
            const config = DESIGN_CONFIG[DESIGNS.MODERN];

            expect(config.name).toBe('Modern / Moderne');
            expect(config.sidebarStyle).toBe('glass');
            expect(config.cardStyle).toBe('glass');
            expect(config.buttonStyle).toBe('gradient');
            expect(config.useGradients).toBe(true);
            expect(config.useGlass).toBe(true);
            expect(config.borderRadius).toBe('rounded-2xl');
        });

        test('MINIMAL design has correct configuration', () => {
            const config = DESIGN_CONFIG[DESIGNS.MINIMAL];

            expect(config.name).toContain('Minimal');
            expect(config.sidebarStyle).toBe('flat');
            expect(config.cardStyle).toBe('flat');
            expect(config.buttonStyle).toBe('outline');
            expect(config.useGradients).toBe(false);
            expect(config.useShadows).toBe(false);
            expect(config.borderRadius).toBe('rounded-none');
        });

        test('CUSTOM design has correct configuration', () => {
            const config = DESIGN_CONFIG[DESIGNS.CUSTOM];

            expect(config.name).toContain('Custom');
            expect(config.nameNL).toBe('Aangepast');
        });

        test('all designs have required style properties', () => {
            const requiredProps = [
                'name', 'sidebarStyle', 'cardStyle', 'buttonStyle',
                'borderRadius', 'useGradients', 'useGlass', 'useShadows',
                'cardBg', 'primaryButton', 'secondaryButton'
            ];

            Object.values(DESIGNS).forEach(designId => {
                const config = DESIGN_CONFIG[designId];
                requiredProps.forEach(prop => {
                    expect(config).toHaveProperty(prop);
                });
            });
        });
    });

    describe('Initial state with provider', () => {
        test('defaults to CLASSIC design', () => {
            const { result } = renderHook(() => useDesign(), { wrapper });
            expect(result.current.currentDesign).toBe(DESIGNS.CLASSIC);
        });

        test('returns correct design config for current design', () => {
            const { result } = renderHook(() => useDesign(), { wrapper });
            expect(result.current.design).toEqual(DESIGN_CONFIG[DESIGNS.CLASSIC]);
        });

        test('returns default appearance', () => {
            const { result } = renderHook(() => useDesign(), { wrapper });

            expect(result.current.appearance).toHaveProperty('density', 'comfortable');
            expect(result.current.appearance).toHaveProperty('radius', '0.5rem');
            expect(result.current.appearance).toHaveProperty('fontScale', '100%');
            expect(result.current.appearance).toHaveProperty('buttonSize', 'default');
            expect(result.current.appearance).toHaveProperty('shadows', 'enabled');
        });
    });

    describe('Changing designs', () => {
        test('changeDesign updates current design', () => {
            const { result } = renderHook(() => useDesign(), { wrapper });

            act(() => {
                result.current.changeDesign(DESIGNS.MODERN);
            });

            expect(result.current.currentDesign).toBe(DESIGNS.MODERN);
        });

        test('changeDesign updates design config', () => {
            const { result } = renderHook(() => useDesign(), { wrapper });

            act(() => {
                result.current.changeDesign(DESIGNS.MINIMAL);
            });

            expect(result.current.design).toEqual(DESIGN_CONFIG[DESIGNS.MINIMAL]);
        });

        test('setCurrentDesign is an alias for changeDesign', () => {
            const { result } = renderHook(() => useDesign(), { wrapper });

            act(() => {
                result.current.setCurrentDesign(DESIGNS.MINIMAL);
            });

            expect(result.current.currentDesign).toBe(DESIGNS.MINIMAL);
        });

        test('changeDesign ignores invalid design ID', () => {
            const { result } = renderHook(() => useDesign(), { wrapper });

            act(() => {
                result.current.changeDesign('invalid_design');
            });

            // Should remain CLASSIC
            expect(result.current.currentDesign).toBe(DESIGNS.CLASSIC);
        });

        test('can cycle through all designs', () => {
            const { result } = renderHook(() => useDesign(), { wrapper });

            Object.values(DESIGNS).forEach(designId => {
                act(() => {
                    result.current.changeDesign(designId);
                });
                expect(result.current.currentDesign).toBe(designId);
                expect(result.current.design).toEqual(DESIGN_CONFIG[designId]);
            });
        });
    });

    describe('Appearance settings', () => {
        test('updateAppearance changes specific appearance property', () => {
            const { result } = renderHook(() => useDesign(), { wrapper });

            act(() => {
                result.current.updateAppearance('density', 'compact');
            });

            expect(result.current.appearance.density).toBe('compact');
        });

        test('updateAppearance auto-switches to CUSTOM design', () => {
            const { result } = renderHook(() => useDesign(), { wrapper });

            // Start with CLASSIC
            expect(result.current.currentDesign).toBe(DESIGNS.CLASSIC);

            act(() => {
                result.current.updateAppearance('radius', '1rem');
            });

            // Should switch to CUSTOM
            expect(result.current.currentDesign).toBe(DESIGNS.CUSTOM);
        });

        test('updateAppearance keeps CUSTOM design when already custom', () => {
            const { result } = renderHook(() => useDesign(), { wrapper });

            act(() => {
                result.current.changeDesign(DESIGNS.CUSTOM);
            });

            act(() => {
                result.current.updateAppearance('shadows', 'disabled');
            });

            expect(result.current.currentDesign).toBe(DESIGNS.CUSTOM);
            expect(result.current.appearance.shadows).toBe('disabled');
        });
    });

    describe('CSS variable application', () => {
        test('sets data-design attribute on root element', () => {
            renderHook(() => useDesign(), { wrapper });

            expect(document.documentElement.getAttribute('data-design')).toBe(DESIGNS.CLASSIC);
        });

        test('updates data-design when design changes', () => {
            const { result } = renderHook(() => useDesign(), { wrapper });

            act(() => {
                result.current.changeDesign(DESIGNS.MODERN);
            });

            expect(document.documentElement.getAttribute('data-design')).toBe(DESIGNS.MODERN);
        });

        test('sets CSS custom properties', () => {
            renderHook(() => useDesign(), { wrapper });

            const root = document.documentElement;
            expect(root.style.getPropertyValue('--radius')).toBeTruthy();
        });
    });

    describe('Fallback behavior outside provider', () => {
        test('returns default values when used outside provider', () => {
            const { result } = renderHook(() => useDesign());

            expect(result.current.currentDesign).toBe(DESIGNS.CLASSIC);
            expect(result.current.design).toEqual(DESIGN_CONFIG[DESIGNS.CLASSIC]);
            expect(result.current.DESIGNS).toEqual(DESIGNS);
            expect(result.current.DESIGN_CONFIG).toEqual(DESIGN_CONFIG);
        });

        test('changeDesign is a no-op outside provider', () => {
            const { result } = renderHook(() => useDesign());

            act(() => {
                result.current.changeDesign(DESIGNS.MODERN);
            });

            // Should still be CLASSIC since there's no provider
            expect(result.current.currentDesign).toBe(DESIGNS.CLASSIC);
        });
    });

    describe('Return values', () => {
        test('returns all expected properties', () => {
            const { result } = renderHook(() => useDesign(), { wrapper });

            expect(result.current).toHaveProperty('currentDesign');
            expect(result.current).toHaveProperty('setCurrentDesign');
            expect(result.current).toHaveProperty('design');
            expect(result.current).toHaveProperty('changeDesign');
            expect(result.current).toHaveProperty('appearance');
            expect(result.current).toHaveProperty('updateAppearance');
            expect(result.current).toHaveProperty('DESIGNS');
            expect(result.current).toHaveProperty('DESIGN_CONFIG');
        });
    });
});

describe('getDesignClasses utility function', () => {
    const classicDesign = DESIGN_CONFIG[DESIGNS.CLASSIC];
    const modernDesign = DESIGN_CONFIG[DESIGNS.MODERN];

    test('returns card classes correctly', () => {
        const classes = getDesignClasses(classicDesign, 'card');

        expect(classes).toContain('bg-white');
        expect(classes).toContain('rounded-lg');
        expect(classes).toContain('transition');
    });

    test('returns button-primary classes correctly', () => {
        const classes = getDesignClasses(classicDesign, 'button-primary');

        expect(classes).toContain('bg-brand-orange');
        expect(classes).toContain('text-white');
    });

    test('returns button-secondary classes correctly', () => {
        const classes = getDesignClasses(classicDesign, 'button-secondary');

        expect(classes).toContain('bg-brand-navy');
        expect(classes).toContain('text-white');
    });

    test('returns input classes correctly', () => {
        const classes = getDesignClasses(classicDesign, 'input');

        expect(classes).toContain('border');
        expect(classes).toContain('focus:ring');
    });

    test('returns product-card classes correctly', () => {
        const classes = getDesignClasses(classicDesign, 'product-card');

        expect(classes).toContain('hover:border-brand-navy');
        expect(classes).toContain('hover:shadow-md');
    });

    test('returns nav-item classes correctly', () => {
        const classes = getDesignClasses(classicDesign, 'nav-item');

        expect(classes).toContain('rounded-lg');
        expect(classes).toContain('transition');
    });

    test('returns surface classes correctly', () => {
        const classes = getDesignClasses(classicDesign, 'surface');

        expect(classes).toContain('bg-slate-50');
    });

    test('returns empty string for unknown type', () => {
        const classes = getDesignClasses(classicDesign, 'unknown-type');
        expect(classes).toBe('');
    });

    test('returns different classes for MODERN design', () => {
        const classicCard = getDesignClasses(classicDesign, 'card');
        const modernCard = getDesignClasses(modernDesign, 'card');

        // MODERN should have glass effects
        expect(modernCard).toContain('backdrop-blur');
        expect(modernCard).toContain('rounded-2xl');

        // CLASSIC should not
        expect(classicCard).not.toContain('backdrop-blur');
    });
});

describe('DesignProvider component', () => {
    test('renders children correctly', () => {
        render(
            <DesignProvider>
                <div data-testid="child">Test Child</div>
            </DesignProvider>
        );

        expect(screen.getByTestId('child')).toBeInTheDocument();
        expect(screen.getByText('Test Child')).toBeInTheDocument();
    });
});
