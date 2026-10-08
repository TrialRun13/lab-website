# Lab Website

Static lab website built with [Jekyll](https://jekyllrb.com/) and hosted free on **GitHub Pages**.
All content lives in plain-text files (YAML + Markdown), so anyone in the lab can update it from the GitHub web editor — no coding needed.

## Repository structure

```
lab-website/
├── _config.yml              # Site title, URL, baseurl, GitHub repo name
├── _data/                   # ← ALL editable content lives here
│   ├── lab.yml              #   Lab name, tagline, about text, stats, contact, socials, job openings
│   ├── navigation.yml       #   Top menu items
│   ├── research.yml         #   Research areas (sticky-scroll section on the home page)
│   ├── stiffness.yml        #   Tissue / material stiffness ranges for the interactive explorer
│   ├── platforms.yml        #   "Materials toolbox" cards (hydrogels, fibres, dECM, ...)
│   ├── people.yml           #   PI, members (grouped), alumni
│   ├── publications.yml     #   Papers (auto-grouped by year, searchable)
│   └── gallery.yml          #   Gallery images + captions + categories
├── _posts/                  # News items — one Markdown file per post
│   └── _TEMPLATE.md         #   Copy this to create a news post
├── _layouts/                # Page templates (default, page, post)
├── _includes/               # Reusable pieces (header, footer, avatar, links, cards)
├── assets/
│   ├── css/main.css         # All styling — brand colours are at the top (:root)
│   ├── js/main.js           # Menu, animations, publication search, gallery lightbox
│   ├── img/                 # Images (people/, gallery/, research, hero)
│   ├── media/               # Hero / research videos (.mp4)
│   └── pdf/                 # Paper PDFs, posters
├── index.html               # Home: hero, about, stats, research, news, contact
├── people.html  publications.html  gallery.html  news.html  join-us.html  404.html
├── .github/workflows/pages.yml   # Auto-build + deploy on every push to main
├── Gemfile                  # Ruby dependencies
├── CONTRIBUTING.md          # Step-by-step editing guide for lab members
└── README.md
```

## One-time setup (admin, ~10 min)

1. **Create the repo**: GitHub → New repository → name it `lab-website` (or `<org>.github.io` for a root URL). Ideally create it under a **GitHub Organization** for the lab so ownership survives people leaving.
2. **Push the code**:
   ```bash
   cd lab-website
   git remote add origin https://github.com/<org>/lab-website.git
   git push -u origin main
   ```
3. **Enable Pages**: Repo → Settings → Pages → *Build and deployment* → Source: **GitHub Actions**.
4. **Edit `_config.yml`**: set `url`, `baseurl` and `github_repo`.

   | Hosted at | `url` | `baseurl` |
   |---|---|---|
   | `https://<org>.github.io/lab-website/` | `https://<org>.github.io` | `/lab-website` |
   | `https://<org>.github.io/` (repo named `<org>.github.io`) | `https://<org>.github.io` | `""` |
   | Custom domain e.g. `www.yourlab.org` | `https://www.yourlab.org` | `""` |

5. **Custom domain (optional)**: Settings → Pages → Custom domain → enter domain; add a `CNAME` DNS record pointing to `<org>.github.io`. Tick *Enforce HTTPS*.
6. **Add lab members**: Organization → People → Invite (role *Member*), then give the team **Write** access to the repo.
7. **Protect `main` (recommended)**: Settings → Branches → Add rule for `main` → *Require a pull request before merging* → *Require 1 approval*. Edits then go through a quick review and the site can't be broken by accident.

Every push/merge to `main` rebuilds and publishes the site in ~1 minute (watch progress in the **Actions** tab). Pull requests are built too, so a broken edit fails the check before merging.

## Run locally (optional)

Requires Ruby ≥ 3.0.

```bash
bundle install
bundle exec jekyll serve --livereload
# open http://localhost:4000/lab-website/
```

## Built-in effects

| Effect | Where | How to change / turn off |
|---|---|---|
| Light / dark mode toggle (circular reveal; remembers the visitor's choice, follows system setting by default) | Header ☀/☾ button | Colours for each mode: the two token blocks at the top of `assets/css/main.css` |
| Custom cursor: a migrating cell (nucleus, filopodia, focal adhesions) that reveals the fibre matrix around it, pulls fibres in, aligns them along its track and leaves a magenta remodelled trail that relaxes; it spreads on links, contracts on click, polarises up/down while scrolling, and shows labels ("View", "Read", "Bio") | All pages, mouse/trackpad only | `custom_cursor: false` in `_data/lab.yml`. Labels come from `data-cursor="..."` attributes |
| Crosslinked ECM fibre network: crimped fibres straighten and turn magenta under tension, buckle under compression; the cursor cell applies traction (click = stronger contraction); a wandering cell does it on touch screens | Home hero + "Join us" banners | Set `hero_video` or `hero_image` in `_data/lab.yml` to replace it |
| Page transitions: the screen polymerises into a crosslinked gel when leaving a page, then the gel is cleaved fibre by fibre ("MMP degradation") to reveal the next page | All internal links | `.ecm-curtain` in CSS / "Page transitions" in `main.js` |
| Collagen-bundle dividers that draw themselves in between sections; research images swap with a pore-opening reveal | Home, page headers | `_includes/fiber-divider.html` |
| Word-by-word headline reveal, scroll-lit About text, rotating "We study …" scramble | Headlines, Home | `rotating_words` in `_data/lab.yml` |
| Sticky-scroll research section (image swaps as you read) | Home | `_data/research.yml` |
| Matrix stiffness explorer: log-scale slider from 10 Pa to 100 GPa; the gel mesh densifies and the cell spreads and forms stress fibres on stiffer matrices; nearest tissue and matching materials light up | Home | `_data/stiffness.yml` (approximate ranges, edit freely) |
| Materials toolbox with animated line icons (hydrogel, fibres, dECM, nanopattern, bioprint, rheology) | Home | `_data/platforms.yml` |
| Keyword marquee, animated counters, section dots (scrollspy), scroll progress bar, back-to-top ring | Home / all pages | `keywords`, `stats` in `_data/lab.yml` |
| Spotlight glow + lift on cards, 3D tilt on images, magnetic buttons | Cards, buttons | `.spotlight`, `.tilt`, `data-magnetic` |
| Bio pop-ups, "You?" recruiting card | People | `bio:` per member, `show_you_card` in `_data/people.yml` |
| Search, filters, year jump, copy citation | Publications | `_data/publications.yml` |
| Filterable masonry + lightbox with ←/→ keys | Gallery | `_data/gallery.yml` |
| Timeline that fills as you scroll | News | `_posts/` |

All motion is disabled automatically for visitors with "Reduce motion" enabled in their OS.

## Customising the look

- **Colours / fonts**: top of `assets/css/main.css`: the light tokens in `:root`, the dark tokens in `:root[data-theme="dark"]` (`--accent`, `--accent-2`, `--ink`, fonts).
- **Hero video**: put an `.mp4` (≤ 10 MB, muted loop, 1080p) in `assets/media/` and set `hero_video` in `_data/lab.yml`.
- **Menu**: `_data/navigation.yml`.
- **Add a new page**: create `my-page.html` (or `.md`) with front matter:
  ```yaml
  ---
  layout: page
  title: Resources
  permalink: /resources/
  lede: Protocols, code and datasets.
  ---
  ```
  then add it to `_data/navigation.yml`.

## Large files

Keep images ≤ 1 MB (export JPG/WebP at ~1600 px wide) and videos ≤ 10–20 MB. GitHub rejects files > 100 MB; repos should stay < 1 GB. For bigger media, host on YouTube/Vimeo/Zenodo and link.
