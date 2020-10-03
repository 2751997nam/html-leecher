var request = require('request');
const { exec, spawn, execSync } = require('child_process');
const fs = require('fs-extra');
const fetch = require('node-fetch');

var beautify_js = require('js-beautify'); // also available under "js" export
var beautify_css = require('js-beautify').css;
var beautify_html = require('js-beautify').html;
const puppeteer = require('puppeteer');
const browser = null;
const mode = 'puppeteer';

const links = [
    // {
    //     link: '',
    //     saveName: 'home.html'
    // },
    // {
    //     link: 'search/a',
    //     saveName: 'search.html'
    // },
    // {
    //     link: 'shop/women',
    //     saveName: 'category.html'
    // },
    // {
    //     link: 'campaigns/-/-/shop/women.t-shirts/hoang-gift-for-wife?ase_source=product-type&retailProductCode=5675136AF7B1B2-B5E0D214A235-GS0-TC5-WHT',
    //     saveName: 'product.html'
    // },
    // {
    //     link: 'blog',
    //     saveName: 'post-list.html'
    // },
    // {
    //     link: 'blog/2020/09/17/spookiest-halloween-clothes-and-apparel',
    //     saveName: 'post.html'
    // },
    {
        link: 'contact',
        saveName: 'post-list.html'
    },
    {
        link: 'terms',
        saveName: 'post.html'
    },
];

async function start() {
    fs.emptyDirSync('theme');
    for (var i = 0; i < links.length; i++) {
        let downloadfile = links[i].saveName;
        let downloadUrl = 'https://teechip.com/' + links[i].link;
        if (mode == 'fetch') {
            downloadOnePage(downloadUrl, downloadfile);
        } else if (mode == 'puppeteer')  {
            await downloadByPuppeteer(downloadUrl, downloadfile);
        }
    }
}

async function downloadStaticFile (url) {
    try {
        let retval = url;
        if (url) {
            if (url.indexOf("?") > -1 ) {
                url = url.substr(0, url.indexOf("?"))
            }
            if (url[0] == '/' &&  url[1] == '/') {
                url = 'https:' + url;
            }
            let body = await new Promise((resolve, reject) => {
                request(url, function (error, response, body) {
                    resolve(body);
                }, function (error) {
                    reject('');
                });
            }).catch((error) => {
                return '';
            });
            let regex = /https:\/\/(.*?)(\/.*)/;
            let match = url.match(regex);
            if (match && match.length > 2 ) {
                let file = match[2];
                file = file.substring(1);
                let path = file.substring(0, file.lastIndexOf('/'));
                if (!fs.existsSync('theme/' + path)) {
                    fs.mkdirSync('theme/' + path, { recursive: true });
                }
                fs.writeFileSync('theme/' + file, body);
                retval = match[2]
            } else {
                retval = url;
            }
        }
        return retval;
    } catch (e) {
        return false;
    } finally {

    }
}

function downloadOnePage(url, file) {
    fetch(url)
    .then(res => res.text())
    .then(async function (body) {
        await parseBody(body, file);
    });
}

async function downloadByPuppeteer(url, file) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url, { waitUntil: 'networkidle0' });
    let data = await page.evaluate(() => document.querySelector('*').outerHTML);
    await browser.close();

    await parseBody(data, file);
}

async function parseBody(body, file) {
    let regexes = [
        /(https:|)\/\/teechip.com([^\"\)\'\,]+)(\.svg|\.png|\.js|\.css|\.jpg)/,
        /(https:|)\/\/cdn.32pt.com([^\"\)\'\,]+)(\.svg|\.png|\.js|\.css|\.jpg)/,
        /(https:|)\/\/dbcpu9gznkryx.cloudfront.net([^\"\)\'\,]+)(\.svg|\.png|\.js|\.css|\.jpg)/
    ]
    for (let i = 0; i < regexes.length; i++) {
        let regex = regexes[i];
        do {
            try {
                matches = [...body.match(regex)];
                url = matches[0];
                // console.log(url);
                let temp = await downloadStaticFile(url);
                // console.log(url, file);
                body = body.replace(url, temp);
            } catch (e) {
                url = false;
            } finally {

            }

        } while (url);
    }
    body = beautify_html(body);
    fs.writeFileSync('theme/' + file, body);
}

start();
