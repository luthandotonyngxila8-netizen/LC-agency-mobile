# Social content system

Fifteen weeks of Facebook and Instagram content, built from the same
`data/products.json` the website runs on. Change a price on the site and the
next build changes the caption. Nothing is written or resized twice.

    python3 social/build.py                 # 15 weeks from next Monday, all 30 pieces
    python3 social/build.py 2026-09-01 26   # from a date, for 26 weeks

Out:

    social/images/<key>-feed.jpg    1080x1350   feed (4:5 — the tallest allowed)
    social/images/<key>-story.jpg   1080x1920   Stories, Reel covers
    social/queue.md                 readable, for approving before anything goes out
    social/queue.csv                the same rows, for a scheduler

## The rhythm

Three a week. It is what a workshop this size can keep up, and enough to stay
in front of people without becoming a second job.

| Day | What | Why |
|---|---|---|
| **Monday** | One piece, one price | Something to buy |
| **Wednesday** | The material or the making | The thing nobody can copy |
| **Friday** | The house, or an invitation | Something to believe |

Pieces run **cheapest first**, so somebody meeting the brand cold sees an
R1 800 sling before an R72 000 briefcase. The twelve Wednesday posts rotate:
five hides, three on process, three on the house, one commission invitation.

## Actually posting it

Nothing here posts. Three ways to close that gap, in the order I would try them:

**1. Meta Business Suite — free, official, no setup.**
business.facebook.com → Planner → Create post → schedule for both the Page and
the Instagram account at once. Work from `queue.md`: copy the caption, attach
the named image, set the date. A month takes about twenty minutes, once a month.
Instagram must be a **Business or Creator** account and linked to the Facebook
Page, or it will not offer scheduling.

**2. A scheduler that takes CSV** — Buffer, Later, Metricool. Import
`queue.csv` and it fills the calendar. Costs money; saves the twenty minutes.

**3. The Meta Graph API** — genuinely automatic, posts without anyone touching
it. Needs a Meta developer app, a long-lived Page access token, and the
Instagram account linked to the Page. The token is a password: it belongs in an
environment variable, never in this repo. Worth it only once the rhythm is
proven manually.

## The voice

Short declarative sentences. Concrete nouns. No hype, no exclamation marks, no
emoji. The pieces are expensive; the writing should be calm. If a caption reads
like an advert, it is wrong — the photograph is the advert.

Captions live in `plan.py`. Product ones are built from four rotating shapes
using each piece's own `moodLine` and `materialLine`, so they never read as
thirty copies of the same post. The Wednesday editorial posts are written by
hand and are the ones worth editing.

Hashtags: a house set plus tags for the hide and the category, capped at 22.
Instagram allows thirty; thirty looks desperate.

## Before you post — the imagery

**The product photographs are real.** Every Monday and Friday post is a genuine
photograph of a piece Asekho made. Those are safe.

**The Wednesday imagery is not.** The hide close-ups, the cutting table, the
stitching hands, the workshop building and interiors are AI-generated stand-ins
made for the website. On a website, behind a headline, they read as mood. In a
feed, captioned *"Chosen wet, sorted dry, rejected often"*, they read as
documentary — as a photograph of this workshop, on this bench, with these hides.
That is a claim the picture cannot support.

`craft-east-london` is the sharpest case: the caption says East London, and the
building is not the building.

Two ways to fix it, both better than posting as-is:

- **Get the real shots.** A phone, the actual bench, actual hides, daylight.
  Twenty minutes of Asekho's time replaces all twelve, permanently, and they
  will be better than anything generated.
- **Until then**, run Wednesdays off real product photographs instead — there
  are 97 in `images/products/`, many showing hide texture and construction
  close up. Point `EDITORIAL[*]["image"]` at one of those.

The `hide-ostrich` image is also still wrong — smooth leather under a caption
about the quill field. Do not post that one until it is replaced.

## Weekly, once it is running

- Reply to every comment and DM. The commission conversation starts there, and
  the whole site is built to hand people to WhatsApp.
- Stories two or three times a week — work in progress, a hide arriving, a piece
  going out. Unpolished is correct for Stories.
- When a piece sells, say so. Scarcity is real here; the pieces are one-offs.
