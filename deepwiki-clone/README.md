# DeepWiki Clone

A React/Next.js recreation of the DeepWiki interface, featuring AI-powered code search and documentation with a clean split-panel design.

## Features

- **Split Panel Layout**: Clean interface with AI responses on the left and code snippets on the right
- **Dark Mode Support**: Seamless theme switching with persistence
- **Code Highlighting**: Syntax-highlighted code blocks with line numbers
- **Responsive Design**: Mobile-friendly interface
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Modern utility-first styling

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons (via SVG)
- **Font**: Inter (Google Fonts)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
deepwiki-clone/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Home page
│   └── search/           # Search pages
├── components/           # React components
│   ├── Header.tsx       # Navigation header
│   ├── ThemeProvider.tsx # Dark mode provider
│   ├── QueryDisplay.tsx  # Search query display
│   ├── SplitPanel.tsx   # Split layout container
│   ├── ResponsePanel.tsx # AI response panel
│   └── CodePanel.tsx    # Code snippets panel
└── ...
```

## Components

### Core Components

- **Header**: Navigation with logo, theme toggle, and share functionality
- **SplitPanel**: Responsive grid layout for the main content areas
- **QueryDisplay**: Shows the search query with copy link and navigation
- **ResponsePanel**: Renders markdown responses with copy functionality
- **CodePanel**: Displays collapsible code snippets with file references

### Features

- **Theme Provider**: Handles dark/light mode with local storage persistence
- **Query Navigation**: Repository context and breadcrumb navigation
- **Code References**: Clickable file:line references linking to GitHub
- **Copy Functionality**: Copy responses and query links to clipboard

## Design System

### Colors

- **Primary**: Orange accent (`#ef9541`)
- **Background**: White/Dark gray
- **Text**: Gray scale with proper contrast ratios
- **Code**: Light gray background with syntax highlighting

### Layout

- **Container**: Max-width responsive container
- **Grid**: CSS Grid for split panels
- **Spacing**: Consistent padding and margins using Tailwind
- **Typography**: Inter font with proper size scale

## Customization

### Adding New Features

1. Create components in the `components/` directory
2. Add pages in the `app/` directory following Next.js App Router conventions
3. Update types if needed (components are fully typed)

### Styling

- Use Tailwind utility classes for styling
- Custom CSS in `globals.css` for global styles
- Theme colors defined in `tailwind.config.ts`

### API Integration

To integrate with a real backend:

1. Replace mock data in search pages
2. Add API routes in `app/api/`
3. Implement data fetching with proper loading states

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details