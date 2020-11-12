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
    // {
    //     link: 'projects/',
    //     saveName: 'search.html'
    // },
    // {
    //     link: 'day-dai/',
    //     saveName: 'product.html'
    // },
    // {
    //     link: 'dich-vu/',
    //     saveName: 'post-list.html'
    // },
    // {
    //     link: 'dich-vu-luu-kho/',
    //     saveName: 'post.html'
    // },
    {
        link: 'lien-he/',
        saveName: 'contact.html'
    },
];

const domain = 'http://vinhomes-smart-city.vn/';
const theme = 'sotec';

async function start() {
    fs.emptyDirSync('theme');
    for (var i = 0; i < links.length; i++) {
        let downloadfile = links[i].saveName;
        let downloadUrl = domain + links[i].link;
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
                url = 'http:' + url;
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
                if (!fs.existsSync('theme/' + path)) {
                    fs.mkdirSync('theme/' + path, { recursive: true });
                }
                fs.writeFileSync('theme/' + file, body);
                retval = match[2];
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
        /(https:|)\/\/vinhomes-smart-city.vn([^\"\)\'\,]+)(\.svg|\.png|\.js|\.css|\.jpg)/,
        /(http:|)\/\/vinhomes-smart-city.vn([^\"\)\'\,]+)(\.svg|\.png|\.js|\.css|\.jpg)/,
        /(https:|)\/\/vinhomessmartcitys.com.vn([^\"\)\'\,]+)(\.svg|\.png|\.js|\.css|\.jpg)/,
        /(http:|)\/\/vinhomessmartcitys.com.vn([^\"\)\'\,]+)(\.svg|\.png|\.js|\.css|\.jpg)/,
        // /(https:|)\/\/dbcpu9gznkryx.cloudfront.net([^\"\)\'\,]+)(\.svg|\.png|\.js|\.css|\.jpg)/
    ];
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

var linkess = [
    'http://vinhomes-smart-city.vn/wp-content/themes/bridge/css/webkit_stylesheet.css?ver=4.9.16',
    'http://vinhomes-smart-city.vn/wp-content/themes/bridge/css/font-awesome/fonts/fontawesome-webfont.woff2?v=4.7.0',
    'http://vinhomes-smart-city.vn/wp-content/plugins/Ultimate_VC_Addons/assets/min-js/tabs.min.js?ver=3.17.0',
    'http://vinhomes-smart-city.vn/wp-content/plugins/Ultimate_VC_Addons/assets/min-js/tabs-accordion.min.js?ver=3.17.0',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/tong-quan-smart-city.jpg',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/logo-Sapphire-Parkville.png',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/sp-4.jpg',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/S4.01-1024x575.jpg',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/s4.03.jpg',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/tong-quan-sp-3.jpg',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/s3.01-1.jpg',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/s3.02.jpg',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/s3.03.jpg',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/sp-1-2.png',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/smar-1.jpg',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/smart-2.jpg',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/mat-bang-can-studio-1024x748.png',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/mat-bang-can-1pn1-1024x748.png',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/mat-bang-can-2pn1-1024x748.png',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/imperia-smart-city.jpg',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2019/05/pdf-e1557288829575.png',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/mat-bang-can-3pn-1024x796-1024x748.png',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/05/bang-hang-1552320765.png',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/td1.jpg',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/td2.png',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/td3.png',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/td4.png',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/td5.png',
    'http://vinhomes-smart-city.vn/wp-content/themes/bridge/css/font-awesome/fonts/fontawesome-webfont.woff?v=4.7.0',
    'http://vinhomes-smart-city.vn/wp-content/uploads/smile_fonts/Defaults/Defaults.woff?rfa9z8',
    'http://vinhomes-smart-city.vn/wp-content/plugins/Ultimate_VC_Addons/assets/min-js/tabs.min.js?ver=3.17.0',
    'http://vinhomes-smart-city.vn/wp-content/themes/bridge/css/font-awesome/fonts/fontawesome-webfont.ttf?v=4.7.0',
    'http://vinhomes-smart-city.vn/wp-content/plugins/Ultimate_VC_Addons/assets/min-js/tabs-accordion.min.js?ver=3.17.0',
    'http://vinhomes-smart-city.vn/wp-content/plugins/Ultimate_VC_Addons/assets/min-css/ajax-loader.gif',
    'http://vinhomes-smart-city.vn/wp-content/plugins/contact-form-7/images/ajax-loader.gif',
    'http://vinhomes-smart-city.vn/wp-content/plugins/Ultimate_VC_Addons/assets/css/fonts/ult-silk.woff',
    'http://vinhomes-smart-city.vn/wp-content/plugins/Ultimate_VC_Addons/assets/css/fonts/ult-silk.ttf',
    'http://vinhomes-smart-city.vn/wp-content/themes/bridge/css/webkit_stylesheet.css?ver=4.9.16',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/sp-4-1024x576.jpg',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/tong-quan-smart-city-1024x603.jpg',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/s4.03-1024x768.jpg',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/tong-quan-sp-3-1024x768.jpg',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/vi-tri-vinhomes-smart-1024x576.png',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/line-smart-1000x68.png',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/s3.03-1024x768.jpg',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/sp-1-2-1024x556.png',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/smar-1-1024x632.jpg',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/s3.01-1-1024x768.jpg',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/smart-2-1024x632.jpg',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/06/s3.02-1024x768.jpg',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/05/bang-hang-1552320765-1024x470.png',
    'http://vinhomes-smart-city.vn/wp-content/uploads/2020/03/icon-bang-gia.png'
];

// start();
for (let link of linkess) {
    downloadStaticFile(link);
}
