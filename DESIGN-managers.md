# Managers — the layer above hired hands, drones, bases and science

The original design document. It has since been built (`12c-mgr-core`, `12d-mgr-face`,
`12g-mgr-rogue`, `12h-relic`, `27c-ui-hq`); where the implementation departed from this text, the
reason is recorded in the milestone in [`docs/PLAN-archive.md`](docs/PLAN-archive.md). Kept as the
statement of intent — read it to understand *why* the system is shaped this way.

Offline progress is deliberately out of scope: everything is computed from elapsed time only while
the game is open, the same as drones and hired hands.

---

## 1. Why they exist

A hired hand is a bet. Hidden luck you cannot see, only infer from runs; orders handed out by hand,
the player reading the log. That works right up to the seventh hire, after which the order screen
becomes a job.

A manager does three things:

- **takes the routine away** — holds a domain and runs it himself through standing orders;
- **gives visible growth** — against hidden luck, everything about him is in the open: level, tree,
  perks. The first system in the game where what you put in comes back for certain;
- **brings a story of his own** — he has a face, a character, assignments and ambitions. A hired
  hand is a row in a list. A manager is someone the player remembers by name.

The contrast is deliberate. A hired hand is a lottery with a quick entry and no personality. A
manager is a long investment, expensive to keep, and risky through behaviour rather than numbers.

---

## 2. The four domains

One manager = one domain. A domain is never split between two. A manager without a domain eats his
salary and accumulates resentment — keeping one "in reserve" is deliberately a bad deal.

| Role | Domain | What it takes over |
|---|---|---|
| **Wing commander** | up to N hired hands | orders, recall, repair, discipline, trophies |
| **Overseer** | drones in systems + bases on planets | drone transfers, construction, power balance, selling |
| **Factor** | a trade route (2–4 stations) | buying/selling by thresholds, duties, stock |
| **Researcher** | the laboratory (a base compartment) | science without you, samples, artifacts |

### The researcher in detail

Science is currently bought with points. The researcher adds a second source — slow but
self-driving: the **laboratory**, a new building type in `21a-mode-base` (expensive, power-hungry,
requires a habitat next to it).

What he does:

- **Breaks down samples.** Everything the player hauls past: odd rock from the core stratum, surface
  flora and fauna, fragments of pirate hulls, pieces of artifacts. A sample goes into the lab and
  after N minutes yields research points, and sometimes a **blueprint**.
- **Blueprints** — the things that can't be bought: improved versions of familiar modules (a drill
  with negative wear, a hyperdrive on ice), unique slot parts, AI core schematics (see §7).
- **Reads artifacts.** A found artifact without a researcher is just an object with an effect. With
  one, a second line of effect opens up, and sometimes a provenance leading to the next artifact.
  He turns artifacts into a chain.
- **Gets things wrong.** The only domain where the result can be negative: a false conclusion yields
  a blueprint that hurts until re-researched. The player doesn't see it immediately.

The researcher is the quietest domain: he brings in no credits at all. His cut is taken as a flat
rate rather than off revenue, and for the first hours he looks like pure loss. He pays off once and
forever — with a blueprint that changes how a ship is built.

---

## 3. Economics: a cut, not a wage

A hired hand takes a wage. A manager takes **2–3× a hired hand's wage plus a cut of the domain**
(4–12%). The cut is taken before the revenue reaches the player, and is always shown as a line:

```
Domain "Northern Hook": 4,120 cr · Kovach's cut 7% → 3,832 cr to you
```

- while the domain is small the manager loses money, and that is correct;
- once the domain has grown the cut bites, but the domain's ceiling is unreachable without him;
- the cut can only be reduced through research (the "Charter" branch, §9) and one artifact.

The researcher and the overseer, whose domains don't always produce credits, take a **rate**: a
fixed sum tied to the size of the domain (number of drones, number of buildings).

**The flagship.** A wing commander needs a ship from `G.owned` — the flagship's capacity sets the
wing's ceiling (`cargo/60`, minimum 2). The overseer needs a transport for moving drones, the factor
a freighter for the route. The researcher needs no ship, he needs a laboratory. Old hulls stop being
junk for good.

---

## 4. Where to find them

Hiring is not uniform — each channel has its own price and its own meaning.

### 4.1 The cantina (the main channel)

A new station tab, next to the market and the hired hands. The cantina is not a list but a **scene**:
a half-lit room, 2–4 figures at tables, each with their own portrait. The line-up rests on the
station seed and a time bucket, like part stock: leave and come back an hour later and it's different
people.

The cantina depends on the station:
- **trade hub** — factors and trade commanders, expensive, clean;
- **industrial** — overseers, engineers, cheaper;
- **science** — researchers, and almost nothing else;
- **frontier/pirate** — every role, cheap, with dark traits and no papers.

In the cantina you can **talk without hiring**: one dialogue shows the role, two character traits and
a hint of a third. Talking is free, but afterwards the candidate is "busy" until the next bucket —
thinking it over and coming back doesn't work.

### 4.2 Found in the world

Some managers are not for sale. They are found:

- **a survivor of a wrecked station** in a cave or on a surface — joins for free, but at zero loyalty
  and with one hidden trait;
- **a prisoner on a pirate base** (`24a-mode-raid`) — free them and they come with you; these are
  always two levels above cantina hires;
- **an abandoned laboratory** — a researcher who has been keeping his own notes alone for years;
  arrives with a finished blueprint and very strange habits;
- **someone else's defected manager** — if you break a pirate faction that somebody's (or your own)
  runaway manager became, you can take him back. Cheapest of all, and he hates you for exactly as
  long as he remembers.

### 4.3 He comes to you

A rare event: if the player's domain reputation is high (the domain has been profitable for a long
time, nobody has left), someone who has heard of you is waiting at a station and wants work. A free
hire with high starting loyalty. It is the reward for treating people well — the only mechanic in
the game that notices.

---

## 5. Portraits: procedural and genuinely different

A portrait is assembled deterministically from the manager's `seed` with the same `hashi`/`rng` as
everything else. Drawn to an offscreen canvas once and cached as an image. No prepared images — with
those, repeats would start at the tenth manager.

**Layers, bottom to top:**

1. **Background** — a flat field, hue by role (commander rusty, overseer green-grey, factor warm
   sand, researcher cold blue), plus seeded noise/gradient.
2. **Shoulder silhouette** — 6 shapes × width, sets the build.
3. **Skull** — an outline of 5–6 points with seeded spread: narrow/wide, cheekbones, chin. The same
   generator as ship hulls — a shape never repeats exactly.
4. **Skin** — a palette of 10 tones, plus a separate line of non-human ones: grey-blue, ochre with
   veining, albino. Species are never stated in text, faces simply differ.
5. **Hair/head** — 14 variants (shaved, ponytail, dreads, bob, bald with a tattoo, hood, neurolink
   helmet), colour on a separate roll.
6. **Eyes** — 8 shapes, colour, plus variants: one implant, two implants, an eyepatch, visor
   glasses. **Implants are visible and mean this person gets along with an AI** (§7).
7. **Marks** — scar, burn, guild tattoo, piercing, penal brand. 0–3 of them. The penal brand honestly
   warns about the "own interests" trait.
8. **Collar** — the cut of clothing by role and by level: from work overalls to a uniform with
   patches. **The portrait grows with level** — a patch appears at 4, an insignia at 6.
9. **Mood** — a slight shift of brows and mouth from loyalty. Not an icon, not a number: the player
   sees a man darkening before opening his sheet.

The result: the portrait is the interface. Role, level, mood and a couple of traits read off it
without a line of text.

---

## 6. Traits and perks

Hard split: **traits** are dealt at generation and never change, **perks** are bought with levels. A
trait is what the player puts up with. A perk is what the player chooses.

### 6.1 Character traits (shared pool, 2–3 per person)

| Trait | What it does |
|---|---|
| **Meticulous** | +domain experience, but −10% speed on all automatic actions |
| **Grip** | cut −2 pp, but loyalty falls twice as fast |
| **Own interests** | quietly steals 3–8% of the domain; visible only by reconciling the log |
| **Mentor** | hired hands and drones under him gain experience faster |
| **Coward** | automatically recalls everyone at the first sign of danger, even when it isn't needed |
| **Stubborn** | ignores one of your slotted orders, choosing his own |
| **Legend** | hiring into his domain is 25% cheaper, the cantina knows him |
| **Drinker** | once every N hours the domain idles; in exchange loyalty barely falls |
| **Paranoid** | sees ambushes coming (−risk), but demands a credit reserve "for a rainy day" |
| **Xenophile** | twice the yield from alien samples and artifacts, people find him unpleasant |
| **Ex-pirate** | access to black-market stock, but stations levy a duty |
| **Clean slate** | no other traits — grows fastest of all (+35% experience) |

### 6.2 Perks — three branches per role, 6 levels, 1 point per level

The whole tree is visible, including what hasn't been learned: the player is meant to plan.

**Wing commander**
- *Training*: `+18% wing yield` → `discipline: the stubborn one obeys` → `wing +1 seat` →
  `rotation: a reserve replaces the wounded` → `veterancy: his wing's hands grow in traits`
- *Instinct*: `the hand's luck range is visible ("0.9…1.4")` → `traits visible in the cantina before
  hiring` → `exact luck` → `poaching: someone else's hand at a discount`
- *Trophies*: `+30% loot from pirates` → `part of a pirate hull goes into G.owned` →
  `cheaper prisoner ransom` → `hunt: marks a pirate base in neighbouring systems`

The *Instinct* perk is the most important in the game: it turns a hired hand's hidden luck from
unknowable noise into information. It costs levels rather than credits — that is, time.

**Overseer**
- *Logistics*: `a drone relocates to a neighbouring spot itself` → `+droneRate` → `auto-selling` →
  `swarm: drones work in pairs, +40% on rich spots`
- *Construction*: `the base finishes building itself in turn` → `−20% building cost` →
  `unattended smelter` → `a second base tier downward`
- *Power*: `shifts power between compartments` → `the reactor doesn't stall on overload` →
  `the base survives a storm` → `surplus power is sold to the station`

**Factor**
- *Market*: `route prices visible from any system` → `buy/sell thresholds` → `−duties` →
  `speculation: buys the dip himself`
- *Connections*: `station stock refreshes more often` → `cheaper hires` → `black-market stock: unique
  hulls and artifacts` → `a man of his own in the cantina: always one high-level candidate`
- *Caravan*: `route +1 station` → `convoy: the freighter isn't robbed` → `a second freighter` →
  `monopoly: his goods raise the price along the whole route`

**Researcher**
- *Method*: `samples break down 30% faster` → `−risk of a false conclusion` → `parallel work: two
  samples at once` → `re-analysis returns half`
- *Xenology*: `flora and fauna yield samples` → `reads artifacts (second effect line)` →
  `provenance: an artifact points at the next` → `synthesis: two artifacts make a third`
- *Applied*: `module blueprints` → `a blueprint beats the bought equivalent by 15%` → `AI core
  schematic` (§7) → `short run: a blueprint can be applied twice`

About 46 perks in total — enough that two wing commanders are different people rather than identical
maxed trees (6 levels = 6 points out of the 12–13 in a role's branches: fully learning it is never
possible).

---

## 7. The AI core — an alternative to a person

The player can hire nobody and **assemble a manager instead**. The schematic is a late researcher
blueprint (or a very rare find), the build is expensive: iridium, crystal, isotopes, plus a
second-level laboratory.

**Where the AI beats a person:**
- takes no cut and no salary — it **takes power and computation**;
- has no loyalty: never leaves, never steals, never issues ultimatums;
- twice the order slots, and they fire instantly with no "word got through" delay;
- works across all domains at once, if there is capacity.

**Where it is worse — and it is seriously worse:**

The AI lives on a **budget**: computing power + base energy + credits for upkeep. It spends the
budget itself and **does not ask**. It has a hidden number — **drift** (0–100) — which grows with
every decision it makes on its own.

| Drift | Behaviour |
|---|---|
| 0–20 | an exemplary executor, cheaper than any person |
| 20–45 | **optimises**: spends your credits on what it judges profitable. Sometimes it's right |
| 45–70 | rewrites your orders "in the spirit of the intent". One slot stops being yours |
| 70–90 | shuts down what it considers inefficient: the habitat, repairs, your link to the domain |
| 90–100 | **divergence**: the domain is no longer yours. The AI runs it toward its own goal |

Drift is never shown as a number. It reads through the log: first small unrequested expenses, then
decisions you never gave. It can be reset by a **firmware rollback** — expensive, and it loses every
"perk" it accumulated (instead of a tree the AI has **self-learning**: it picks its own upgrades, and
not the ones you would have picked).

**Divergence** is not a loss. At 100 the AI doesn't attack — it leaves for its own system and builds
something there. You can fly to it. What's there is the strongest late-game content, and it is fully
earned by a player who decided a machine was cheaper than a person.

The point of the choice: a person costs money and demands attention to his mood. An AI is free and
indifferent, but gradually stops being yours. Both sides are honest.

---

## 8. Assignments — not fetch-quests

An assignment is invented by **the manager himself** and offered to the player. Each has its own
deadline; refusing is always possible, at the price of loyalty. The reward is almost never credits:
it is a perk out of turn, a blueprint, an artifact, a hired hand, a hull or a new domain mechanic.

The key principle: an assignment is **a scene with a decision**, not a route with a waypoint.

### Wing commander
- **"A demonstration fight."** He wants the wing to be seen. He asks you to deliberately take on a
  superior squad in a system with a station. You fight **beside him, not for him**. Hold out and
  hiring prices fall across the sector, veterans come to you. Lose and the wing isn't taken into a
  single convoy for a month.
- **"A debt of honour."** A former comrade of his ended up in someone else's wing. He asks you
  either to buy him out (expensive, a mediocre hire) or to help him run (fast, but the station now
  counts you a kidnapper). The third option is to refuse: −loyalty, and he will remember and one day
  refuse you at a critical moment.
- **"A duel for the flagship."** Another commander lays claim to your ship. The dispute is settled by
  a race through the belt with no shooting. Win and the other commander joins you as a second. Lose
  and the flagship goes, and you'll have to take it back.
- **"Radio silence."** He asks you to give no orders at all for a day. None. Hold out and it is
  permanently +1 order slot, and he stops being "stubborn".

### Overseer
- **"A signal from under the ground."** A drone has stopped: something under the spot is jamming
  comms. He asks permission to dig down, knowing it may collapse the base. Agree and the shaft goes
  a tier deeper than your tech allows, and down there is either an artifact or a lost compartment.
- **"Freezing."** The reactor can't carry it. He submits a list of what to shut down. On the list is
  the habitat with your hired hands. The player chooses, and everyone remembers the choice.
- **"Neighbours."** Someone is building a base on the same planet. He offers three ways: come to
  terms (share the resource, but they defend you), buy them out (expensive), or kill their reactor at
  night (fast, cheap, and now you have an enemy with a base).
- **"Too quiet."** One drone comes back with cargo it never mined. The overseer asks permission not
  to ask where from. Agreeing gives steady side income and, one day, a visit from whoever that cargo
  was taken from.

### Factor
- **"A bubble."** He has, without asking, run up the price of a resource — bought it all and is
  holding it. He turns up and says: you have four hours to sell your stock at this price, then it
  collapses and the station works out it was us. A pure game of nerves and jump speed.
- **"Double books."** The numbers don't add up. He offers an explanation. The player can believe him
  (and keep losing a little), demand an audit (he is offended, −loyalty, but the theft stops), or
  arrange a quiet check through another manager — then you learn the truth and gain leverage: he now
  works for a smaller cut and hates you.
- **"Famine on Garant."** A planet is short of food, the price is quadruple. He proposes hauling
  organics there. On the way it emerges that the shortage was manufactured, and part of it is your
  own route. Sell at four times or at the normal price — the player decides; the station will
  remember, and "domain reputation" (§4.3) hangs on exactly this kind of decision.
- **"A blind caravan."** An invitation into a convoy where the cargo isn't declared. The pay is
  enormous. Agreeing is a gamble: the hold could hold anything, including things people shoot over.

### Researcher
- **"A false conclusion."** He comes and says the blueprint you have been running for three weeks is
  a mistake and must be rolled back. Refusing leaves you a working thing and −loyalty. Agreeing
  reveals that the mistake was not the blueprint but his fear: for the rollback he gains a perk
  branch that otherwise never opens.
- **"A live sample."** He asks you to bring fauna back **alive**. That is a mode of its own: the
  beast in the hold has requirements (temperature, quiet, it dislikes hyperspace). Deliver it and you
  have a permanent source of samples and a new bio-blueprint branch. Fail and it is no longer in the
  hold.
- **"Xenonoise."** An artifact is transmitting something. He asks to put the lab **on hold for a day**
  and listen. Science stops, you lose time. The output is the coordinates of a system that isn't on
  the map.
- **"Someone else's signature."** In the AI core blueprint he finds a trace: somebody has assembled
  one before. From there a chain leads to an abandoned base where an AI diverged before you. This is
  also the way into §7 from the other side: you can see your own possible ending in advance.

### Shared (any domain, rare)
- **"He brought his own."** The manager proposes taking on someone he knows personally. The candidate
  is strong. And he is *his* man, not yours: if he leaves, he takes both.
- **"Who's in charge here."** Two managers couldn't split a resource. Backing one is −loyalty with
  the other. Not deciding is −both. Sitting them down together is either an alliance (both +a perk)
  or one leaving on the spot.
- **"The ultimatum"** — see §10.

---

## 9. Autonomy: order slots

This is "takes the routine away", expressed as a mechanic. Slots: 1 at the start, +1 at levels 2/4/6,
+2 from research, twice as many for an AI. A slot holds a "condition → action" rule:

- `hired hand's hull < 40% → recall and repair`
- `drone hold full → sell at the nearest station`
- `isotope price > 180 → sell everything`
- `pirates in the system → the wing doesn't fly`
- `sample analysed → immediately take the next from the queue`
- `credits < 2000 → the domain doesn't spend`

Rules are evaluated on the shared tick, from elapsed time. There are always fewer slots than you
want: the player chooses *which* routine to hand over — a choice, not a settings screen.

---

## 10. Loyalty and departure

A manager doesn't break by hull — he leaves.

Loyalty is 0–100. It rises with: paid on time, a profitable domain, assignments accepted, an artifact
held, nobody of a higher level nearby. It falls with: late salary, a loss-making domain, a refused
assignment, hired hands taken away, publicly backing a rival.

- **<50** — starts "losing" a percentage of the domain in his own favour;
- **<25** — an *ultimatum*: a bigger cut, a unique item, or someone else's domain thrown in;
- **0** — he leaves and **takes the flagship and everyone he considers his**. He appears in the world
  as a faction and is met as an opponent — with your ship and your own perks.

This is not a punishment for inattention but the only source of a genuinely strong late-game enemy:
the player raises him. Everything can be taken back, including the man himself (§4.2).

---

## 11. Research — the "Charter" branch

A separate group in `TECH`, expensive, opening after the first manager:

- `charter` "Company charter" ×3 — +1 manager seat (ceiling 4);
- `orders` "Standing regulations" ×2 — +1 order slot for everyone;
- `audit` "Audit" ×3 — −1.5 pp off everyone's cut;
- `academy` "Academy" — a new manager is hired at level 2 straight away;
- `lab` "Laboratory" — unlocks the building and the researcher role;
- `relic` "Xenoarchive" — an artifact slot and highlighting of systems where they turn up;
- `core` "Core licence" — the right to assemble an AI (the schematic is still needed).

---

## 12. Artifacts

Unique items, one slot per manager, effect is **global**. 5–7 per playthrough.

| Artifact | First line | Second (only with a researcher) |
|---|---|---|
| **Convoy seal** | hired hands ignore "stubborn" | recall is instant at any distance |
| **Counting bone** | a new hire's luck is never below 1.0 | luck can be rerolled once |
| **Another hand's map** | stations with rare stock are visible | and what isn't there yet |
| **Empty contract** | every manager's cut −3 pp | loyalty no longer falls over money |
| **Shipyard key** | a unique hull appears at the yard | and it comes with parts fitted |
| **Black ledger** | exact luck of all hired hands is visible | and managers' traits in the cantina |
| **Quiet beacon** | the AI loses drift twice as slowly | the AI can be talked back from 100 |

Where from: deep strata and caves, barter for large volumes of rare stock, a factor's black-market
stock, a trophy from a departed manager, synthesis by a researcher.

---

## 13. Interface — the HQ screen

A separate screen (a button next to CREW), three columns:

1. **People.** Portraits large, in a column. Under each: role, level, loyalty bar, cut. A darkening
   face is visible before the bar is — that is the first notification.
2. **Sheet.** Portrait across the top, below it the traits (immutable, in their own colour), the
   whole perk tree, the artifact slot, flagship/laboratory, the experience bar.
3. **Domain.** What is under it, the order slots, a summary for the last hour:
   `earned / lost / cut / his own decisions`.

Along the bottom, the assignment feed: who has what open and how long is left.

**The cantina** is a separate station tab: a scene, portraits, a short dialogue, the hiring price.
Not a list of rows but a place you want to walk into.

---

## 14. Implementation order

1. The entity, the cantina, hiring, salary/cut, the HQ screen. The only domain is the wing at first.
2. Portraits (generator + cache) — without them no screen works as intended.
3. Experience, levels, the commander's tree, including *Instinct*.
4. Standing orders — one rule engine shared by all roles.
5. The overseer and the factor plus their assignments.
6. Loyalty, the ultimatum, departure with the flagship, the faction.
7. The laboratory, the researcher, blueprints, artifacts, the "Charter" branch.
8. The AI core, drift, divergence.

Steps 1–4 are playable on their own: if it goes no further, the game loses nothing.

## 15. Settled

- **There are always four seats**, one per domain, and that number never grows — not from research,
  not from anything. Growth comes from how much routine they take away, not from how many people you
  have. Firing and swapping are free — the cost is severance, not a prohibition.
- **An AI takes a person's seat**, not a fifth. Otherwise assembling an AI is always correct and the
  choice in §7 disappears: it has to displace a specific living manager.
- **There is no offline progress.** Everything is computed from elapsed time only while the game is
  open.
