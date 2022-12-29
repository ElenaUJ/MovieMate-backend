// Import of HTTP, FS, URL modules
const http = require('http'),
  fs = require('fs'),
  url = require('url');

http
  .createServer(function (request, response) {
    let addr = request.url,
      q = url.parse(addr, true),
      filePath = '';

    // Track requests for on log.txt file
    fs.appendFile(
      'log.txt',
      'URL: ' + addr + '\nTimestamp: ' + new Date() + '\n\n',
      function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log('Successfully added to log.');
        }
      }
    );

    if (q.pathname.includes('documentation')) {
      // Question: I don't understand why I would distinguish how I set the file path for index.html and dcoumentation.html since they are both in the root folder
      filePath = __dirname + '/documentation.html';
    } else {
      filePath = 'index.html';
    }

    fs.readFile(filePath, function (err, data) {
      if (err) {
        throw err;
      }
      // adds header to response that will be returned along with HTTP code 200 for "OK"
      response.writeHead(200, { 'Content-type': 'text/html' });
      response.write(data);
      response.end();
    });
  })
  // tells server to listen for response on port 8080
  .listen(8080);
