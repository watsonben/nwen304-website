var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var bp = require('body-parser');
var helpers = require('./supporting_functions.js');
var exports = module.exports = {};
//var cors = require('cors');
var pg = require('pg').native;
var connectionString = "postgres://watsonben:mypassword@depot:5432/watsonben_nodejs"; //TODO Create a new database.
var client = new pg.Client(connectionString);
client.connect();

app.use(bp.urlencoded({extended:true}));
app.use(bp.json());
//app.use(cors());

//=====================================
//HELPER METHODS
//=====================================

function postData(key, value){
	//client.query("update jobs set complete="+value+" where name='"+key+"'");
}

function putData(key, value){
	//client.query("insert into jobs (name, complete) values ('"+key+"',"+value+")");
}

exports.sort_it_out = function(req, res){
	var array = helpers.sanitize_url(req.url);
	var query;
	if(array.length == 1){
		//url is just /men
		query = client.query("select * from men");
	} else if(array.length == 2){
		//url is /men/some_category
		//TODO sanitize array[1]
		query = client.query("select * from mens_"+array[1]);
	} else{
		//url is /men/some_category/item_id
		//TODO sanitize array[1] and array[2]
		query = client.query("select * from mens_"+array[1]+" where id='"+array[2]+"'");
	}
	helpers.handle_query(query, res);
}
