---
permalink: 'modern-css-techniques'
title: 'Modern CSS Techniques for Responsive Design'
authors: ['emily-rodriguez']
published: 'published'
tags: ['css', 'design', 'responsive']
publishedDate: 2024-02-20
heroImage: '/src/assets/backgrounds/anna-magenta-YELG0ZVK5yw-unsplash.jpg'
---

# Modern CSS Techniques for Responsive Design

CSS has evolved significantly in recent years, giving developers powerful tools for creating responsive, beautiful websites without relying on frameworks.

## Container Queries

Container queries allow components to adapt based on their container's size, not just the viewport:

```css
.card-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}
```

## CSS Grid for Layouts

CSS Grid makes complex layouts simple and maintainable:

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
```

## Custom Properties for Theming

CSS custom properties enable dynamic theming:

```css
:root {
  --primary-color: #3b82f6;
  --spacing-unit: 8px;
}

.button {
  background: var(--primary-color);
  padding: calc(var(--spacing-unit) * 2);
}
```

## Conclusion

These modern CSS features enable more maintainable, performant, and flexible designs. Embrace them in your next project!
