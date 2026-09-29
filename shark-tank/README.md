# Into the Tank: Shark Tank India pitch insights (S1–S5)

An unofficial fan website that analyses every Shark Tank India pitch from Seasons 1 to 5 (755 pitches, 428 deals). It's a static site: plain HTML, CSS and JavaScript with no framework and no build step, so any static host can serve it.

```
index.html            page
assets/style.css      theme (dark ocean; follows the system light/dark setting)
assets/app.js         charts, filters, pitch log
data/raw/s1..s5.csv   source data, one CSV per season (edit these)
data/pitches.js       generated: loaded by the page
data/pitches.json     generated: same data as JSON
data/pitches.csv      generated: all seasons merged (the "Download data" link)
scripts/build_data.py regenerates the three generated files from data/raw
```

## Run it locally

```bash
cd shark-tank-india-insights
python3 -m http.server 8000      # then open http://localhost:8000
```

Double-clicking `index.html` also works, because the data is loaded as a script rather than fetched.

## Update the data

1. Edit a file in `data/raw/`, or add `s6.csv` with the same header.
2. Run `python3 scripts/build_data.py`.
3. Commit and push, or re-upload. New seasons show up in the season tabs automatically.

CSV columns: `season, episode, pitch_no, brand, idea, city, ask_amount_lakh, ask_equity_pct, deal (Yes/No), deal_equity_amount_lakh, deal_debt_lakh, deal_equity_pct, royalty_or_other, sharks` (shark names separated by `; `). Amounts are in lakh, so ₹1 Cr = 100.

## Host it (free options)

**GitHub Pages**
```bash
git init && git add . && git commit -m "Shark Tank India insights"
git branch -M main
git remote add origin https://github.com/<you>/shark-tank-india-insights.git
git push -u origin main
```
Then go to the repo's Settings › Pages › Source, choose "Deploy from a branch" with `main` / `/ (root)`, and save. The site will be at `https://<you>.github.io/shark-tank-india-insights/`. The empty `.nojekyll` file stops GitHub from processing the files.

**Netlify:** drag the whole folder onto https://app.netlify.com/drop. For automatic deploys, connect the GitHub repo instead, with no build command and publish directory `.`.

**Vercel:** `npm i -g vercel && vercel` inside the folder, choosing the "Other" framework preset with no build command. Or import the GitHub repo at vercel.com/new.

**Cloudflare Pages:** create a project from the GitHub repo, with no build command and output directory `/`.

To use a custom domain, add it in your host's domain settings and point a CNAME record at the address the host gives you.

## How the numbers are calculated

- **Asking valuation** = ask amount ÷ ask equity %.
- **Deal valuation** = equity cheque ÷ deal equity %. Debt is not counted. Deals where the debt is bigger than the equity cheque, and asks below ₹1 lakh (for example "₹10 for 1%"), are left out of the valuation charts.
- **Money per shark** is an estimate: each deal's equity plus debt is split equally among the sharks in it.
- Royalties, advisory equity and conditions appear as a note in the pitch log. They are not counted in the money totals.

## Data quality: please read

The data was compiled from Wikipedia's season pages. Because the shark tick-mark columns there are hard to read reliably, the investor names were cross-checked against fan archives (sharktankseason.com, sharktankindia.com) and news reports. Known gaps:

- **City:** almost always empty from Season 2 on.
- **Season 1:** the amounts for Cocofit and Watt Technovations are unknown.
- **Season 2:**
  - SUGAR Cosmetics (#166) has no deal terms.
  - SoulUp (#154) has no sharks listed.
  - Dhruv Vidyut (#93) was a mentoring-hours deal, not a cash one.
- **Season 3:** Anupam Mittal's deal count is 24 here against 22 in Wikipedia's summary.
- **Season 4:** the asks for about nine pitches differ between sources; Wikipedia's figures were used.
- **Season 5:**
  - The episode number is missing for pitches 134–139.
  - The sharks for most deals come from a single fan archive.

Before promoting the site widely, spot-check the rows you feature. Adding a "Report an error" link, such as a GitHub issue or a Google Form, is also worthwhile.

## Legal notes (not legal advice)

- Publish **facts and your own analysis** only. Don't host clips, thumbnails, show photos or transcripts, and don't download from YouTube (it's against YouTube's Terms of Service). Embedding official YouTube videos with YouTube's own player is fine.
- Don't use the show's logo or artwork, or anything that suggests the site is official. Keep the disclaimer in the footer.
- If you reuse Wikipedia text, as opposed to plain facts, it's under CC BY-SA, so credit Wikipedia and use the same licence.
