/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
    // Add RTL support
    future: {
      hoverOnlyWhenSupported: true,
    },
  theme: {
  	extend: {
  		// Signature Typography System - Jony Ive inspired
  		fontFamily: {
  			sans: [
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'SF Pro Display',
  				'Segoe UI',
  				'Roboto',
  				'Helvetica Neue',
  				'Arial',
  				'sans-serif',
  			],
  			display: [
  				'SF Pro Display',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Helvetica Neue',
  				'sans-serif',
  			],
  			body: [
  				'SF Pro Text',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'Arial',
  				'sans-serif',
  			],
  		},
  		fontSize: {
  			// Refined type scale with precise line heights
  			'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],      // 12px
  			'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.005em' }], // 14px
  			'base': ['1rem', { lineHeight: '1.625rem', letterSpacing: '0' }],        // 16px
  			'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0' }],       // 18px
  			'xl': ['1.25rem', { lineHeight: '1.875rem', letterSpacing: '-0.01em' }], // 20px
  			'2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.015em' }],    // 24px
  			'3xl': ['1.875rem', { lineHeight: '2.375rem', letterSpacing: '-0.02em' }], // 30px
  			'4xl': ['2.25rem', { lineHeight: '2.75rem', letterSpacing: '-0.025em' }],  // 36px
  			'5xl': ['3rem', { lineHeight: '3.5rem', letterSpacing: '-0.03em' }],       // 48px
  			'6xl': ['3.75rem', { lineHeight: '4.25rem', letterSpacing: '-0.035em' }],  // 60px
  			'7xl': ['4.5rem', { lineHeight: '5rem', letterSpacing: '-0.04em' }],       // 72px
  		},
  		letterSpacing: {
  			tighter: '-0.04em',
  			tight: '-0.025em',
  			normal: '0',
  			wide: '0.025em',
  			wider: '0.05em',
  			widest: '0.1em',
  		},
  		lineHeight: {
  			none: '1',
  			tight: '1.25',
  			snug: '1.375',
  			normal: '1.5',
  			relaxed: '1.625',
  			loose: '2',
  		},
  		fontWeight: {
  			thin: '100',
  			extralight: '200',
  			light: '300',
  			normal: '400',
  			medium: '500',
  			semibold: '600',
  			bold: '700',
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			// MyDub.AI Official Brand Colors
  			'desert-gold': '#D6B572',
  			'ai-blue': '#438BFF',
  			'midnight-black': '#000000',
  			'pearl-white': '#FAFAFA',
  			'quartz-gray': '#888888',
  			'sand-beige': '#F5EFF3',

  			// Dubai Gold - Primary Brand Accent
  			// Use for: CTAs, highlights, premium features, accent borders
  			// Inspired by Dubai's gold souks and luxury heritage
  			'dubai-gold': {
  				50: '#FDFBF7',   // Lightest tint - backgrounds, hover states
  				100: '#FAF6ED',  // Very light - subtle backgrounds
  				200: '#F5EDD9',  // Light - cards, panels
  				300: '#EBD9B3',  // Medium light - borders, dividers
  				400: '#DFC58D',  // Medium - secondary accents
  				500: '#D4AF37',  // DEFAULT - Primary brand gold
  				600: '#C09E2F',  // Medium dark - hover states
  				700: '#A68628',  // Dark - active states
  				800: '#8C6E21',  // Darker - text on light backgrounds
  				900: '#6B541A',  // Darkest - shadows, deep accents
  				950: '#4D3C12',  // Ultra dark - rare use cases
  			},

  			// Legacy colors (keeping for compatibility)
  			obsidian: '#0F0F0F',
  			gold: {
  				DEFAULT: '#D4AF37', // Updated to Dubai Gold
  				light: '#EBD9B3',   // Maps to dubai-gold-300
  				dark: '#A68628'     // Maps to dubai-gold-700
  			},
  			pearl: '#FAFAFA', // Updated to match brand
  			violet: {
  				DEFAULT: '#438BFF', // Changed to AI blue
  				light: '#5B9AFF',
  				dark: '#2B6FCC'
  			},
  			// Shadcn UI Colors
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    require("tailwindcss-rtl"),
  ],
}

