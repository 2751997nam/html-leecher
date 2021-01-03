var request = require('request');
const { exec, spawn, execSync } = require('child_process');
const fs = require('fs-extra');
const fetch = require('node-fetch');

var beautify_js = require('js-beautify'); // also available under "js" export
var beautify_css = require('js-beautify').css;
var beautify_html = require('js-beautify').html;
const puppeteer = require('puppeteer');
const browser = null;
const mode = 'fetch';
// const mode = 'puppeteer';

const links = [
    {
        link: '',
        saveName: 'home.html'
    },
    {
        link: 'thu-vien',
        saveName: 'search.html'
    },
    {
        link: 'thu-vien',
        saveName: 'product.html'
    },
    {
        link: 'blog/',
        saveName: 'post-list.html'
    },
    {
        link: 'blog/sabudo-chat-luong-quoc-te-cho-bua-an-gia-dinh-viet.html',
        saveName: 'post.html'
    },
    {
        link: 'lien-he/',
        saveName: 'contact.html'
    },
];

const domain = 'https://sabudo.vn/';
const theme = 'sabudo';

async function start() {
    fs.emptyDirSync('theme');
    for (var i = 0; i < links.length; i++) {
        let downloadfile = links[i].saveName;
        let downloadUrl = domain + links[i].link;
        if (mode == 'fetch') {
            await downloadOnePage(downloadUrl, downloadfile);
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
            else if (url[0] == '/' &&  url[1] != '/') {
                url = domain + url;
            }
            let body = await new Promise((resolve, reject) => {
                request(url, function (error, response, body) {
                    resolve(body);
                }, function (error) {
                    console.log(error);
                    reject('');
                });
            }).catch((error) => {
                console.log(error);
                return '';
            });
            let regex = /http:\/\/(.*?)(\/.*)/;
            let regex2 = /https:\/\/(.*?)(\/.*)/;
            let match = url.match(regex);
            if (!match) {
                match = url.match(regex2);
            }
            if (match && match.length > 2 ) {
                let file = match[2];
                file = file.substring(1);
                let path = file.substring(0, file.lastIndexOf('/'));
                if (!fs.existsSync('theme/' + theme + '/' + path)) {
                    console.log('mkdirSync', 'theme/' + theme + '/' + path);
                    fs.mkdirSync('theme/' + theme + '/' + path, { recursive: true });
                }
                fs.writeFileSync('theme/' + theme + '/' + file, body);
                retval = 'themes/' + theme + '/' + file;
            } else {
                console.log('error', url);
                retval = url;
            }
        }
        console.log(retval);
        return retval;
    } catch (e) {
        console.log(e);
        return false;
    } finally {

    }
}

async function downloadOnePage(url, file) {
    await fetch(url)
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

    await parseBody(data, file, true);
}

async function downloadFileByPuppeteer(url) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    page.setViewport({ width: 1920, height: 1080 });
    try {
        let retval = url;
        if (url) {
            if (url.indexOf("?") > -1 ) {
                url = url.substr(0, url.indexOf("?"))
            }
            if (url[0] == '/' &&  url[1] == '/') {
                url = 'http:' + url;
            }
            let regex = /http:\/\/(.*?)(\/.*)/;
            let regex2 = /https:\/\/(.*?)(\/.*)/;
            let match = url.match(regex);
            if (!match) {
                match = url.match(regex2);
            }
            if (match && match.length > 2 ) {
                let file = match[2];
                file = file.substring(1);
                let path = file.substring(0, file.lastIndexOf('/'));
                if (!fs.existsSync('theme/' + path)) {
                    fs.mkdirSync('theme/' + path, { recursive: true });
                }
                page.target().createCDPSession().then((client) => {
                    return client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: 'theme/' + path})
                });
                fs.writeFileSync('theme/' + file, body);
                retval = match[2];
            } else {
                console.log('error', url);
                retval = url;
            }
            await page.goto(url, { waitUntil: 'networkidle0' });
        }
        console.log(retval);
        return retval;
    } catch (e) {
        console.log(e);
        return false;
    } finally {

    }
    await browser.close();
}

async function parseBody(body, file, usePuppeteer = false) {
    let regexes = [
        // /(https:|)\/\/thanglongpack.com.vn([^\"\)\'\,]+)(\.svg|\.png|\.js|\.css|\.jpg)/,
        // /(http:|)\/\/thanglongpack.com.vn([^\"\)\'\,]+)(\.svg|\.png|\.js|\.css|\.jpg)/,
        /(https:|http:|)(\/\/sabudo.vn)([^\"\)\'\,]+)(\.svg|\.png|\.js|\.css|\.jpg)/,
        // /(https:|)\/\/dbcpu9gznkryx.cloudfront.net([^\"\)\'\,]+)(\.svg|\.png|\.js|\.css|\.jpg)/
    ];
    for (let i = 0; i < regexes.length; i++) {
        let regex = regexes[i];
        do {
            try {
                matches = [...body.match(regex)];
                url = matches[0];
                let temp = await downloadStaticFile(url);
                // console.log(url, file);
                body = body.replace(url, temp);
            } catch (e) {
                url = false;
            } finally {

            }

        } while (url);
    }
    body = body.replace('themes/' + theme, '/themes/' + theme);
    body = beautify_html(body);
    fs.writeFileSync('theme/' + file, body);
}

start();
