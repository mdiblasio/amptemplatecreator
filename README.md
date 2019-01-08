# amptemplatecreator

## Install

1. Clone and install the AMP codelab starter tool:
```
git clone https://github.com/mdiblasio/amptemplatecreator.git
cd amptemplatecreator
npm install
```
2. Download the [CSS Used Chrome Extension](https://chrome.google.com/webstore/detail/css-used/cdopjfddjlonogibjahpnmjpoangjfff?hl=en). “CSS Used” extracts only the CSS used by the page from all sources (e.g. inline, external) so that it can be inlined in the AMP template. 
3. Navigate to the client URL, open Chrome Dev Tools > Elements tab and click on the top-level <html> tag. In the side panel, open CSS Used and copy the CSS text into inline.css file in the project directory:



4. Run the tool:
```
node main.js --url <PARTNER_URL>
```

5. The tool will generate two files:
    - `original.html` is the rendered original page
    - `modified.html` is the modified “AMP version” with the changes listed above applied
6. While running a local server (such as [Web Server for Chrome](https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb?hl=en)), navigate to `http://127.0.0.1:8080/modified.html#development=1` and verify AMP boilerplate was inserted and the remaining validation errors are not resulting from disallowed attributes or tags.
