# unity-downloader

Small script to download published versions of [Unity](https://unity3d.com) by
platform. Developed in February 2020 right before Train Jam 2020 was cancelled
due to the incoming pandemic.

Tested January 2024 and it still works. Cleaned it up a smidge. COVID's peaking
again, too. Wear an N95 respirator in public indoor spaces & stay safe, friends.

## Features

- Downloads all releases for one or more platforms
- Resumes download progress if interrupted
- Colorful output
- Progress bars

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
