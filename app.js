var request = require('request');
const { exec, spawn } = require('child_process');
const cheerio = require('cherio');
const fs = require('fs');
var wget = require('node-wget');
var urlList = [];
const TaskQueue = require('./taskQueue');
const CrawlQueueObj = new TaskQueue(1);

const path = 'san-pham-noi-bat';

const downloadfile = 'gioi-thieu/index.html';
const downloadUrl = 'https://bizmart-theme.mysapo.net/gioi-thieu';

function downloadStaticFile (url) {
    let retval = url;
    if (url) {
        if (url.indexOf("?") > -1 ) {
            url = url.substr(0, url.indexOf("?"))
        }
        if (url[0] == '/' &&  url[1] == '/') {
            url = 'https:' + url;
        }
        // console.log("url", url);
        let command = `wget -r ${url} -nH`;
        exec(command);
        let regex = /https:\/\/(.*?)(\/.*)/;
        match = url.match(regex);
        if (match && match.length > 2 ) {
            retval = match[2]
        } else {
            retval = url;
        }
    }
    return retval;


}

request(downloadUrl, async function (error, response, body) {

    regex = /(https:|)\/\/bizweb.dktcdn.net(.*?)(.png|.js|.css|.jpg)/;
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

    fs.writeFileSync(downloadfile, body);

    const $ = cheerio.load(body);
    $('a').each(function(i, elem) {

    });

});
