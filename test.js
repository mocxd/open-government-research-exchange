var Crawler = require("simplecrawler");

Crawler.crawl("http://localhost:3000/")
    .on("fetchcomplete", function(queueItem) {
        console.log("Completed fetching resource:", queueItem.url);
    });