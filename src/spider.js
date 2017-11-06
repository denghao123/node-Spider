const fs = require('fs');
const cheerio = require('cheerio');
const request = require('request');
const crypto = require('crypto');
const colors = require('colors');
const libs = {
  md5(str) {
    return crypto.createHash('md5').update(str + '').digest('hex');
  },

  fetch(options, callback) {
    return request({
      url: options.url,
      headers: options.headers || {
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36'
      }
    }, function(err, res, body) {
      if (!err && res.statusCode == 200) {
        typeof callback === 'function' && callback(body)
      }
    })
  },

  downloadTxt(filename, content, callback) {
    fs.writeFile(filename, content, 'utf-8', function(res) {
      typeof callback === 'function' && callback();
    })
  },

  downloadImg(url, filename, callback) {
    if (url && url !== 'undefined') {
      this.fetch({
        url: url
      }).pipe(fs.createWriteStream(filename)).on('close', () => {
        typeof callback === 'function' && callback();
      })
    }
  }
}


/*
 * eg. http://jiandan.net
 */


let targetUrl = 'http://jiandan.net';

libs.fetch({
  url: targetUrl
}, function(html) {
  console.log('抓取中,请稍等~'.green);
  
  let $ = cheerio.load(html);
  let titles = $('#content h2 a');
  let imgs = $('#content .thumbs_b img');
  ([].slice.call(titles)).forEach(function(v, i, arr) {
    // 内页
    let childUrl = v.children[0].parent.attribs.href;
    if (childUrl) {
      libs.fetch({
        url: childUrl
      }, function(childBody) {
        let $child = cheerio.load(childBody, {
          decodeEntities: false
        });
        let $a = $child('#content h1 a');
        let title = $a[0].children[0].data;
        let content = $child('#content .post').html();
        let filename = './data/txt/' + title + '.txt';
        content = content.match(/\<\/h1\>((.|\n)*)\<div class\=\"shang\"\>/)[1];
        libs.downloadTxt(filename, content)
      })
    }

    /*
     * images
     */
    let originalUrl = imgs[i].attribs['data-original'];
    if (originalUrl) {
      let title = titles[i].children[0].data;
      let url = originalUrl.replace(/!custom$/, '');
      let image_url = 'http:' + url;
      let filename = './data/image/' + libs.md5(url) + '.jpg';

      libs.downloadImg(image_url, filename)
    }
  })
})