var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var bp = require('body-parser');
var exports = module.exports = {};
//var cors = require('cors');
var pg = require('pg').native;
var connectionString = "postgres://rybgtwaenxzadm:Ia_YiG0ih5FblKPT71enEMI4z-@ec2-54-243-236-70.compute-1.amazonaws.com:5432/d6map6onq4uhlg";
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

exports.get_me_something = function(req, res){
	var array = sanitize_url(req.url);
	if(array == null){
		//The url was invalid
		res.status(400).send("Invalid url");
		return;
	}
	var error = false;
	var query;
	if(array.length == 1){
		//url is just /gender
		query = client.query("select * from " + array[0], function(err, rows, fields){
				if(err){
				res.status(404).send("Sorry, we can't find that.");
				error = true;
				}
				});
	} else if(array.length == 2){
		//url is /gender/some_category
		query = client.query("select * from " + array[0] + " where type='" + array[1]+"'", function(err, rows, fields){
				if(err){
				res.status(404).send("Sorry, we can't find that.");
				error = true;
				}
				});
	} else {
		//url is /gender/some_category/item_id
		query = client.query("select * from " + array[0] + "_" + array[1] +" where id='"+array[2]+"'", function(err, rows, fields){
				if(err){
				res.status(404).send("Sorry, we can't find that.");
				error = true;
				}
				});
	}
	if(error){
		return;
	}
	res.statusCode = 200;
	handle_query(query, res);
}

function sanitize_url(url){
	var queries_removed = url.split('?');
	var leading_slash_removed = queries_removed[0].slice(1);
	var path = leading_slash_removed.split('/');
	if(path[path.length - 1] == ""){
		path = path.slice(0,-1);
	}
	path = ensure_only_letters_and_numbers(path);
	return path;
}

function ensure_only_letters_and_numbers(path){
	for(var i = 0; i < path.length; i++){
		if(!(/^\w+$/.test(path[i])) || path[i] == undefined){
			return null;
		}
	}
	return path;
}

function handle_query(query, res){
	var query_results = [];
	query.on('row', function(row){
			query_results.push(row);
			});
	query.on('end', function(){
			res.json(query_results);
			});
}
