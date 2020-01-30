var request = require('request');
const { exec, spawn } = require('child_process');
const cheerio = require('cherio');
const fs = require('fs');
var urlList = [];


links = [
    'gioi-thieu',
    'san-pham-noi-bat',
    'collections/all',
    'san-pham-moi',
    'tin-tuc',
    'lien-he',
    'combo-lau-ky-tu-gia-truyen',
    '404',
    ''
];
for (var i = 0; i < links.length; i++) {
    let path = links[i];
    let downloadUrl = 'https://bo-le-ro.vn/' + path;
    if (path == '') {
         downloadfile = 'index.html';
    } else {
         downloadfile = path + '/index.html';
    }
    exec('mkdir -p ' + path );
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
        let command = `wget -r ${url} -nc -nH`;
        console.log(command);
        // execSync(command);
        let regex = /https:\/\/(.*?)(\/.*)/;
        match = url.match(regex);
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

        regex = /(https:|)\/\/bizweb.dktcdn.net(.*)(\.svg|\.png|\.js|\.css|\.jpg)/;
        do {
            try {
                matches = [...body.match(regex)];
                url = matches[0];
                let file = downloadStaticFile(url);
                // console.log(url, file);
                body = body.replace(url, file);
            } catch (e) {
                url = false;
            } finally {

            }

        } while (url);

        regex = /(https:|)\/\/stats.bizweb.vn(.*?)Logging/;
        do {
            // console.log('body', body);
            try {
                matches = [...body.match(regex)];
                url = matches[0];
                let file = downloadStaticFile(url);
                // console.log(url, file);
                body = body.replace(url, file);
            } catch (e) {
                url = false;
            } finally {

            }

        } while (url);

        fs.writeFileSync(file, body);

    });
}
