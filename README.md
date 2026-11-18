# AI Effect in Education: Card Scanner

A Plickers-style response system for the AI Effect in Education game. Students hold up a printed card with their judgment on top. One phone scans the room, and the classroom screen shows who has answered and then how the class split.

| Page | Where it runs | What it does |
|---|---|---|
| `index.html` | Anywhere | Home page with links and how-to |
| `cards.html` | Any computer | Prints numbered cards (up to 60) |
| `display.html` | Classroom screen | Scenario, who has answered, the reveal |
| `scan.html` | Teacher phone | Camera scanner and round controls |

## How the cards work

Each card has a square code in the middle and three labels around it:

- **Top edge:** Take the Trail
- **Right edge:** Approach with Caution
- **Bottom edge:** Risky Terrain
- **Left edge:** blank. Holding it up this way means "not answering" and the scanner ignores it.

Whatever edge is at the top when the card is raised is the answer. Card numbers are printed in two corners, so give each student the same number every time.

## 1. Put it on GitHub Pages

1. Upload every file and the `lib` folder to your repo, keeping the folder structure.
2. In the repo, go to **Settings → Pages**, set the source to your main branch, and save.
3. Open `https://<your-username>.github.io/<repo-name>/`.

The camera only works over https, which GitHub Pages provides.

## 2. Scenarios

`scenarios.js` already holds the 24 scenario cards from the printed deck, in deck order. To add or change one, edit that file:

```js
{ text: "The scenario students will discuss." },
```

A `title` is optional (`{ title: "Short title", text: "..." }`). Commit the file and the site updates in a minute or two.

## 3. Turn on live sync (phone → classroom screen)

Until this is done, the scanner and display must run in the **same browser** (for example, a laptop webcam with the display on the projector). To scan with your phone, set up a free Firebase Realtime Database once:

1. Go to the Firebase console and **Add project**. Analytics can be turned off.
2. In the left menu, open **Build → Realtime Database → Create database**. Pick a US location and start in **locked mode**.
3. On the database's **Rules** tab, replace everything with the block below and click **Publish**:

   ```json
   {
     "rules": {
       "rooms": {
         "$room": {
           ".read": true,
           ".write": true,
           ".validate": "$room.matches(/^[A-Z0-9]{1,12}$/)"
         }
       }
     }
   }
   ```

4. Open **Project settings** (gear icon) → **General** → **Your apps** → the web icon `</>`. Register an app (no hosting needed).
5. Copy the `firebaseConfig` values into `firebase-config.js`, replacing `null`. Make sure `databaseURL` is included.
6. Commit. The home page will say "Live mode is on."

**What gets stored:** only the room code, card numbers, and each card's choice. No student names or other personal data are stored. Anyone with a room code could view or change that room, so use a fresh code for each class. Old rooms can be deleted in the Realtime Database's **Data** tab.

## 4. Running a round

1. Open `display.html` on the classroom screen.
2. Open `scan.html` on your phone, set the number of cards in use, and tap **Start camera**. Enter the room code shown on the phone into the display (or use the **Open display** link).
3. Students discuss, turn their card to their judgment, and hold it up.
4. Sweep the phone slowly across the room. Cards turn solid on the phone once captured, and the matching number lights up on the display, without showing the choice.
5. Tap **Reveal on display** (or press **R** or the space bar on the display computer).
6. Use **›** or the right arrow key for the next scenario.

A student who changes their mind can turn their card and be rescanned; the latest scan counts. **Clear this round** wipes the current scenario's responses.

## Tips for reliable scanning

- Print at 100% / actual size on matte cardstock. One card per page reads from farther away.
- Ask students to hold cards flat and still, with fingers off the code.
- Back-of-room cards read best when the phone is held steady for a second rather than swept quickly.
- Screen glare or backlighting from windows makes codes harder to read.

## Files in `lib/`

- `aruco.js`, `cv.js`: js-aruco2 marker detection (MIT license, see `LICENSE.txt`)
- `trail-dictionary.js`: the 60 card codes, chosen so no two codes are confusable in any rotation
- `trail-core.js`: card edge to answer mapping, shared by all pages
- `trail-sync.js`: Firebase live sync, with same-browser fallback
- `trail.css`: shared styles
