# AAM blog image workflow

Rules for creating or replacing images under `content/posts/<slug>/`.
The authoritative content rules live in `docs/글-표준구조.md` (chapter 9). This file
is the operational detail for producing the files.

## Honesty rule — read this first

**Never present a generated image as a photograph of real work.** We do not have a
photo library yet, so most images are made rather than shot. A made image that shows
"a part we produced" turns the post into a claim about work that did not happen. This
is the same rule as "never invent numbers", and it matters more for images because
readers treat photographs as evidence.

The risk is highest next to results. If a section says "3 weeks became 2 days" and a
part photo sits beside it, readers read that part as the actual delivery. Do not place
generated imagery there.

## Four image types and where each is allowed

| Type | Allowed use | How it is made |
|---|---|---|
| **Diagram / schematic** | Anywhere. Preferred. | Inline SVG, authored directly |
| **Concept image** | Cover art, situation framing. Never captioned or positioned as a specific job. | Image generation |
| **Manufacturer official asset** | Machine and material explanation. AAM is an official Stratasys / Formlabs / UltiMaker partner. | Downloaded from official channels |
| **Real photograph** | Case studies. | Shot in-house; customer parts require prior consent |

Prefer diagrams. Process mechanics, method comparisons and decision criteria read
better as drawings than as photos, and a drawing cannot misrepresent a job that never
happened.

Give concept images a caption that states what they are (e.g. "설명을 위한 이미지입니다").
If a slot would read as a real delivery, leave it empty instead.

## Content guidance for generated images

1. Read the post markdown before choosing the subject. The image answers a specific
   sentence; if it answers nothing, do not make it.
2. Industrial visual language: 3D printers (FDM/SLA/SLS/PolyJet), printed parts,
   workshop and lab environments, clean facility lighting. Charcoal / cyan / white to
   match the AAM brand (`#015D75`, `#00A0C0`).
3. One clear focal subject that survives thumbnail size.
4. No titles, captions, readable document text, third-party logos, watermarks, split
   screens, or illustration-style clip art inside the image. Keep screens and labels
   blank or unreadable. Manufacturer trade dress appears only when the post is
   explicitly about that machine.
5. Inspect hands, machine detail, printed part geometry and background signage for
   malformed detail or unintended text. Regenerate or edit any failed image.

## File specification

```
content/posts/<slug>/
    <slug>.md
    1.webp        cover, 1200x630, WebP quality ~88
    1@480.webp    cover mobile, 480x252, WebP quality ~86
    2.webp ...    body images
```

- The cover **must** ship as both files. If `1@480.webp` is older than `1.webp`, the
  build refuses to emit the mobile variant.
- Derive the mobile file from the approved desktop file. Centered cover crop, never
  stretched.
- Body images need only one file when their width is 1200 or less.
- Reference body images as `/images/<slug>/2.webp`; set frontmatter `대표이미지` to
  `/images/<slug>/1.webp`.
- `public/images/` is generated at build time. Never edit it by hand.
- Verify every file exists, is WebP, matches the required dimensions and is non-empty.
  Report the final paths.
