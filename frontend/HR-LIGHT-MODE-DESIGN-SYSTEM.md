# HR Panel Light Mode Design System

## Quick Reference Guide for Consistent Theming

---

## 🎨 Color Classes to Use

### Backgrounds

#### Page/Main Background
```tsx
className="bg-background"  // Pure white
```

#### Cards & Sections
```tsx
className="bg-card border border-border"  // White with light border
className="bg-secondary"  // Very light gray background
```

#### Inputs
```tsx
className="bg-background border border-border"  // White with dark text
```

#### Table Headers
```tsx
className="bg-secondary border-b border-border"  // Light gray header
```

#### Hover States
```tsx
className="hover:bg-secondary/30"  // Row hover
className="hover:bg-secondary/50"  // Button hover
```

---

## 📝 Text Colors

### Primary Text
```tsx
className="text-foreground"  // Near-black, main text
```

### Card/Component Text
```tsx
className="text-card-foreground"  // Dark text on cards
```

### Secondary/Muted Text
```tsx
className="text-muted-foreground"  // Medium gray, labels
```

### Headings
```tsx
className="text-foreground font-bold"  // Always dark
```

---

## 🖼️ Component Patterns

### Standard Card
```tsx
<div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
  <h2 className="text-lg font-bold text-foreground">Title</h2>
  <p className="text-sm text-muted-foreground">Description</p>
</div>
```

### Input Field
```tsx
<input
  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500"
  placeholder="Enter value..."
/>
```

### Select Dropdown
```tsx
<select className="bg-background border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-blue-500">
  <option value="">Select...</option>
</select>
```

### Table
```tsx
<table className="w-full">
  <thead>
    <tr className="bg-secondary border-b border-border">
      <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase">
        Header
      </th>
    </tr>
  </thead>
  <tbody className="divide-y divide-border">
    <tr className="hover:bg-secondary/30 transition-colors">
      <td className="px-6 py-4 text-sm text-foreground">Data</td>
    </tr>
  </tbody>
</table>
```

### Modal/Drawer
```tsx
<div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50">
  <div className="bg-card border border-border rounded-2xl shadow-2xl">
    <div className="sticky top-0 bg-card border-b border-border px-6 py-4">
      <h2 className="text-xl font-bold text-foreground">Modal Title</h2>
    </div>
    <div className="p-6">
      {/* Modal content */}
    </div>
  </div>
</div>
```

### Button (Primary)
```tsx
<button className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-foreground rounded-xl text-sm font-semibold transition-all shadow-md">
  Submit
</button>
```

### Button (Secondary)
```tsx
<button className="px-4 py-2.5 bg-secondary hover:bg-secondary/50 text-foreground rounded-xl text-sm font-semibold transition-colors border border-border">
  Cancel
</button>
```

### Status Badge
```tsx
<span className="px-2 py-0.5 rounded text-xs font-bold border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
  Active
</span>
```

---

## ❌ Classes to AVOID in HR Panel

### Never Use These
```tsx
// Dark backgrounds
bg-neutral-950, bg-neutral-900, bg-neutral-850, bg-neutral-800
bg-black, bg-gray-900, bg-zinc-900, bg-slate-900

// Dark borders  
border-neutral-850, border-neutral-800, border-gray-800

// Light text (except on colored backgrounds)
text-white, text-neutral-200, text-neutral-300

// Dark hover states
hover:bg-neutral-800, hover:bg-gray-800

// Dark prose
prose-invert (use just 'prose')
```

---

## ✅ Migration Checklist

When creating/updating HR components:

- [ ] Page background is white/light (`bg-background`)
- [ ] Cards use `bg-card border border-border`
- [ ] Inputs use `bg-background` (NOT `bg-card`)
- [ ] Tables have light headers (`bg-secondary`)
- [ ] All headings use `text-foreground`
- [ ] Labels use `text-muted-foreground`
- [ ] Borders use `border-border`
- [ ] Hover states use `/30` or `/50` opacity
- [ ] Modals have light backgrounds
- [ ] No hardcoded `neutral-8xx` or `neutral-9xx` colors
- [ ] No `text-white` on normal backgrounds

---

## 🎯 Design Principles

1. **Consistency**: All HR pages should look like they belong to the same app
2. **Contrast**: Ensure text is always readable (dark on light)
3. **Hierarchy**: Use text colors to show importance (foreground > card-foreground > muted-foreground)
4. **Subtlety**: Use soft borders and shadows, not heavy dark borders
5. **States**: Hover and focus states should be noticeable but not jarring

---

## 💡 Quick Fixes

### Dark card → Light card
```tsx
// Before
<div className="bg-neutral-900 border-neutral-800">

// After  
<div className="bg-card border-border">
```

### Dark input → Light input
```tsx
// Before
<input className="bg-card border-neutral-800 text-white" />

// After
<input className="bg-background border-border text-foreground" />
```

### Dark table → Light table
```tsx
// Before
<thead className="bg-neutral-900 border-neutral-850">

// After
<thead className="bg-secondary border-border">
```

### Dark text → Readable text
```tsx
// Before
<p className="text-neutral-200">Label</p>

// After
<p className="text-muted-foreground">Label</p>
```

---

## 📚 Complete Theme Variables

From `globals.css`:

```css
:root {
  --background: 0 0% 100%;           /* #ffffff - Pure white */
  --foreground: 0 0% 9%;             /* #171717 - Near black */
  --card: 0 0% 100%;                 /* #ffffff - White */
  --card-foreground: 0 0% 9%;        /* #171717 - Dark text */
  --secondary: 210 40% 96.1%;        /* #f0f4f8 - Light gray */
  --secondary-foreground: 0 0% 9%;   /* #171717 - Dark text */
  --muted-foreground: 0 0% 40%;      /* #666666 - Medium gray */
  --border: 214.3 31.8% 91.4%;       /* #e5e7eb - Light border */
  --input: 214.3 31.8% 91.4%;        /* #e5e7eb - Input border */
}
```

Access via:
- `bg-background` / `hsl(var(--background))`
- `text-foreground` / `hsl(var(--foreground))`
- `bg-card` / `hsl(var(--card))`
- etc.

---

**Remember**: The HR panel is LIGHT MODE ONLY. All components should be designed with light backgrounds and dark text for optimal readability.
