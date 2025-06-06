# Static Images Directory

This directory contains all static images used throughout the application.

## Guidelines

1. **Image Formats**
   - Use `.webp` format when possible for better performance
   - Use `.png` for images requiring transparency
   - Use `.jpg` for photographs
   - Use `.svg` for icons and logos that need to scale

2. **File Naming**
   - Use lowercase letters
   - Use hyphens (-) instead of spaces
   - Use descriptive names (e.g., `hero-banner.webp`, `profile-placeholder.png`)

3. **Organization**
   - Place icons in an `/icons` subdirectory
   - Place user uploads in an `/uploads` subdirectory
   - Place UI elements in a `/ui` subdirectory

4. **Image Optimization**
   - Compress images before adding them
   - Keep file sizes as small as possible while maintaining quality
   - Consider providing multiple sizes for responsive images

5. **Usage in Code**
   ```jsx
   import Image from 'next/image'
   
   // Use like this:
   <Image
     src="/images/your-image.webp"
     alt="Description of image"
     width={500}
     height={300}
   />
   ```

## Directory Structure
```
public/images/
├── icons/        # For SVG and small icon files
├── ui/           # For UI elements like backgrounds, buttons
└── uploads/      # For user-generated content
``` 