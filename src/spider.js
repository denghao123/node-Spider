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

  downloadImg(filename, url, callback) {
    if (url && url !== 'undefined') {
      this.fetch({
        url: url
      }).pipe(fs.createWriteStream(filename)).on('close', () => {
        typeof callback === 'function' && callback();
      })
    }
  },
  getAbsUrl(src, basePath) {
    var protocol = /^((ht|f)tps?)/.exec(basePath),
      basePath = protocol ? basePath : 'http://' + basePath,
      domain = /^\w+\:\/\/\/?[^\/]+/.exec(basePath)[0];
    /*
     * core
     */
    if (/^\/\/\/?/.test(src)) {
      // eg.  //cdn.com/1.jpg
      src = (protocol ? (protocol[0] + ':') : 'http:') + src;
    } else if (!/^\w+\:\/\//.test(src)) {
      if (/^\/+/.test(src)) {
        // eg.  /1.jpg
        src = domain + src;
      } else if (/^\.\/+/.test(src)) {
        // eg.  ./1.jpg
        src = src.replace(/^\.\/+/, '');
        src = basePath + '/' + src;
      } else if (/^\.\.\/+/.test(src)) {
        // eg.  ../1.jpg
        src = this.basePathParse(src, basePath)
      } else {
        // eg.  1.jpg
        src = basePath + '/' + src;
      }
    }
    return src;
  },
  deleteLastFolder(str) {
    var i = str.lastIndexOf("\/");
    if (i < 10) {
      return str;
    } else {
      return str.substring(0, i);
    }
  },

  folderParse(path) {
    var level = 0,
      name = path.replace(/\.\.\//g, function(v) {
        level++;
        return '';
      });
    return {
      level: level,
      name: name
    }
  },

  basePathParse(path, basePath) {
    var folder = this.folderParse(path);
    basePath = basePath.replace(/(.*)\/+$/g, '$1');
    for (var i = 0; i < folder.level; i++) {
      basePath = this.deleteLastFolder(basePath)
    }
    return basePath + '/' + folder.name;
  }
}

/*
 * eg. http://denghao.me
 */

let targetUrl = 'http://denghao.me';

libs.fetch({
  url: targetUrl
}, function(html) {
  console.log((targetUrl+' 抓取中,请稍等~').green);
  let $ = cheerio.load(html);
  let titles = $('#main h3 a');
  let imgs = $('#main .content img');

  ([].slice.call(titles)).forEach(function(v, i, arr) {
    let title = titles[i].attribs.title;
    let url = imgs[i].attribs.src;
    let txtFileName = './data/txt/' + title + '.txt';
    let imgFileName = './data/image/' + libs.md5(url) + '.jpg';
    // txt
    libs.downloadTxt(txtFileName, title);
    // image
    libs.downloadImg(imgFileName, libs.getAbsUrl(url, targetUrl));
  })
})