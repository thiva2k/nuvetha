# Nuvetha's 16th Birthday Website - Guide 💖

This website is a premium, interactive, and time-locked digital birthday gift designed for **Nuvetha's 16th Birthday** on **May 28th, 2026**.

Below is a guide on how to preview the site, test the time-locks, customize the media assets, and host it.

---

## 🚀 How to Run & Preview the Site

Since this is a lightweight, static web application (HTML, CSS, and JS), you can run it instantly without any installations:
1. Double-click the [index.html](index.html) file to open it in any web browser.
2. (Recommended) Run a simple local server to avoid browser cross-origin policy issues for media assets. If you have Python installed, open terminal/powershell in this folder and run:
   ```bash
   python -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser.

---

## 🛠️ Secret Developer Debug Menu (Timer Bypass)

Because the website is time-locked to May 28th, you will only see the **Countdown Screen** by default. To test the main page, polaroids, card deck, balloon pop, PIN pad, and secret letter during development, we've built a **hidden Developer Debug Panel**:

1. Click on the title **"Nuvetha's Sweet 16"** (on the countdown page) or the **Footer text** at the bottom **5 times quickly**.
2. A green terminal-style **Dev Debug Menu** will slide out in the bottom-right corner.
3. Use the buttons to bypass locks:
   - **Simulate Stage 1 Unlocked**: Bypasses the pre-birthday countdown, transitioning to the interactive Envelope cover.
   - **Simulate Stage 2 Unlocked**: Bypasses the letter unlock timer (normally set to 02:36 AM).
   - **Enable PIN Bypass**: Allows you to enter *any* digits on the PIN pad to unlock the letter.
   - **Solve All Quests**: Instantly solves all 5 adventure quests, reveals the clues (passcode `28923`), and triggers the PIN pad automatically.
   - **Auto Unlock Letter Directly**: Instantly bypasses everything and displays the cursive letter typing animation and video player.

---

## 🎨 How to Customize the Content

You can easily personalize all files using a text editor.

### 1. Replacing Polaroid Photos
The site uses 10 customized photos in the `assets/images/` directory:
- [photo1.jpg](assets/images/photo1.jpg) through [photo10.jpg](assets/images/photo10.jpg)

**To update these photos:**
1. Collect your photos with Nuvetha.
2. Save them as JPG files.
3. Rename your files to `photo1.jpg` through `photo10.jpg` (or as many as you'd like to display).
4. Copy them into the `assets/images/` folder, replacing the files.
5. Captions can be customized inside the `.polaroid-caption` elements in [index.html](index.html).

### 2. Passcode Validation
The secret letter is locked behind a 5-digit PIN pad.
- The correct PIN is **`28923`**, which she uncovers by solving the 5 adventure quests:
  - Quest 1 (Trivia): Enter `'nee'` (from "Unakku 'naan' Enakku 'nee'") -> Clue `2`
  - Quest 2 (Polaroid Key): Drag Polaroid #3 away, click the hidden gold key -> Clue `8`
  - Quest 3 (Card Deck Swipe): Swipe to Card #16 in the Reasons deck -> Clue `9`
  - Quest 4 (Hidden Star): Click the secret star inside the Dec 23 milestone -> Clue `2`
  - Quest 5 (Golden Balloon): Pop the golden helium balloon -> Clue `3`
- The PIN value of `'28923'` is defined in [app.js](app.js) around line 1635:
  ```javascript
  if (enteredCode === '28923' || debugState.bypassPin) {
  ```

### 3. Adding Your Background Music (Love Anthem)
Currently, the site streams a beautiful, romantic piano instrumental loop from a public audio host.
**To add your custom song:**
1. Drop your audio file (MP3 format is best) into the `assets/audio/` directory.
2. Rename it to `anthem.mp3`.
3. Open [app.js](app.js) and update **Line 418** to point to your file:
   ```javascript
   bgMusic = new Audio('assets/audio/anthem.mp3');
   ```

### 4. Embedding Your Custom Video
Once the letter is unlocked, a custom video player appears.
- Currently, it plays a placeholder romantic music video ("Perfect" by Ed Sheeran).
- **To add your own video (YouTube method):**
  1. Upload your video to YouTube as *Unlisted* (so only people with the link can see it).
  2. Get the embed link (e.g., `https://www.youtube.com/embed/VIDEO_ID`).
  3. Open [app.js](app.js) and update **Line 1236** with your link:
     ```javascript
     iframe.src = "https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1";
     ```
- **To add your own video (Local File method):**
  1. If you prefer to play a local MP4 file, place your file in `assets/video/video.mp4`.
  2. In [index.html](index.html) (Line 469), replace the `<iframe>` tag with a `<video>` tag:
     ```html
     <video class="video-iframe hidden" id="video-iframe" controls autoplay src="assets/video/video.mp4"></video>
     ```

### 5. Writing the Personal Letter
To write your final letter to Nuvetha:
1. Open [index.html](index.html) and locate the `<div class="letter-scrollable-body font-cursive">` block (Lines 439–452).
2. Modify the `<p>` tags with your own personal paragraphs. The typing animation will automatically process your new text, pacing the letters organically and scrolling down as it reveals!

---

## 🌐 Hosting Online for Free

When the site is ready, you can host it online so she can open it on her phone or computer:

### Option A: GitHub Pages (Easiest & Free)
1. Create a free account on [GitHub](https://github.com).
2. Create a new repository named `nuvetha` (set it to *Public*).
3. Upload all the files in this folder (`index.html`, `style.css`, `app.js`, and the `assets/` directory) to the repository.
4. Go to **Settings > Pages** in your repository.
5. Under **Build and deployment**, set the source to **Deploy from a branch** and select the `main` branch. Click Save.
6. Within a minute, your site will be live at: `https://yourusername.github.io/nuvetha/`!

### Option B: Netlify or Vercel (Drag-and-Drop)
1. Go to [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop this entire project folder into the upload box.
3. Your site is instantly published with a custom link that you can share with her!
