# Akshit Pahade, portfolio

Single static page. No build step.

```
index.html            the site (HTML, CSS, JS in one file)
index-draft-v3.html   previous draft (tilted orbit, sticker-free), kept for reference
index-draft-v2.html   earlier spectacle draft
index-minimal.html    the first calm version
assets/*.jpg          app screenshots and placeholders
```

Libraries load from CDN at runtime: GSAP 3.13 (ScrollTrigger, SplitText), Lenis 1.3. The background is a raw WebGL fragment shader, no library.

## Run it locally

```
cd portfolio && python3 -m http.server 8000
```

Open http://localhost:8000. Fonts and CDN scripts need a network connection.

## Deploy

**GitHub Pages**: push this folder to a repo named `Akshit2807.github.io` (or any repo with Pages enabled on the root).

**Vercel**: `npx vercel` from this folder, accept the defaults.

## "Write to me" (no email shown on the page)

The nav pill and the hero button open a small form. Where it goes depends on one constant near the top of the script:

```js
const FORM_KEY = '';
```

- **Empty (default):** the form opens the visitor's mail app with the message pre-filled. The address is base64-encoded in the script and never rendered on the page.
- **With a Web3Forms key:** the message is posted to Web3Forms and lands in your inbox, nothing opens for the visitor. Get a free key at https://web3forms.com (enter your email, they mail you the key), paste it into `FORM_KEY`, done. The form has a honeypot field, so bots mostly bounce.

## Cool / warm toggle

The round badge at the bottom right ("make it warm" / "make it cool") and the sun/moon icon in the nav both switch the theme. Dark is the default. The choice is stored per visitor in localStorage.

## Replace the placeholder images

These files are labelled placeholders. Overwrite them with real screenshots at the same shape and the page picks them up, nothing else to change.

| File | What goes there | Size |
|---|---|---|
| `assets/ll1.jpg`, `assets/ll2.jpg` | LocalLegacy app screens | 406 x 900 (phone) |
| `assets/bh1.jpg`, `assets/bh2.jpg` | BuyHatke screens, once public | 406 x 900 (phone) |
| `assets/bo1.jpg` | BirthdayOdyssey site | 1400 x 875 (wide) |
| `assets/aw1.jpg` | API Watchdog dashboard | 1400 x 875 (wide) |

The LocalLegacy card in the work carousel currently shows an architecture diagram instead of screens. To swap in `ll1.jpg` and `ll2.jpg`, replace the `.arch` block inside that card with the same `.ph a` / `.ph c` markup the BuyHatke card uses.

## Editing

- Every fact on the page comes from the resume. Update both together.
- Design tokens (colours, fonts) are the two `:root` blocks at the top of the stylesheet, one per theme.
- The hero ring reads the `.sat` figures in order. Add or remove a figure and the spacing recalculates. Drag it with the mouse.
- The pixel avatar is the `SPR` array in the script (32 x 40). Each letter maps to a colour in `PAL`: `h`/`H` hair, `s`/`S`/`d` skin, `c`/`C`/`k` hoodie, `t`/`T` tee, `o` outline, `.` transparent. Edit it like ASCII art.
- Sound is off by default and stored per visitor in localStorage, same as the theme.
