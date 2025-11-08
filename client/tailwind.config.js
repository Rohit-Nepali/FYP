/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: Update this to include the paths to all files that contain Nativewind classes.
    content: [
        './App.{js,jsx,ts,tsx}',
        './src/**/*.{js,jsx,ts,tsx}',
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                // Background colors
                'bg-primary': '#0B0F14',
                'bg-secondary': '#111827',
                // Text colors
                'text-primary': '#FFFFFF',
                'text-secondary': '#E5E7EB',
                'text-tertiary': '#9CA3AF',
                'text-muted': '#6B7280',
                'text-link': '#93C5FD',
                // Input colors
                'input-bg': '#1F2937',
                'input-border': '#374151',
                'input-placeholder': '#6B7280',
                'input-icon': '#9CA3AF',
                // Button colors
                'btn-primary': '#2563EB',
                'btn-secondary-bg': '#1F2937',
                'btn-secondary-border': '#374151',
                // Border colors
                'border-primary': 'rgba(255, 255, 255, 0.1)',
                'border-secondary': 'rgba(255, 255, 255, 0.05)',
                // Status colors
                'status-success': '#10B981',
                'status-error': '#EF4444',
                'status-warning': '#F59E0B',
                'status-info': '#3B82F6',
            },
        },
    },
    plugins: [],
}