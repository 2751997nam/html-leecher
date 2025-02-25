var request = require('request');
const { exec, spawn, execSync } = require('child_process');
const fs = require('fs-extra');
const fetch = require('node-fetch');

var beautify_js = require('js-beautify'); // also available under "js" export
var beautify_css = require('js-beautify').css;
var beautify_html = require('js-beautify').html;
const browser = null;
const mode = 'fetch';
const https = require('https')

const links = [
    {
        link: 'https://pixner.net/boleto/demo/index-2.html',
        saveName: 'home.html'
    },
    {
        link: 'https://pixner.net/boleto/demo/movie-grid.html',
        saveName: 'movie-grid.html'
    },
    // {
    //     link: 'https://www.teeshirtpalace.com/pages/search-results-page?q=cat',
    //     saveName: 'search.html'
    // },
    {
        link: 'https://pixner.net/boleto/demo/movie-details.html',
        saveName: 'movie-details.html'
    },
    {
        link: 'https://pixner.net/boleto/demo/404.html',
        saveName: '404.html'
    },
    {
        link: 'https://pixner.net/boleto/demo/movie-ticket-plan.html',
        saveName: 'movie-ticket-plan.html'
    },
    {
        link: 'https://pixner.net/boleto/demo/movie-seat-plan.html',
        saveName: 'movie-seat-plan.html'
    },
    {
        link: 'https://pixner.net/boleto/demo/movie-checkout.html',
        saveName: 'movie-checkout.html'
    },
    {
        link: 'https://pixner.net/boleto/demo/popcorn.html',
        saveName: 'movie-food.html'
    },
    {
        link: 'https://pixner.net/boleto/demo/events.html',
        saveName: 'events.html'
    },
    {
        link: 'https://pixner.net/boleto/demo/event-details.html',
        saveName: 'event-details.html'
    },
    {
        link: 'https://pixner.net/boleto/demo/event-speaker.html',
        saveName: 'event-speaker.html'
    },
    {
        link: 'https://pixner.net/boleto/demo/event-ticket.html',
        saveName: 'event-ticket.html'
    },
    {
        link: 'https://pixner.net/boleto/demo/event-checkout.html',
        saveName: 'event-checkout.html'
    },
    {
        link: 'https://pixner.net/boleto/demo/about.html',
        saveName: 'about.html'
    },
    {
        link: 'https://pixner.net/boleto/demo/apps-download.html',
        saveName: 'apps-download.html'
    },
    {
        link: 'https://pixner.net/boleto/demo/sign-in.html',
        saveName: 'sign-in.html'
    },
    {
        link: 'https://pixner.net/boleto/demo/sign-up.html',
        saveName: 'sign-up.html'
    },
    {
        link: 'https://pixner.net/boleto/demo/contact.html',
        saveName: 'contact.html'
    }
];

const domain = 'https://pixner.net/boleto/demo';
const theme = 'boleto';

async function start() {
    fs.emptyDirSync('public');
    for (var i = 0; i < links.length; i++) {
        let downloadfile = links[i].saveName;
        let downloadUrl = links[i].link;
        console.log('downloadUrl', downloadUrl);
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
            retval = await new Promise((resolve, reject) => {
                https.get(url, response => {
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
                        if (!fs.existsSync('public/' + path)) {
                            console.log('mkdirSync', 'public/' + path);
                            fs.mkdirSync('public/' + path, { recursive: true });
                        }
                        response.pipe(fs.createWriteStream('public/' + file));
                        
                        retval = '/' + file;
                    } else {
                        console.log('error', url);
                        retval = url;
                    }
                    resolve(retval);
                }, function (error) {
                    console.log(error);
                    reject('');
                });
            }).catch((error) => {
                console.log(error);
                return '';
            });

        }
        console.log('retval', retval);
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
                if (!fs.existsSync('public/' + path)) {
                    fs.mkdirSync('public/' + path, { recursive: true });
                }
                page.target().createCDPSession().then((client) => {
                    return client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: 'public/' + path})
                });
                fs.writeFileSync('public/' + file, body);
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
        // /(https:|http:|)\/\/cdn.shopify.com([^\"\)\'\,]+)(\.svg|\.png|\.js|\.css|\.jpg|\.jpeg)/,
        /(https:|http:|)\/\/pixner.net([^\"\)\'\,]+)(\.svg|\.js|\.css|\.svg|\.png|\.jpg|\.jpeg)/,
        /src=\"assets([^\"\)\'\,]+)(\.svg|\.js|\.css|\.jpg|\.jpeg|\.svg|\.png)/,
        /src=\"\.\/assets([^\"\)\'\,]+)(\.svg|\.js|\.css|\.jpg|\.jpeg|\.svg|\.png)/,
        /href=\"assets([^\"\)\'\,]+)(\.svg|\.js|\.css|\.jpg|\.jpeg|\.svg|\.png)/,
        /href=\"\.\/assets([^\"\)\'\,]+)(\.svg|\.js|\.css|\.jpg|\.jpeg|\.svg|\.png)/,
        // /(https:|)\/\/dbcpu9gznkryx.cloudfront.net([^\"\)\'\,]+)(\.svg|\.png|\.js|\.css|\.jpg)/
    ];
    for (let i = 0; i < regexes.length; i++) {
        let regex = regexes[i];
        do {
            try {
                matches = [...body.match(regex)];
                url = matches[0];
                let oldUrl = url;
                // console.log('oldUrl', oldUrl);
                const prefixes = ['src="', 'href="'];
                for (let prefix of prefixes) {
                    if (url.indexOf(prefix) === 0) {
                        url = url.replace(prefix, '');
                        url = url.replace('./', '');
                        oldUrl = url;
                        if (url.indexOf('/') === 0) {
                            url = 'https://pixner.net' + url;
                        } else {
                            url = domain + '/' + url;
                        }
                    }
                }
                if (url.indexOf('http') !== 0) {
                    if (url.indexOf('//') === 0) {
                        url = 'https:' + url;
                    } else {
                        url = 'https://' + url;
                    }
                }
                url = url.replaceAll('\\', '/');
                url = url.replace('http://', 'https://');
                // url = url.replace('https://teeshirtpalace.com', 'https://www.teeshirtpalace.com')

                console.log('url', url);
                let temp = await downloadStaticFile(url);
                if (url.indexOf('src="') === 0) {
                    temp = 'src="' + temp;
                }
                // console.log('temp', temp);
                body = body.replaceAll(oldUrl, temp);
            } catch (e) {
                url = false;
            } finally {

            }

        } while (url);
    }
    body = body.replaceAll('themes/' + theme, '/themes/' + theme);
    body = body.replaceAll('https://themes', '/themes');
    body = body.replaceAll('https:///themes', '/themes');
    // body = body.replaceAll('class="', 'className="');
    // body = body.replaceAll('class=\'', 'className=\'');
    body = beautify_html(body);
    body = body.replaceAll(`themes/${theme}/${theme}`, '')
    fs.writeFileSync('public/' + file, body);
}

start();
