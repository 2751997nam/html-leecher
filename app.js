var request = require('request');
const { exec, spawn, execSync } = require('child_process');
const cheerio = require('cherio');
const fs = require('fs');
var urlList = [];

var beautify_js = require('js-beautify'); // also available under "js" export
var beautify_css = require('js-beautify').css;
var beautify_html = require('js-beautify').html;

links = [
    {
        link: '',
        saveName: 'home.html'
    },
    {
        link: 'search/a',
        saveName: 'search.html'
    },
    {
        link: 'shop/women',
        saveName: 'category.html'
    },
    {
        link: 'campaigns/-/-/shop/women.t-shirts/hoang-gift-for-wife?ase_source=product-type&retailProductCode=5675136AF7B1B2-B5E0D214A235-GS0-TC5-WHT',
        saveName: 'product.html'
    },
    {
        link: 'blog',
        saveName: 'post-list.html'
    },
    {
        link: 'blog/2020/09/17/spookiest-halloween-clothes-and-apparel',
        saveName: 'post.html'
    },
];
for (var i = 0; i < links.length; i++) {
    let downloadfile = links[i].saveName;
    let downloadUrl = 'https://teechip.com/' + links[i].link;

    downloadOnePage(downloadUrl, downloadfile);

}

function downloadStaticFile (url) {
  try {
    let retval = url;
    if (url) {
        if (url.indexOf("?") > -1 ) {
            url = url.substr(0, url.indexOf("?"))
        }
        if (url[0] == '/' &&  url[1] == '/') {
            url = 'https:' + url;
        }
        // let command = `wget -r ${url} -nc -nH`;
        // console.log(command);
        // execSync(command);
        request(url, async function (error, response, body) {
            let match = url.match(regex);
            if (match && match.length > 2 ) {
                let file = match[2];
                file = file.substring(1);
                let path = file.substring(0, file.lastIndexOf('/'));
                if (!fs.existsSync('theme/' + path)) {
                    fs.mkdirSync('theme/' + path, { recursive: true });
                }
                fs.writeFileSync('theme/' + file, body);
            }
        });
        let regex = /https:\/\/(.*?)(\/.*)/;
        let match = url.match(regex);
        if (match && match.length > 2 ) {
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
    request(url, async function (error, response, body) {

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
                    let file = downloadStaticFile(url);
                    // console.log(url, file);
                    body = body.replace(url, file);
                } catch (e) {
                    url = false;
                } finally {
    
                }
    
            } while (url);
        }
        body = beautify_html(body);
        fs.writeFileSync('theme/' + file, body);

    });
}
