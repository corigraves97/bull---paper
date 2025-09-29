const express = require('express');
const mongoose = require('mongoose')


var request = require('request');

// replace the "demo" apikey below with your own key from https://www.alphavantage.co/support/#api-key
var url = 'https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=tesco&Y16E2390FJC4P27D';
var url1 = 'https://www.alphavantage.co/query?function=SHARES_OUTSTANDING&symbol=MSFT&OAH7YP7UJ8KFY6Z3';
var url2 = 'https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL&VTBWV89J0Y087EM7';
var url3 = 'https://www.alphavantage.co/query?function=OVERVIEW&symbol=IBM&CV04UFY537JT6JPL'

request.get({
    url: url, 
    json: true,
    headers: {'User-Agent': 'request'}
  }, (err, res, data) => {
    if (err) {
      console.log('Error:', err);
    } else if (res.statusCode !== 200) {
      console.log('Status:', res.statusCode);
    } else {
      // data is successfully parsed as a JSON object:
      console.log(data);
    }
})

request.get({
    url: url1,
    json: true,
    headers: {'User-Agent': 'request'}
  }, (err, res, data) => {
    if (err) {
      console.log('Error:', err);
    } else if (res.statusCode !== 200) {
      console.log('Status:', res.statusCode);
    } else {
      // data is successfully parsed as a JSON object:
      console.log(data);
    }
})

request.get({
    url: url2,
    json: true,
    headers: {'User-Agent': 'request'}
  }, (err, res, data) => {
    if (err) {
      console.log('Error:', err);
    } else if (res.statusCode !== 200) {
      console.log('Status:', res.statusCode);
    } else {
      // data is successfully parsed as a JSON object:
      console.log(data);
    }
})

request.get({
    url: url3,
    json: true,
    headers: {'User-Agent': 'request'}
  }, (err, res, data) => {
    if (err) {
      console.log('Error:', err);
    } else if (res.statusCode !== 200) {
      console.log('Status:', res.statusCode);
    } else {
      // data is successfully parsed as a JSON object:
      console.log(data);
    }
})

request.get({
    url: url4,
    json: true,
    headers: {'User-Agent': 'request'}
  }, (err, res, data) => {
    if (err) {
      console.log('Error:', err);
    } else if (res.statusCode !== 200) {
      console.log('Status:', res.statusCode);
    } else {
      // data is successfully parsed as a JSON object:
      console.log(data);
    }
})

module.exports = api-key