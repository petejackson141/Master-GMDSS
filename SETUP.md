# Putting Master GMDSS online and installing it on your phone

You do this once. It takes about 10 minutes.

## 1. Create the repository on GitHub
1. Go to https://github.com/new (signed in as petejackson141).
2. Repository name: `master-gmdss`
3. Choose **Public** (GitHub Pages is free for public repositories).
4. Leave everything else unticked and click **Create repository**.

## 2. Upload the files
1. On the new repository page, click **uploading an existing file**.
2. Unzip `master-gmdss.zip` on your computer. Open the `master-gmdss` folder, select **everything inside it**
   (index.html, manifest.webmanifest, sw.js, the icons, shared, study and vhf folders, README.md and the rest)
   and drag it all into the browser window.
   - `.nojekyll` is hidden on Windows. If it doesn't upload, create it later: **Add file → Create new file**, name it `.nojekyll`, leave it empty, commit.
3. Click **Commit changes**.

(Later, for regular updates, a `save-and-sync.bat` like the one you use for Sail la Vie can do this in one double-click.)

## 3. Switch on GitHub Pages
1. In the repository: **Settings → Pages**.
2. Under **Build and deployment**, Source: **Deploy from a branch**. Branch: **main**, folder **/ (root)**. Click **Save**.
3. Wait 1–2 minutes and refresh. The page shows: *Your site is live at*
   **https://petejackson141.github.io/master-gmdss/**

## 4. Install on your Android phone
1. Open that address in **Chrome** on the phone.
2. Tap **Install app** on the home screen (or Chrome's ⋮ menu → **Install app** / **Add to Home screen**).
3. Open it from the new icon. The first time you press PTT, allow the microphone.

## 5. iPhone (later)
Open the address in **Safari** → Share → **Add to Home Screen**.
Voice recognition on iPhone web apps is limited by Apple; the store version (Capacitor) will fix this.

## Updating the app
Edit the files, raise `VERSION` in `sw.js`, upload again (step 2, overwrite the files).
Phones pick up the new version the next time the app is opened with internet (sometimes it needs opening twice).

## Your own domain (optional, later)
Buy `mastergmdss.com`, then in **Settings → Pages → Custom domain** enter it and follow GitHub's DNS instructions.
