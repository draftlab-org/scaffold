# Draftlab Scaffold

A modern, content-focused web template built with Astro v5, Tailwind CSS v4, and React v19. This scaffold provides a flexible page-building system with reusable components, type-safe content collections, and an integrated headless CMS.

## Installation

Create a new project using this template:

```sh
npx create-astro --template draftlab-org/scaffold
cd your-project-name
npm install
npm run dev
```

Or clone and install manually:

```sh
git clone https://github.com/draftlab-org/scaffold.git
cd scaffold
npm install
npm run dev
```

## Stack

The template combines Astro v5 for static site generation with Tailwind CSS v4 for styling and React v19 for interactive components. Content is managed through Astro's type-safe content collections with Pages CMS providing a visual editing interface. The build includes automatic image optimization and is preconfigured for Netlify deployment.

## Architecture

### Component System

We are following atomic design principles described by Brad Frost (https://atomicdesign.bradfrost.com/chapter-2/) to make it easier to manage our components:

![](https://atomicdesign.bradfrost.com/images/content/atomic-design-process.png)

Components are organized from simple to complex in `src/components/`. Atoms like Button and Image are basic building blocks. Molecules combine atoms into simple patterns like Card. Organisms such as Hero and Navigation are complex, standalone components. Sections are full-width page blocks that combine organisms and molecules into complete interface sections.

### Development Utilities

The `DevOnly` component and `devClass` utility help manage development-only UI elements. Wrap any content in `<DevOnly>` to remove it from production builds. Use `devClass('classes')` to apply Tailwind classes only in development.

```astro
import DevOnly from '@components/atoms/DevOnly.astro'; import {devClass} from '@utils/dev';

<DevOnly><span>Debug info</span></DevOnly>
<div class={`base ${devClass('border-2 border-red-500')}`}></div>
```

### Content Collections

Content lives in `src/content/` with schemas defined in `config.ts`. The Pages collection uses YAML files where each file becomes a route. Pages contain a sections array that you can populate with any combination of Hero, RichText, Card, People, or Partners sections. The People collection stores team member information as individual JSON files.

Images use absolute paths from the project root (`/src/assets/...`) for consistency. The image() helper in content collections automatically resolves and optimizes these at build time.

### Page Building

The dynamic route at `src/pages/[...slug].astro` renders pages from the Pages collection. Each page is assembled from sections in the order they appear in the YAML file. To create a new page, add a YAML file to `src/content/pages/` and the route appears automatically.

Section types are defined as a discriminated union in the content schema. Each section has its own structure and corresponding component in `src/components/sections/`. Hero sections display prominent titles, Rich text sections render markdown, Card sections show grids with optional images and buttons, People sections display team members, and Partners sections showcase logos with links.

## Content Management

### Pages CMS

The template includes a complete configuration for Pages CMS in `.pages.yml`. This provides a visual interface for editing content without code.

Access the CMS by logging into https://app.pagescms.org with your Github profile (the project repository must be hosted on Github).

The interface lets you add, edit, and reorder page sections with a drag-and-drop builder. All components include validation and helpful descriptions.

### Extending

To add new section types, update the schema in `src/content/config.ts`, create a component in `src/components/sections/`, and add the configuration to `.pages.yml`. The dynamic page route supports new sections automatically.

## Commands

```sh
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
```

## Project Structure

```
src/
├── assets/          # Images and media
├── components/
│   ├── atoms/       # Basic elements (Button, Image, Link, DevOnly)
│   ├── molecules/   # Simple combinations (Card, NavItem)
│   ├── organisms/   # Complex components (Hero, Person, Footer)
│   └── sections/    # Page sections (HeroSection, CardSection, etc.)
├── content/
│   ├── pages/       # Page definitions (YAML)
│   ├── people/      # Team members (JSON)
│   └── config.ts    # Content schemas with Zod validation
├── layouts/
│   ├── BaseLayout.astro   # Document wrapper
│   └── PageLayout.astro   # Page structure with header/footer
├── pages/
│   ├── [...slug].astro    # Dynamic page renderer
│   ├── people/
│   │   ├── index.astro    # People directory
│   │   └── [id].astro     # Individual profiles
│   └── index.astro
├── utils/
│   └── dev.ts             # Development utilities
└── styles/
    ├── global.css         # Base imports
    ├── typography.css     # Text utilities
    ├── colors.css         # Color definitions
    └── breakpoints.css    # Responsive breakpoints
```

## Customization

Tailwind CSS v4 uses @theme definitions in the style files. Update `src/styles/colors.css` for color schemes and `src/styles/typography.css` for text sizing. Components follow atomic design hierarchy, so start with atoms and compose upward when building new features.

BaseLayout handles document-level concerns while PageLayout adds header, footer, and content structure. Create specialized layouts by extending these base layouts.

## Learn More

- [Astro Documentation](https://docs.astro.build)
- [Tailwind CSS v4 Docs](https://tailwindcss.com)
- [Pages CMS Docs](https://pagescms.org/docs)
- [Atomic Design Principles](https://atomicdesign.bradfrost.com/chapter-2/)
