// JavaScript Document
var mydate = new Date();
var year = mydate.getYear();

if (year < 1000)
    year += 1900;

document.write(year);