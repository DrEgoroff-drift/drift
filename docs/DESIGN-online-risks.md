# Drift online: what can go wrong with the product

Written 2026-08-25 by reading the code, not by listing generic advice. Every claim below names the
function or file it came from. Ordered by **how much it hurts a player who did nothing wrong**, not
by how exotic the attack is.

## 0. What the online part actually is

Three features and one honest fact:

| Feature | Where | Auth | Server's role |
|---|---|---|---|
| account + cloud save | `a=register/login/pull/push`, client `14-save` | token, 90 days | **blob store** — keeps whatever the client sends |
| road presence ("who else is in this sector") | `a=road`, client `27k-road` | none, random pilot id | counts ids seen in a sector in the last 3 min |
| someone else's mark (M171) | `a=trace`, client `11ag-trace` | none, random pilot id | keeps up to 8 marks per place for 30 days |

**The fact:** the server has no idea what happens in the game. `push` accepts any JSON with a `v`
field and writes it to `s/<login>.json`. Credits, cargo, hours flown — all of it is whatever the
client typed. This is the correct choice for a single-player game (the alternative is running the
simulation on the server, which is a different product), but everything below follows from it.

---

## A. Sync and offline — the family that hurts honest players

This is where the real damage is. Not cheating: **silent divergence**.

### A1. A rejected push says nothing (`cloudPush`, 14-save)

The routine push is silent by design (`loud=false`, once per 20 s). Every failure path is therefore
also silent:

- the server answers "в облаке запись новее" → **nothing is shown**;
- the token expired, or a password reset elsewhere dropped it → `cloudForget()` runs and the account
  is **forgotten without a word**;
- the save is over 1 MB (`MAX_SAVE`) → HTTP 413, `d.ok` false, no branch matches → silence;
- no network → `.catch()` → silence.

**The use case.** A player flies on the phone in the metro, comes home, opens the desktop, sees
yesterday's game, plays two hours. The phone (still holding a newer `ts`) never uploaded; the
desktop uploads fine. From now on the phone's push is refused forever ("cloud is newer") and the
phone never says so. Two universes, no warning, and whichever device the player opens next decides
which two hours of their life are gone.

**Fix, in order of cost:** (1) one line of state in the console — `облако: отправлено 12:04` /
`не отправлено` — the interface already has the place for it; (2) on a refused push, offer the
choice once instead of swallowing it (`force` already exists in the API); (3) retry the failed push
on `visibilitychange`/`online` rather than waiting for the next save.

### A2. `ts` is the client's clock (`snapshot()` → `ts:Date.now()`)

Conflict resolution is "newest `ts` wins", and `ts` comes from the device. A phone with a wrong
clock — a timezone bug, a dead battery reset to 1970 — poisons the exchange in both directions: a
future `ts` makes the cloud **permanently unwriteable** by every honest device (the server refuses
anything older), and a 1970 `ts` makes that device's real progress invisible forever.

**Fix (cheap, and it protects honest players rather than chasing cheaters):** on `push`, refuse or
clamp `ts > time()+86400` and keep `ts` monotonic per account. Five lines in `api.php`.

### A3. Two tabs, and the older one wins

There is no multi-tab guard anywhere — `BroadcastChannel`, the `storage` event and a session
heartbeat are all absent. Two tabs both autosave into the same `localStorage` key and both push.
The stale tab overwrites the good one. This is one of the most common ways a browser game eats
progress, and it needs no attacker at all.

**Fix:** a heartbeat key plus `BroadcastChannel`; the second tab either takes over (and the first
goes read-only with a visible line) or refuses to save. Refusing *silently* is not an option — the
player has to see which tab is the live one.

### A4. Storage failure is only visible inside the settings screen

`stSet` swallows the exception and sets `STORAGE_OK=false` (14-save). The only place that ever tells
the player is the SAVE section of the options screen (`27-ui-ship`). In Safari private mode, or when
the quota fills, the player plays for hours with nothing being written and finds out when they close
the tab.

**Fix:** the first failed write is an emergency line in the console, not a note in a submenu.

### A5. Save growth is bounded, but the ceiling is silent

Measured, not guessed: a fresh snapshot is **1.5 KB**, and each remembered place costs **~80 bytes**
(`G.place` + `G.visits`), so the 1 MB server cap is roughly **13 000 places** — unreachable in
normal play, reachable by a completionist over years. The failure mode is A1: a silent 413 forever.
Worth a guard when the snapshot passes ~600 KB (warn, prune the oldest `place` entries), not before.

---

## B. "How would the server know what he earned?"

It cannot, and no amount of validation will change that: the client is a single HTML file the player
owns. That is not defeatism, it is a design constraint with three honest options:

1. **Keep everything honour-based** and never build a feature that pays for numbers. This is what the
   game does today: the competitive-looking parts of the queue (record book M161, boards of honour)
   are all *local* — nobody's numbers are compared with anybody's, so there is nothing to defend.
2. **If a public ranking is ever wanted**, frame it as *«записи»*, not *«рейтинг»*: a wall of what
   people did, unverified and shown as such. The fun survives, and cheating stops mattering because
   nothing is at stake.
3. **Verified numbers require the economy to move server-side** — market, drones, runs. That is
   months of work and a different game, one that needs a connection to play. Not worth it here.

**What server validation IS worth doing** — and it is not anti-cheat: sanity checks that catch
*broken* clients rather than dishonest ones. A `ts` in the future (A2); a save that shrank by 90 % in
one push (a half-initialised client about to overwrite a real game); a `v` the server does not know.
Log them, refuse the destructive ones. That protects honest players from bugs — the actual threat
model of this product.

---

## C. Cheating: what is possible, what matters, what is already defended

- **Editing the save is trivial, and it does not matter.** Single-player. The one rule to keep: never
  build a feature that turns single-player numbers into something another player feels.
- **Clock-forward for offline income is already defended, by design.** `tickDrones` (12-economy) caps
  elapsed time at 24 h *and* drains a finite `pool` per deposit — moving the clock spends the
  deposit, it does not print money. Crew runs charge wages over the same elapsed time, so they are
  not profitable to fast-forward either. Worth writing down, so a later edit does not remove the cap
  by accident.
- **The road companion (M168) pays credits for real kilometres** and is trivially spoofable (a mock
  GPS, or just editing the save). It is capped at 40/day by design, and it pays only into one's own
  economy — so it stays a matter between the player and their conscience.

---

## D. The shared features — the one place where other players get hurt

The trace (M171) is the only thing in the game where one person's action lands in another person's
world. Its limits are enforced per **pilot id**, and that id is a random string the client puts into
`localStorage` (`traceId`, 11ag-trace). Self-asserted identity means:

- **The "three per day" limit is decorative.** Clearing one key — or one line in a script — gives a
  fresh identity and three more.
- **A place holds eight marks and drops the oldest** (`array_slice($list,-8)`). So a spammer does not
  merely add noise, they **push real players' gifts out**. Griefing the feature costs an evening of
  scripting.
- **A harvester bot** can walk the place-key space, `ask` and `take` everything, and the gift economy
  becomes a farm. The keys are just `sx,sy[/planet]` — trivially enumerable.

The client is well-behaved about what comes back (`const k=RES[t.r]?t.r:"ice"` — an unknown resource
key cannot poison the game), and the server validates shape (`m` 0..31, `n` 1..5, `h` six hex chars,
`r` `[a-z]{2,12}`). So there is no injection here — only abuse of the rules.

**The fix is a product decision, not a patch** (the author's call):
(a) leave it — the feature is small and the gifts are cheap, so abuse costs atmosphere, not progress;
(b) require an account for `put` (leaving) while `ask`/`take` stay anonymous — identity becomes
scarce, spam becomes expensive, and it costs one `need()` in `api.php`;
(c) keep it anonymous but bind the daily limit to the IP as well as the id.

---

## E. Infrastructure — the part that takes the whole site down

### E1. Unauthenticated endpoints that create files, with no rate limit (the worst item here)

`rateHit()` exists and guards `register`/`login`/`forgot`/`reset`. It guards **neither `road` nor
`trace`** — and both create files on disk from unauthenticated input:

- `road` writes `road/<sector>.json`, and the sector space is `-?\d{1,7}:-?\d{1,7}`, i.e. effectively
  unbounded;
- `trace put` writes `trace/p/<place>.json` **that lives 30 days**, plus `trace/u/<id>.json` per
  identity.

Both sweepers are probabilistic (`mt_rand(1,50)===1`) and only remove files past their age, so a
script creates files far faster than they are swept. On shared hosting the limit hit first is usually
**inodes**, and when the disk or the inode table is full, `writeJson` fails for *everything* —
including `s/<login>.json`. **A stranger with a loop can stop honest players' saves from being
written.** This is the one finding that deserves a fix before anything else.

**Fix, without touching honest players:** a generous per-IP limit on both (`road` must allow ~30
calls per 15 min per player, so ~150 for a shared NAT; `trace put` far fewer), a hard cap on the
number of files per directory, and a deterministic sweep instead of a 1-in-50 dice roll.

### E2. Directories that only grow

`rate/*` is never swept — one file per IP per tag, forever. `trace/u/<id>.json` is never swept
either: one file per pilot identity, forever, and identities are free. Slow, quiet, unbounded.

### E3. Backups — an open question for the author

Everything lives in `~/drift-data` on one shared host: accounts, password hashes, emails, saves.
Nothing in the repo mentions a backup, and the deploy (`docs/DEPLOY.md`) only ever pushes three files
up. **If that directory is lost, every account and every save is gone with no recourse** — players
cannot even re-import, because their own copy sits in the `localStorage` of one browser. A nightly
`tar` off-host is an hour of work, and the difference between an incident and the end of the game.

### E4. There is no way to delete an account

There is no `a=delete`. The stored personal data is an optional email plus a password hash. A player
who asks to be removed has to be handled by hand, and there is nothing to point them at.

---

## F. Quiet things worth knowing

- **The pilot id is shared between the road and the trace** (`drift_pilot`, one key — stated in
  11ag-trace's own header). The road's files link that id to a **real-world 2.8 km cell**; the
  trace's files keep the same id for 30 days next to in-game places. Separately each is harmless and
  anonymous; together, on one disk, they are a weak link between a person's real movement and their
  game. Two different keys cost one line and remove the question entirely.
- **The service worker is network-first** (`drift-sw.js`) — no stale-version trap, which is the usual
  PWA disaster. Good as it is; do not "optimise" it into cache-first.
- **Writes are atomic** (`writeJson` writes a temp file and `rename`s it), so two devices pushing at
  once cannot corrupt a save — the later one simply wins.
- **Login and forgot do not leak** whether a name or an email exists. Deliberate, per the comments in
  `api.php`. Keep it that way.
- **A password reset drops every token** — correct, but it means the other devices are silently
  logged out and keep playing unaware (see A1).

---

## Suggested order

1. **E1** — the disk-fill hole. The only item where a stranger can hurt everyone.
2. **A2 + A1** — clamp `ts`, then make the sync state visible. Together they end the whole "which
   device ate my evening" class of complaints.
3. **E3** — confirm a backup exists; if it does not, make one.
4. **A3, A4** — two tabs, and the storage warning.
5. **D** — decide what the trace should be when somebody abuses it. The author's call.
