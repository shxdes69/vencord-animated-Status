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

## Usage

(update) Changed now  check the Mute & Deafen area  

![placement](https://raw.githubusercontent.com/shxdes69/vencord-animated-Status/main/screenshots/Preview5.png)

- Open the plugin settings by clicking on the clock in the top right corner of the Discord bar.

---

## Installation

### First Time Setup
Vencord isn't modular, so you'll need to build from source to add custom plugins.  
Check out this guide to get started: [https://docs.vencord.dev/installing/custom-plugins/](https://docs.vencord.dev/installing/custom-plugins/)


### Installation
1. Open your terminal and go to the `src/userplugins` folder (create it if it doesn't exist):
   ```bash
   cd src/userplugins
   ```
2. Clone this repository:
   ```bash
   Remove-Item -Recurse -Force "vencord-animated-status" -ErrorAction SilentlyContinue; mkdir "vencord-animated-status"; git clone --no-checkout https://github.com/shxdes69/vencord-animated-Status temp; cd temp; git sparse-checkout init --cone; git sparse-checkout set "animated status"; git checkout; Move-Item "animated status/*" "../vencord-animated-status/" -Force; cd ..; Remove-Item -Recurse -Force temp
   ```
3. Rebuild Vencord following the instructions in the documentation.(pnpm build then pnpm inject)

---

## Support

If you encounter any issues or have suggestions, open an issue on the GitHub repo.  
You can DM me on Discord: `shxdes0` (ID: `705545572299571220`)

---

## Credits

- [toluschr](https://github.com/toluschr) – Creator of the original BetterDiscord plugin. Got Inspired By It
