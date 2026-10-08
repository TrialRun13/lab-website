# Editing the lab website

No installation needed — everything can be done in the browser on GitHub.

## The 60-second workflow

1. Open the file on GitHub (e.g. `_data/people.yml`) → click the ✏️ pencil icon.
2. Make your change.
3. Click **Commit changes…** → choose **Create a new branch and start a pull request** → **Propose changes** → **Create pull request**.
4. Wait for the green ✅ check (the site builds successfully), ask a labmate to approve, then **Merge**.
5. The live site updates ~1 minute later.

> YAML is indentation-sensitive: use **spaces, never tabs**, and keep the same indentation as the block you copied. Wrap text containing `:` or `#` in `"quotes"`.

## Common tasks

| I want to… | Edit | How |
|---|---|---|
| Add myself to People | `_data/people.yml` | Copy a block under `members:`, change the fields. Upload photo to `assets/img/people/` (square, ≥ 400 px) and set `photo: "/assets/img/people/firstname-lastname.jpg"` |
| Move someone to alumni | `_data/people.yml` | Cut their block from `members:`, paste a shorter one under `alumni:` with `now:` |
| Add a paper | `_data/publications.yml` | Copy a block under `papers:`; set `type` (article / review / preprint / protocol). Add your name to `highlight:` once so it's bolded |
| Post news | `_posts/` | Copy `_TEMPLATE.md` → rename to `YYYY-MM-DD-short-title.md` → edit |
| Add gallery photos | `_data/gallery.yml` | Upload to `assets/img/gallery/` (Add file → Upload files), then add a block with `image`, `caption`, `category` |
| Post a job opening | `_data/lab.yml` | Fill in the `openings:` list (example is in the file). Set back to `openings: []` when closed |
| Update stats / contact / socials / keywords | `_data/lab.yml` | Edit values |
| Change the hero headline or "We study …" words | `_data/lab.yml` | `tagline`, `rotating_words` |
| Change a research area | `_data/research.yml` | Edit `title`, `question`, `description`, `image` |
| Turn the fancy cursor off | `_data/lab.yml` | `custom_cursor: false` |
| Edit the stiffness explorer ranges | `_data/stiffness.yml` | Values in pascals (1 kPa = 1000) |
| Add / edit a materials platform | `_data/platforms.yml` | `icon` is one of `hydrogel`, `fibres`, `decell`, `nanopattern`, `bioprint`, `rheology` |
| Change the "Join us" banner text | `_data/lab.yml` | `cta_title`, `cta_text` |

### People entry

```yaml
  - name: "Your Name"
    group: "PhD Student"        # Postdoc | Research Staff | PhD Student | Masters / Undergrad | Visiting
    title: "PhD Student"
    photo: "/assets/img/people/your-name.jpg"   # or "" for initials
    research: "One line about your project"
    bio: "Optional: 2–3 sentences. If present, clicking your card opens a pop-up."
    links:
      email: "you@university.edu"
      scholar: "https://scholar.google.com/citations?user=..."
      orcid: "https://orcid.org/0000-..."
      linkedin: "https://www.linkedin.com/in/..."
      x: "https://x.com/..."
      website: "https://..."
```

### Publication entry

```yaml
  - title: "Paper title"
    authors: "A Author, Your Name, Lorem Ipsum"
    journal: "Nature Cell Biology"
    year: 2026
    type: article
    url: "https://doi.org/10.xxxx/xxxxx"
    code: "https://github.com/..."     # optional
    pdf: "/assets/pdf/paper.pdf"       # optional
```

## Preview before merging (optional)

Clone and run `bundle exec jekyll serve`, or just rely on the PR build check — if it's green, the site builds.

## Rules of thumb

- Images ≤ 1 MB, videos ≤ 20 MB. Name files in `lowercase-with-dashes.jpg`.
- Don't commit unpublished data, patient information or anything confidential — the repo and site are public.
- Only admins change `_layouts/`, `_includes/`, `assets/css`, `assets/js` and `.github/`.
