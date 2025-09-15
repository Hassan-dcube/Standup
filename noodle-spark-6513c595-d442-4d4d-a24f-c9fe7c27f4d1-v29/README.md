# Noodle Project Template (Version 0)

This template serves as a starting point for AI-generated React applications. It's designed to be minimal while providing examples of how to use various UI libraries and utilities.

## Template Structure

```
version-0/
├── index.tsx               # Entry point with provider examples
├── README.md               # This documentation
├── src/
│   ├── App.tsx             # Main component with import examples
│   ├── style.css           # Base styling and CSS variables
│   ├── lib/
│   │   └── utils.ts        # Utility functions
│   └── components/
│       ├── ui/             # UI component examples
│       │   ├── button.tsx
│       │   └── dialog.tsx
│       └── examples/       # Feature implementation examples
│           ├── charts-example.tsx
│           ├── drag-drop-example.tsx
│           └── routing-example.tsx
```

## Available Libraries

This template provides import examples and usage patterns for the following libraries:

### UI Components (Radix UI)
- `@radix-ui/react-alert-dialog`: Confirmation dialogs
- `@radix-ui/react-avatar`: User avatars
- `@radix-ui/react-checkbox`: Form checkboxes
- `@radix-ui/react-collapsible`: Expandable content sections
- `@radix-ui/react-context-menu`: Right-click context menus
- `@radix-ui/react-dialog`: Modal dialogs
- `@radix-ui/react-dropdown-menu`: Dropdown menus
- `@radix-ui/react-hover-card`: Hover information cards
- `@radix-ui/react-label`: Form labels
- `@radix-ui/react-menubar`: Application menu bars
- `@radix-ui/react-navigation-menu`: Navigation menus
- `@radix-ui/react-popover`: Popover components
- `@radix-ui/react-progress`: Progress indicators
- `@radix-ui/react-radio-group`: Radio button groups
- `@radix-ui/react-scroll-area`: Custom scrollable areas
- `@radix-ui/react-select`: Dropdown select components
- `@radix-ui/react-separator`: Visual separators
- `@radix-ui/react-slider`: Range sliders
- `@radix-ui/react-slot`: Component composition
- `@radix-ui/react-switch`: Toggle switches
- `@radix-ui/react-tabs`: Tabbed interfaces
- `@radix-ui/react-toast`: Toast notifications
- `@radix-ui/react-toggle`: Toggle buttons
- `@radix-ui/react-tooltip`: Tooltips

### Icons and UI Utilities
- `@heroicons/react`: Icon library from Tailwind
- `lucide-react`: Another icon library
- `clsx`: Utility for constructing class names

### Content and Formatting
- `react-markdown`: Markdown rendering

### Routing
- `react-router-dom`: Client-side routing

### Data Visualization
- `recharts`: Chart library for React

### Drag and Drop
- `react-dnd`: Drag and drop for React
- `react-dnd-html5-backend`: HTML5 backend for react-dnd

### Animation
- `framer-motion`: Animation library

## How to Use This Template

The template is structured to be a minimal starting point that the AI can extend based on specific requirements. Key features:

1. **Commented Imports**: App.tsx contains commented imports for all available libraries
2. **CSS Variables**: style.css includes CSS variables for consistent theming
3. **Component Examples**: The components/ui directory contains commented examples of Radix UI components
4. **Feature Examples**: The components/examples directory shows how to implement common patterns

To use this template:

1. Uncomment and customize imports as needed
2. Use the CSS variables for consistent styling
3. Reference the component examples when building UI components
4. Look at the feature examples for patterns to implement specific functionality

## CSS Variables

The template includes CSS variables in style.css for consistent theming:

- Colors (primary, secondary, background, etc.)
- Spacing values
- Border radius values
- Typography settings
- Shadows
- Animation timings

Use these variables to maintain a consistent look and feel across your application.
