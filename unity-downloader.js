#!/usr/bin/env node

/*
  unity-downloader

  Command-line tool to download Unity releases from their CDN. Given one or more
  platform names (linux/mac/windows), it downloads all published releases for
  that platform into a `unity-versions` dir in the current working dir.
*/

// Wrote this in February 2020 as a yak-shave of a friend's Python script, about
// a week before Train Jam 2020 was cancelled due to the incoming COVID-19
// pandemic.
//
// Forgot about it, fired it up January 2024. Script still works, pandemic still
// happening. Some things never change.

const fs = require('fs');
const path = require('path');
const c = require('ansi-colors');
const fetch = require('node-fetch');
const downit = require('downit');
const ProgressBar = require('progress');
const md5file = require('md5-file/promise');

const URLS = {
  linux: 'https://public-cdn.cloud.unity3d.com/hub/prod/releases-linux.json',
  windows: 'https://public-cdn.cloud.unity3d.com/hub/prod/releases-win32.json',
  mac: 'https://public-cdn.cloud.unity3d.com/hub/prod/releases-darwin.json'
};

const OUTPUT_DIRNAME = 'unity-versions';
const OUTPUT_PATH = path.join(process.cwd(), OUTPUT_DIRNAME);

async function main() {
  const platforms = Array.from(new Set(process.argv.filter(arg => Object.keys(URLS).includes(arg))));

  if (!platforms.length) {
    console.log(c.bold.red('No platform(s) provided!'));
    console.log();
    console.log(c.bold.cyan(`Usage: node unity-downloader.js ${Object.keys(URLS).join('|')} [${Object.keys(URLS).join('|')}] ...`));
    console.log();
    console.log(c.grey('Example:') + c.white(' node unity-downloader.js linux mac'));
    process.exit(1);
  }

  console.log(c.bold.yellow(`Downloading Unity releases for ${platforms.join(' and ')} to ${OUTPUT_PATH}...`));

  if (!fs.existsSync(OUTPUT_PATH)) fs.mkdirSync(OUTPUT_PATH);

  const releases = await fetchReleases(platforms);

  downloadReleases(releases);
}

async function fetchReleases(platforms) {
  const releases = {};

  for (const platform of platforms) {
    const manifestFile = path.join(OUTPUT_PATH, `${platform}-releases.json`);

    console.log(c.bold.cyan(`Fetching list of ${platform} releases...`));
    const res = await fetch(URLS[platform]);

    if (!res.ok) {
      console.log(c.red(`Failed to fetch ${platform} releases: ${res.status} ${res.statusText}`));
      continue;
    }

    const json = await res.json();
    fs.writeFileSync(manifestFile, JSON.stringify(json, null, '  '));

    for (const channel in json) {
      // console.log(channel);
      for (const item of json[channel]) {
        // console.dir(item);
        releases[`unity-${platform}-${item.version}`] = {
          platform,
          version: item.version,
          url: item.downloadUrl,
          size: item.downloadSize,
          modules: item.modules,
          checksum: item.checksum
        };
      }
    }
  }

  return releases;
}


async function downloadReleases(releases) {
  for (const id in releases) {
    const release = releases[id];
    const outPath = path.join(OUTPUT_PATH, id);
    if (!fs.existsSync(outPath)) fs.mkdirSync(outPath);

    console.log(c.grey('====================================================='));
    console.log(c.bold.yellow(`Downloading ${id}...`));
    await downloadFile2(release.url, release.size, outPath, release.checksum);

    for (const mod of release.modules) {
      const moduleGroupPath = path.join(outPath, mod.id.split('-')[0]);
      if (!fs.existsSync(moduleGroupPath)) fs.mkdirSync(moduleGroupPath);

      console.log(c.bold.yellow(`Downloading module '${mod.id}' (${mod.name})...`));
      await downloadFile2(mod.downloadUrl, mod.downloadSize, moduleGroupPath, mod.checksum);
    }
  }
}

async function downloadFile2(url, size, outPath, checksum) {
  let filename = path.basename(url);
  let bar = null;
  const fullOutPath = path.join(outPath, path.basename(url));
  const fileDiskSize = fs.existsSync(fullOutPath) ? fs.statSync(fullOutPath).size : 0;
  let lastDownloadSize = fileDiskSize;

  if (fileDiskSize >= size) return Promise.resolve();

  console.log(c.bold.blue(`  ${path.basename(url)}`));

  return downit(url, fullOutPath, {
    headers: {
      'User-Agent': 'unity-downloader (https://github.com/mildmojo/unity-downloader)'
    },
    onprogress: (got, total) => {
      if (got <= lastDownloadSize) return;
      if (!bar) bar = createProgressBar({ curr: lastDownloadSize, total: total });
      const elapsedSecs = (Date.now() - bar.start) / 1000;
      const sessionTotalSize = total - fileDiskSize;
      const sessionProgress = got - fileDiskSize;
      // console.log('delta: ' + (got - lastDownloadSize));
      bar.tick(got - lastDownloadSize, {
        curMB: Math.ceil(got / 1024 / 1024),
        totMB: Math.ceil(total / 1024 / 1024),
        ratKB: Math.round((sessionProgress / 1024) / elapsedSecs),
        resumeETA: Math.round(elapsedSecs * (sessionTotalSize / sessionProgress - 1))
      });
      lastDownloadSize = got;
    },
    // Sometimes the manifest size differs from the server-reported size.
    // onresponse: res => size = Number(res.headers['content-length']) + fileDiskSize
    // onresponse: res => {
    //   console.log(res.headers['content-length']);
    //   console.log(Number(res.headers['content-length']) + fileDiskSize);
    //   size = Number(res.headers['content-length']) + fileDiskSize;
    //   bar = createProgressBar({ curr: fileDiskSize, total: size });
    // }
  }).then(async () => {
    if (checksum) {
      const sum = await md5file(fullOutPath);
      if (sum === checksum) {
        console.log(c.cyan(`\nFinished '${filename}'.`));
      } else {
        console.log(c.bold.red(`\nChecksums don't match for '${fullOutPath}'!`));
      }
    } else {
      console.log(c.cyan(`\nFinished '${filename}'.`));
    }
  }).catch(err => {
    console.log(c.bold.red(`\nFailed downloading '${filename}': ${err}`));
  });
}

function createProgressBar(opts) {
  const bar = new ProgressBar('  [:bar] :curMB/:totMB MiB :ratKB KiBps :percent :resumeETAs remaining', {
    width: 40,
    ...opts
  });
  bar.start = Date.now();
  return bar;
}

if (require.main === module) {
  main();
}
