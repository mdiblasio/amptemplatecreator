'use strict';
var amphtmlValidator = require('amphtml-validator');
var fs = require('fs');
const puppeteer = require('puppeteer');
const Logger = require('./logger.js');

let logger = new Logger.Logger('Main');

// regular expressions
const DISALLOWED_TAGS = {
  script: '<script[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>',
  style: '<style[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>',
  iframe: '<iframe[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>',
  link: '<link[^<]*>',
};

const ORIGINAL_HTML_FILE_NAME = 'original.html';
const MODIFIED_HTML_FILE_NAME = 'modified.html';

// AMP boilerplate
const TAG_HTML = '<html amp lang="en">';
const TAG_HEAD =
  `<head>
<meta charset="utf-8">
<script async src="https://cdn.ampproject.org/v0.js"></script>
<title>PLACEHOLDER_TITLE</title>
<link rel="canonical" href="PLACEHOLDER_CANONICAL_URL">
<meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
<noscript>
<style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style>
</noscript>
<style amp-custom>PLACEHOLDER_INLINE_CSS</style>`;

// add AMP boilderplate by replacing html and head tags
function addAMPBoilerplate(html) {
  // html tag
  html = html.replace(new RegExp('<html[^>]*>'), TAG_HTML);

  // header tag
  html = html.replace(new RegExp('<head[^>]*>'), TAG_HEAD);

  return html;
}

// remove a regular expression
function removeRegexp(html, regexp) {
  return html.replace(new RegExp(regexp, 'g'), "");
}

// remove all disallowed tags
function removeDisallowedTags(html) {
  Object.keys(DISALLOWED_TAGS).forEach(key => {
    logger.status(`Removing disallowed tag: <${key}>`);
    let re = new RegExp(DISALLOWED_TAGS[key], 'g');
    html = html.replace(re, "");
  });

  return html;
}

// remove disallowed attribute
function removeAttribute(html, attribute) {
  let re = new RegExp(` ${attribute}(=\"[^"]*\"|\s|>)`, 'g');
  return html.replace(re, " ");
}

// replace disallowed tag with <div>
function replaceTag(html, tag, replacementTag) {

  let reOpen = new RegExp(`<${tag}[^<]*>`, 'g');
  let reClose = new RegExp(`<\/${tag}>`, 'g');

  let replacementOpen = `<${replacementTag}>`;
  let replacementClose = `<\/${replacementTag}>`;

  html = html.replace(reOpen, replacementOpen);
  html = html.replace(reClose, replacementClose);

  return html;
}

// get render HTML using Puppeteer
async function getRenderedHTML(url = null) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    var HTML = await page.content()

    var ws = fs.createWriteStream(ORIGINAL_HTML_FILE_NAME);
    ws.write(HTML);
    ws.end();

    browser.close();

    return HTML;
  } catch (e) {
    console.log(e);
  }
}

// get AMP validation report using amphtml-validator package
async function getAMPValidationReport(input) {
  let msgs = [];

  await amphtmlValidator.getInstance().then(async function(validator) {
    var result = validator.validateString(input);

    // ((result.status === 'PASS') ? console.log : console.error)(result.status);
    for (var ii = 0; ii < result.errors.length; ii++) {
      var error = result.errors[ii];
      var msg = 'line ' + error.line + ', col ' + error.col + ': ' + error.message;

      msgs.push(msg)
      if (error.specUrl !== null) {
        msg += ' (see ' + error.specUrl + ')';
      }
      // ((error.severity === 'ERROR') ? console.error : console.warn)(msg);
    }
  });

  return msgs;
}

// get disallowed attributes from AMP validation report
function getDisallowedAttributes(errors) {
  let disallowedAttributes = new Set();

  errors.forEach(error => {
    if (error.match(/The attribute/)) {
      let attribute = error.match(/The attribute \'([^']*)/)[1];
      disallowedAttributes.add(attribute);
    }
  });

  disallowedAttributes = Array.from(disallowedAttributes).sort();
  disallowedAttributes = disallowedAttributes.reverse();

  return disallowedAttributes;
}

// get disallowed tags from AMP validation report
function getDisallowedTags(errors) {
  let disallowedTags = new Set();

  errors.forEach(error => {
    if (error.match(/The tag '([^']*)' is disallowed\./)) {
      let attribute = error.match(/The tag '([^']*)' is disallowed\./)[1];
      disallowedTags.add(attribute);
    }
  });

  return disallowedTags;
}

// get inlined css file (inline.css)
function getInlinedCSSFile() {
  return fs.readFileSync('inline.css', 'utf8');
}

async function main(url) {
  let domain = url.match(/(https?:\/\/[^/]*)/)[1];

  // get rendered html
  logger.instruction(`Getting rendered HTML from puppeteer`);
  let html = await getRenderedHTML(url);

  // get validation report
  logger.instruction(`Running AMP validation`);
  let errors = await getAMPValidationReport(html);
  // console.log(errors);

  // remove disallowed tags
  logger.instruction(`Checking for disallowed tags`);
  logger.addGroup();
  html = removeDisallowedTags(html);
  logger.endGroup();

  // remove disallowed attributes
  logger.instruction(`Checking for disallowed attributes`);
  logger.addGroup();
  let disallowedAttributes = getDisallowedAttributes(errors);

  disallowedAttributes.forEach(attribute => {
    logger.status(`Removing attribute: ${attribute}`);
    html = removeAttribute(html, attribute);
  });
  logger.endGroup();

  // replace disallowed tags
  logger.instruction(`Checking for disallowed custom tags`);
  let disallowedTags = getDisallowedTags(errors);
   logger.addGroup();

  disallowedTags.forEach(tag => {
    logger.status(`Replacing custom tag <${tag}> with a <div>`);
    html = replaceTag(html, tag, 'div');
  });
   logger.endGroup();

  // replace protocol-relative URLs
  logger.instruction(`Changing protocol relative URLs to absolute URLs`);
  let protocolRelativeURLs = html.match(/(?:href|src)="\/\/([^/"]*)/g);

  if (protocolRelativeURLs) {
    protocolRelativeURLs.forEach(url => {
      let absoluteURL = url.replace('//', `https://`);
      html = html.replace(url, absoluteURL);
    });
  }

  // replace relative URLs with absolute URLs
  logger.instruction(`Replacing relative URLs with absolute URLs using domain: ${domain}`);
  let relativeURLs = html.match(/(?:href|src)="\/([^/"]*)/g);

  if (relativeURLs) {
    relativeURLs.forEach(url => {
      let absoluteURL = url.replace('/', `${domain}/`);
      html = html.replace(url, absoluteURL);
    });
  }

  // add boiler plate
  logger.instruction(`Adding AMP boilerplate`);
  html = addAMPBoilerplate(html);

  // add inlined CSS
  logger.instruction(`Inlining CSS from inline.css`);
  let css = getInlinedCSSFile();
  html = html.replace('PLACEHOLDER_INLINE_CSS', css);

  // write file
  logger.instruction(`Writing modified HTML file to ${MODIFIED_HTML_FILE_NAME}`);
  fs.writeFileSync(MODIFIED_HTML_FILE_NAME, html);

  logger.complete('Finished!');
}

// get inputs
let url = null;

process.argv.forEach((arg, index) => {
  if (process.argv[index] === '--url') {
    url = process.argv[index + 1];
  }
});

if (url) {
  main(url);
} else {
  console.log("Must provide a url parameter. Example:");
  console.group();
  console.log("node main.js --url https://www.example.com");
}