# Vencord Animated Status

A plugin for Vencord that allows you to set animated/rotating custom status messages on Discord.

## Features

### Status Messages
![Status Messages](https://raw.githubusercontent.com/shxdes69/vencord-animated-Status/main/screenshots/img1.png)

- Add multiple status messages that will rotate automatically
- Support for regular emojis and Discord/Nitro emojis
- Easy to use interface with Add and Clear All options
- Use Windows emoji picker (Win + .) or copy from unicode table
- Discord/Nitro emoji: Type in Discord chat, select emoji, and copy the ID

### Animation Settings
![Animation Settings](https://raw.githubusercontent.com/shxdes69/vencord-animated-Status/main/screenshots/img2.png)

- Control animation start/stop
- Customize update interval (in seconds) MINIMUM 10 SECS  hard coded to avoid any api abuse 

- Option to randomize status message order
- Simple and intuitive settings interface literally in vencord toolbox lol

## How to Use?

### Plugin Location
![Plugin Location](https://raw.githubusercontent.com/shxdes69/vencord-animated-Status/main/screenshots/img0.png)

You can find the Animated Status plugin in your Vencord Toolbox under "Manage Status Animation"

1. Add your desired status messages in the Messages tab
2. Configure animation settings in the Settings tab
3. Click "Start Animation" to begin rotating through your status messages
4. Use the "Update Interval" slider to control how long each status is displayed
5. Toggle "Randomize Order" if you want your status messages to appear in random order

## Installation

First Time Setup
Vencord is not modular, so you have to build from source to add custom plugins.
Follow this guide for getting set up: https://docs.vencord.dev/installing/custom-plugins/

How to install a plugin
Direct your terminal to the userplugins folder, e.g. cd src/userplugins. If you're confused, read the guide above
Each plugin post will contain a GitHub repo link, like https://github.com/shxdes69/vencord-animated-Status. Copy it
Inside your terminal, run
```
git clone https://github.com/...
```

How to update plugins
You will have to make sure to keep up with the latest changes to fix issues and get new features. You can update a plugin by directing your terminal to its folder (cd src/userplugins/animated-status) and running:
```
git pull
```
## note

i don't plan on adding any more features to this plugin, i made it because i was bored it's a port from this guy's [BetterDiscord-Animated-Status](https://github.com/toluschr/BetterDiscord-Animated-Status)

## credits

- [toluschr](https://github.com/toluschr) for the original plugin
- [shxdes69](https://github.com/shxdes69) for the Vencord port

