# AAM blog thumbnail workflow

Apply these rules whenever creating or replacing images under `content/posts/<slug>/`.

1. Read the corresponding post Markdown file and any article URL supplied by the user before choosing the scene.
2. Use premium photorealistic industrial photography: real 3D printers (FDM/SLA/SLS/PolyJet), printed parts, workshop and lab environments, clean studio or facility lighting, charcoal/cyan/white palette matching the AAM brand.
3. Make the article's practical subject obvious at thumbnail size through one clear focal object or action (a part being removed from the build plate, a resin tank being filled, a caliper measuring a printed part). Do not add decorative metaphors when a realistic scene can communicate the subject.
4. Do not place titles, captions, readable document text, third-party logos, watermarks, split screens, or illustration-style graphics inside the image. Keep screens and labels blank or unreadable. Manufacturer trade dress may appear only when the post is explicitly about that machine.
5. Check hands, machine details, printed parts, and background signage for malformed details or unintended readable text. Regenerate or edit any failed image before saving it.
6. Save the desktop image as `content/posts/<slug>/1.webp` at exactly 1200x630 pixels, WebP quality about 88.
7. Always derive the mobile image from the approved desktop image and save it beside the desktop image as `content/posts/<slug>/1@480.webp` at exactly 480x252 pixels, WebP quality about 86.
8. Preserve the original aspect ratio with a centered cover crop. Do not stretch either image.
9. Verify both files exist, are WebP, have the required dimensions, and are non-empty. Report both final paths to the user.
