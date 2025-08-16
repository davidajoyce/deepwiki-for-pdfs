# DeepWiki UI Architecture Analysis

## Overview
DeepWiki is a Next.js-based application that provides an AI-powered code search and documentation interface. The UI features a split-panel design with search results on the left and code snippets on the right.

## Technology Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS with custom utility classes
- **Font System**: Geist Sans font family
- **API**: Backend API at `api.devin.ai/ada/query/`

## Key UI Components

### 1. Layout Structure
```
- Main container: Flexbox column layout
- Split view: CSS Grid with scrollable panels
- Responsive design with container classes
```

### 2. Color Scheme & Styling
- **Background**: Custom `bg-background` and `bg-main` classes
- **Text Colors**: 
  - Primary content: `text-[#cbcbcb]`
  - Secondary: `text-neutral-400`, `text-gray-400`
  - Accents: `text-[#ef9541]` (orange highlights)
- **Code Blocks**:
  - Background: `bg-[#e5e5e5]` (light mode)
  - Dark mode variant: `dark:bg-[#484848]/30`
  - Monospace font with rounded corners

### 3. Component Patterns

#### Header Navigation
- Fixed header with logo and navigation links
- "Get free private DeepWikis with Devin" promotional banner
- Dark mode toggle button
- Share functionality

#### Search/Query Display
- Query text displayed prominently
- "Copy link to query" button
- "return to [repo]" navigation link
- Performance indicator ("Fast" badge)
- "Go deeper" action button

#### Content Area (Left Panel)
- Markdown-rendered response
- Hierarchical headings (h2, h3)
- Code snippets with syntax highlighting
- Clickable file references (e.g., "README.md:41")
- Bullet lists for feature descriptions
- Copy/Share buttons for responses

#### Code Display (Right Panel)
- Multiple collapsible code sections
- File path breadcrumbs with GitHub links
- Line numbers
- Syntax-highlighted code
- Expand/collapse buttons
- Scrollable code containers

### 4. Interactive Elements
- **Hover Effects**: `transition-all duration-300 group-hover:w-full`
- **Buttons**: Rounded corners, icon + text combinations
- **Links**: Underline animations on hover
- **Code References**: Clickable with file:line format

### 5. Layout Features
- **Grid System**: `grid overflow-auto scroll-smooth`
- **Scrollbar Customization**: `scrollbar-hide` class
- **Responsive Breakpoints**: Using Tailwind's responsive prefixes
- **Overflow Handling**: Multiple overflow strategies for different content types

## API Integration
- **Query Endpoint**: `GET https://api.devin.ai/ada/query/{query_id}`
- **Response Format**: Returns markdown content with code references
- **Real-time Updates**: Appears to load content dynamically

## React Component Structure (Inferred)

```jsx
// Main Layout
<Layout>
  <Header />
  <MainContent>
    <SplitView>
      <LeftPanel>
        <QueryDisplay />
        <ResponseContent />
      </LeftPanel>
      <RightPanel>
        <CodeSnippets />
      </RightPanel>
    </SplitView>
  </MainContent>
</Layout>
```

## Key Features to Implement

1. **Split Panel Layout**
   - Resizable panels (though resize handle not visible)
   - Independent scrolling for each panel
   - Responsive grid system

2. **Search Flow**
   - Query display with copy functionality
   - Loading states (Fast/Slow indicators)
   - Progressive content loading

3. **Code Display**
   - Collapsible code sections
   - Line numbers
   - Syntax highlighting
   - File path navigation

4. **Navigation**
   - Repository context awareness
   - Breadcrumb navigation
   - Quick return to repository

5. **Theming**
   - Dark/Light mode support
   - Custom color variables
   - Consistent styling across components

## Implementation Recommendations

### For React Recreation:

1. **State Management**
   - Query state (loading, results, error)
   - Panel visibility/collapse state
   - Theme preference
   - Code section expand/collapse

2. **Components Needed**
   - `SearchInterface` - Main search component
   - `ResponsePanel` - Left panel with markdown
   - `CodePanel` - Right panel with code snippets
   - `CodeBlock` - Individual code display component
   - `Header` - Navigation and actions
   - `QueryBar` - Query display with actions

3. **Styling Approach**
   - Use Tailwind CSS for consistency
   - Custom CSS for scrollbar hiding
   - CSS Grid for split layout
   - Flexbox for component layouts

4. **Data Flow**
   - Fetch query results from API
   - Parse markdown response
   - Extract code references
   - Display in synchronized panels

5. **Performance Considerations**
   - Lazy load code sections
   - Virtual scrolling for long code files
   - Memoize expensive computations
   - Optimize re-renders with React.memo

## CSS Classes to Replicate

```css
/* Custom utility classes */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Gradient effects */
.powered-by-devin-gradient {
  /* Custom gradient implementation */
}

/* Font variables */
.__variable_5cfdac { /* Geist Sans font */ }
.__variable_9a8899 { /* Additional font variant */ }
```

## Next Steps for Implementation

1. Set up Next.js project with App Router
2. Install and configure Tailwind CSS
3. Create component structure
4. Implement API integration
5. Add interactive features
6. Style with Tailwind utilities
7. Add dark mode support
8. Optimize performance