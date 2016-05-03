var Crawler = require('simplecrawler');
var http    = require('http');
var path    = require('path');
var express = require('express');
var colors  = require('colors');


var app = express();
var server = http.createServer(app);

var errors = [];

app.use(express.static('public'));

app.listen(3000, function () {
  console.log('[express] listening on port 3000');
});

var crawler = new Crawler('localhost', '/', 3000);

crawler.interval = 0;
crawler.maxConcurrency = 5;
crawler.parseHTMLComments = false;

crawler.on('fetchcomplete', function(q, buffer, r) {
    console.log('[simplecrawler] Fetch:'.cyan, q.url, '-',
        r.statusCode == 200 ? r.statusCode.toString().green : r.statusCode.toString().gray,
        r.statusMessage == 'OK' ? r.statusMessage.green.bold.underline : r.statusMessage.yellow);
});

crawler.on('crawlstart', function(q) {
    console.log('[simplecrawler] Starting crawl...'.bgBlack.white);
});

crawler.on('queueadd', function(q) {
    console.log('[simplecrawler] Queue:'.cyan, q.url);
});

crawler.on('complete', function(q) {
    console.log('[simplecrawler] Done.'.bgBlack.white, 'Fetched',
        crawler.queue.complete().toString().bgBlack.white, 'items'.bgBlack);

    if (errors.length > 0) {
        console.log('[simplecrawler] Linkcheck encountered'.red,
            errors.length.toString().red.bold.underline, 'error(s).'.red);
        for (err in errors) {
            console.log('[simplecrawler]', ('Error #' + (Number(err) + 1) + ': ').red.bold);
            console.log(errors[err].message.red);
        }
        console.log('[simplecrawler] Throwing last error...'.red);
        throw new Error(errors.pop());
    } else {
        console.log('[simplecrawler] Linkcheck OK'.green);
        return 0;
    }
});

crawler.on('fetch404', function(q, r) {
    console.log('[simplecrawler] HTTP 404:'.red.bold, q.url.red, '(', r.req._headers.referer.red, ')');
    e = new Error('404, linked resource not found: ' + q.url + '\n\t( via ' + r.req._headers.referer + ' )');
    errors.push(e);
});

crawler.on('fetch410', function(q, r) {
    console.log('[simplecrawler] HTTP 410:'.red.bold, q.url.red);
    e = new Error('410, linked resource moved: ' + q.url + '\n\t( via ' + r.req._headers.referer + ' )');
    errors.push(e);
});

crawler.on('fetcherror', function(q, r) {
    console.log('[simplecrawler] Fetch Error:'.red.bold, q.url.red);
    e = new Error(r.statusCode + ' ' + r.statusMessage + ' (fetch error): ' + q.url);
    errors.push(e);
});

crawler.on('queueerror', function(q) {
    console.log('[simplecrawler] Queue Error:'.red.bold, q.url.red);
    e = new Error('Queueing error: ' + q.url);
    errors.push(e);
});

// don't fetch urls linked inside css
crawler.addFetchCondition(function(parsedURL, queueItem) {
    return !queueItem.path.match(/\.css$/i);
});

crawler.start();
