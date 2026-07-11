import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/app/**/*.{ts,tsx}',
    '../../packages/pages/**/*.{ts,tsx}',
    '../../packages/widgets/**/*.{ts,tsx}',
    '../../packages/entities/**/*.{ts,tsx}',
    '../../packages/features/auth/**/*.{ts,tsx}',
    '../../packages/features/cars/**/*.{ts,tsx}',
    '../../packages/features/chat/**/*.{ts,tsx}',
    '../../packages/features/dashboard/**/*.{ts,tsx}',
    '../../packages/features/drivers/**/*.{ts,tsx}',
    '../../packages/features/gis/**/*.{ts,tsx}',
    '../../packages/features/locations/**/*.{ts,tsx}',
    '../../packages/features/my-cars/**/*.{ts,tsx}',
    '../../packages/features/my-orders/**/*.{ts,tsx}',
    '../../packages/features/my-profile/**/*.{ts,tsx}',
    '../../packages/features/my-rides/**/*.{ts,tsx}',
    '../../packages/features/notifications/**/*.{ts,tsx}',
    '../../packages/features/orders/**/*.{ts,tsx}',
    '../../packages/features/routes/**/*.{ts,tsx}',
    '../../packages/features/services/**/*.{ts,tsx}',
    '../../packages/features/sheet/**/*.{ts,tsx}',
    '../../packages/features/tariffs/**/*.{ts,tsx}',
    '../../packages/features/user-orders/**/*.{ts,tsx}',
    '../../packages/features/user-rides/**/*.{ts,tsx}',
    '../../packages/features/users/**/*.{ts,tsx}',
    '../../packages/server/**/*.{ts,tsx}',
    '../../packages/shared/**/*.{ts,tsx}'
  ],
  prefix: '',
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
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
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
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
  plugins: [tailwindcssAnimate],
};

export default config;
