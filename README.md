# unity-downloader

Small script to download published installers for the [Unity3d game engine](https://unity3d.com)
by platform.

Developed in February 2020 right before [Train Jam](https://trainjam.com/)
2020 was cancelled due to the incoming pandemic. It's really handy to have all
offline installers for all versions/platforms when you're about to make games
with ~strangers~ new friends for several days without reliable internet access.

Tested January 2024 and it still works. Cleaned it up a smidge. COVID's peaking
again, too. Wear an N95 respirator in public indoor spaces & stay safe, friends.

> [!NOTE]
> Status: **FINISHED**
> <br><br>
> It works as intended. I probably won't invest any more development time.
> **Feel free to fork it** to do what you want!

## Features

- Downloads all Unity releases for one or more platforms from the same CDN used
  by [Unity Hub](https://unity.com/unity-hub).
- Resumes download progress if interrupted
- Colorful output
- Pretty progress bars

## Usage

First, install dependencies:

```
yarn install
```

Download all published releases and addons for Linux into a `unity-versions/`
folder in the current directory:

```
node unity-downloader.js linux
```

Platform may be `linux`, `mac`, or `windows`. You can specify one, two, or all
three platforms at once.

Grab Linux and Mac releases:

```
node unity-downloader.js linux mac
```
