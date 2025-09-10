## IMPORTANT 

**Don’t check plugin settings  — instead, look at the Mute & Deafen area you'll find it icon**
**MUST ONLY HAVE THE animated status FOLDER with index.tsx & css OTHERWISE WILL THROW ERRORS**
**Contact on Discord: shxdes0 IF got any Questions or Technical Issues**
** Star please ?**
---

## DISCLAIMER  
**THIS PLUGIN MIGHT GET YOU BANNED FROM DISCORD SO USE IT AT YOUR OWN RISK. I'M NOT RESPONSIBLE FOR ANY BANS. (never happened before though) **  
I'm a shit coder, so ignore the shit code. If you’ve got any improvements, open an issue or pull request.

---

## Features

### Status Messages  
![Status Message](https://raw.githubusercontent.com/shxdes69/vencord-animated-Status/main/screenshots/Preview1.png)  
![Status Message Preview 2](https://raw.githubusercontent.com/shxdes69/vencord-animated-Status/main/screenshots/Preview2.png)

- Supports Discord/Nitro emojis (I don’t have Nitro to test it—normal emojis work tho). Can do an issue/pull request if you got ideas, I don’t fw Discord.
- Preview your status before adding it (cool shiii).
- Set different Discord statuses (Online, Idle, Do Not Disturb, Invisible).
- Organize messages with categories for better management.  
  ![i hate it](https://raw.githubusercontent.com/shxdes69/vencord-animated-Status/main/screenshots/Preview4.png)

### Animation Settings  
![Animation Settings](https://raw.githubusercontent.com/shxdes69/vencord-animated-Status/main/screenshots/Preview3.png)

---

## Notes

- The plugin is still in development, so expect some bugs and unfinished features.
- The plugin is not compatible with the VencordToolbox plugin (we use the same patcher, so yeah).

---

## Usage

Changed now  check the Mute & Deafen area  

![placement](https://raw.githubusercontent.com/shxdes69/vencord-animated-Status/main/screenshots/Preview5.png)

- Open the plugin settings by clicking on the clock in the top right corner of the Discord bar.

---

## Installation

### First Time Setup
Vencord isn't modular, so you'll need to build from source to add custom plugins.  
Check out this guide to get started: [https://docs.vencord.dev/installing/custom-plugins/](https://docs.vencord.dev/installing/custom-plugins/)

---

### One-liner Install Commands (choose based on your shell):

**Bash (Linux/macOS/git-bash):**
```bash
git clone -n --depth=1 --filter=tree:0 https://github.com/shxdes69/vencord-animated-Status && cd vencord-animated-Status && git sparse-checkout set "animated status" --no-cone && git checkout
```

**PowerShell (Windows):**
```powershell
git clone -n --depth=1 --filter=tree:0 https://github.com/shxdes69/vencord-animated-Status; Set-Location vencord-animated-Status; git sparse-checkout init --no-cone; git sparse-checkout set "animated status"; git checkout
```

---

### Manual Install
1. Open your terminal and go to the `src/userplugins` folder (create it if it doesn't exist):
   ```bash
   cd src/userplugins
   ```
2. Clone this repository:
   ```bash
   git clone https://github.com/shxdes69/vencord-animated-Status
   ```
3. Rebuild Vencord following the instructions in the documentation.

---

### How to Update the Plugin
To grab the latest features and bug fixes:
```bash
cd src/userplugins/vencord-animated-Status
git pull
```
Then rebuild Vencord as needed.

---

## Support

If you encounter any issues or have suggestions, open an issue on the GitHub repo.  
You can DM me on Discord: `shxdes0` (ID: `705545572299571220`)

---

## Credits

- [toluschr](https://github.com/toluschr) – Creator of the original BetterDiscord plugin. Got Inspired By It
