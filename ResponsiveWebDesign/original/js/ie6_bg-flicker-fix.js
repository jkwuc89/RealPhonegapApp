// JavaScript Document
/* Prevent IE6 background image flicker:
http://davidwalsh.name/preventing-the-ie6-css-background-flicker/
http://evil.che.lu/2006/9/25/no-more-ie6-background-flicker */
try { document.execCommand('BackgroundImageCache', false, true); } catch(e) {}