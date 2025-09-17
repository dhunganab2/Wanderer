import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'display': ['Manrope', 'system-ui', 'sans-serif'],
				'body': ['Inter', 'system-ui', 'sans-serif'],
			},
			colors: {
				/* Enhanced Wander Color System */
				'sunrise-coral': {
					50: 'hsl(var(--sunrise-coral-50))',
					100: 'hsl(var(--sunrise-coral-100))',
					200: 'hsl(var(--sunrise-coral-200))',
					300: 'hsl(var(--sunrise-coral-300))',
					400: 'hsl(var(--sunrise-coral-400))',
					500: 'hsl(var(--sunrise-coral-500))',
					600: 'hsl(var(--sunrise-coral-600))',
					700: 'hsl(var(--sunrise-coral-700))',
					800: 'hsl(var(--sunrise-coral-800))',
					900: 'hsl(var(--sunrise-coral-900))',
					DEFAULT: 'hsl(var(--sunrise-coral))',
					soft: 'hsl(var(--sunrise-coral-soft))',
					dark: 'hsl(var(--sunrise-coral-dark))',
					light: 'hsl(var(--sunrise-coral-light))',
				},
				'midnight-blue': {
					50: 'hsl(var(--midnight-blue-50))',
					100: 'hsl(var(--midnight-blue-100))',
					200: 'hsl(var(--midnight-blue-200))',
					300: 'hsl(var(--midnight-blue-300))',
					400: 'hsl(var(--midnight-blue-400))',
					500: 'hsl(var(--midnight-blue-500))',
					600: 'hsl(var(--midnight-blue-600))',
					700: 'hsl(var(--midnight-blue-700))',
					800: 'hsl(var(--midnight-blue-800))',
					900: 'hsl(var(--midnight-blue-900))',
					DEFAULT: 'hsl(var(--midnight-blue))',
					light: 'hsl(var(--midnight-blue-light))',
					soft: 'hsl(var(--midnight-blue-soft))',
					extralight: 'hsl(var(--midnight-blue-extralight))',
				},
				'warm-gray': {
					50: 'hsl(var(--warm-gray-50))',
					100: 'hsl(var(--warm-gray-100))',
					200: 'hsl(var(--warm-gray-200))',
					300: 'hsl(var(--warm-gray-300))',
					400: 'hsl(var(--warm-gray-400))',
					500: 'hsl(var(--warm-gray-500))',
					600: 'hsl(var(--warm-gray-600))',
					700: 'hsl(var(--warm-gray-700))',
				},
				'cloud-white': 'hsl(var(--cloud-white))',
				'charcoal': 'hsl(var(--charcoal))',
				'forest-green': {
					50: 'hsl(var(--forest-green-50))',
					100: 'hsl(var(--forest-green-100))',
					200: 'hsl(var(--forest-green-200))',
					300: 'hsl(var(--forest-green-300))',
					400: 'hsl(var(--forest-green-400))',
					500: 'hsl(var(--forest-green-500))',
					600: 'hsl(var(--forest-green-600))',
					700: 'hsl(var(--forest-green-700))',
					800: 'hsl(var(--forest-green-800))',
					900: 'hsl(var(--forest-green-900))',
					DEFAULT: 'hsl(var(--forest-green))',
				},
				'sky-blue': {
					50: 'hsl(var(--sky-blue-50))',
					100: 'hsl(var(--sky-blue-100))',
					200: 'hsl(var(--sky-blue-200))',
					300: 'hsl(var(--sky-blue-300))',
					400: 'hsl(var(--sky-blue-400))',
					500: 'hsl(var(--sky-blue-500))',
					600: 'hsl(var(--sky-blue-600))',
					700: 'hsl(var(--sky-blue-700))',
					800: 'hsl(var(--sky-blue-800))',
					900: 'hsl(var(--sky-blue-900))',
					DEFAULT: 'hsl(var(--sky-blue))',
				},
				'warm-amber': {
					50: 'hsl(var(--warm-amber-50))',
					100: 'hsl(var(--warm-amber-100))',
					200: 'hsl(var(--warm-amber-200))',
					300: 'hsl(var(--warm-amber-300))',
					400: 'hsl(var(--warm-amber-400))',
					500: 'hsl(var(--warm-amber-500))',
					600: 'hsl(var(--warm-amber-600))',
					700: 'hsl(var(--warm-amber-700))',
					800: 'hsl(var(--warm-amber-800))',
					900: 'hsl(var(--warm-amber-900))',
					DEFAULT: 'hsl(var(--warm-amber))',
				},
				'sunset-pink': {
					50: 'hsl(var(--sunset-pink-50))',
					100: 'hsl(var(--sunset-pink-100))',
					200: 'hsl(var(--sunset-pink-200))',
					300: 'hsl(var(--sunset-pink-300))',
					400: 'hsl(var(--sunset-pink-400))',
					500: 'hsl(var(--sunset-pink-500))',
					600: 'hsl(var(--sunset-pink-600))',
					700: 'hsl(var(--sunset-pink-700))',
					800: 'hsl(var(--sunset-pink-800))',
					900: 'hsl(var(--sunset-pink-900))',
					DEFAULT: 'hsl(var(--sunset-pink))',
				},
				'ocean-teal': {
					50: 'hsl(var(--ocean-teal-50))',
					100: 'hsl(var(--ocean-teal-100))',
					200: 'hsl(var(--ocean-teal-200))',
					300: 'hsl(var(--ocean-teal-300))',
					400: 'hsl(var(--ocean-teal-400))',
					500: 'hsl(var(--ocean-teal-500))',
					600: 'hsl(var(--ocean-teal-600))',
					700: 'hsl(var(--ocean-teal-700))',
					800: 'hsl(var(--ocean-teal-800))',
					900: 'hsl(var(--ocean-teal-900))',
					DEFAULT: 'hsl(var(--ocean-teal))',
				},
				
				/* Semantic Tokens */
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
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				xl: 'var(--radius-lg)',
				'2xl': 'var(--radius-xl)',
			},
			boxShadow: {
				'soft': 'var(--shadow-soft)',
				'medium': 'var(--shadow-medium)',
				'strong': 'var(--shadow-strong)',
				'glow': 'var(--shadow-glow)',
				'elevation': 'var(--shadow-elevation)',
			},
			backgroundImage: {
				'gradient-sunrise': 'var(--gradient-sunrise)',
				'gradient-ocean': 'var(--gradient-ocean)',
				'gradient-glass': 'var(--gradient-glass)',
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
				},
				'fadeUp': {
					'0%': {
						opacity: '0',
						transform: 'translateY(30px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'fadeIn': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'scaleIn': {
					'0%': {
						opacity: '0',
						transform: 'scale(0.95)'
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1)'
					}
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-up': 'fadeUp 0.6s ease-out',
				'fade-in': 'fadeIn 0.4s ease-out',
				'scale-in': 'scaleIn 0.3s ease-out',
				'float': 'float 6s ease-in-out infinite',
				'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
				'slide-down': 'slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
				'slide-left': 'slideLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
				'slide-right': 'slideRight 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
				'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
				'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'wiggle': 'wiggle 1s ease-in-out infinite',
				'glow': 'glow 2s ease-in-out infinite alternate',
				'rotate-slow': 'rotateSlow 20s linear infinite',
				'rotate-reverse': 'rotateReverse 15s linear infinite',
				'scale-pulse': 'scalePulse 2s ease-in-out infinite',
				'typing': 'typing 3.5s steps(40, end), blink-caret 0.75s step-end infinite',
				'gradient-shift': 'gradient-shift 3s ease infinite',
				'morphing': 'morphing 8s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
