//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");

const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//--connect to database
//  mongodb+srv://admin-ryan:<password>@cluster0-lgmzj.mongodb.net/test?retryWrites=true&w=majority
// mongodb://localhost:27017/todolistDB"
mongoose.connect("mongodb+srv://admin-ryan:admin@cluster0-lgmzj.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true });
//--create schema
const Schema = mongoose.Schema;

const itemsSchema = new Schema({
  name: String
});

//--create model
const Item = mongoose.model("Item", itemsSchema);

// create documents for db collection
const item1 = new Item({
  name: "Here's your todo list..."
});

const item2 = new Item({
  name: "Press + to add a new item."
});

const item3 = new Item({
  name: "<--click the checkmark to delete"
});

const defaultItems = [item1,item2,item3];

//---Custom list Schema
const listSchema = {
  name: String,
  items: [itemsSchema]
};
//---Custom list Model
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({},function(err, foundItems){
    //--check to see if there are no items in database
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        } else {
          console.log("default items added");
        }
      })
      res.redirect("/"); //redirect back into / route after the check
    } else {
      //--render the db array
      if(err){
        console.log(err);
      } else {
        //console.log(foundItems);
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    }

  })

});

app.get("/:listName", function(req, res){

  const listName = _.capitalize(req.params.listName);
  const list = new List({
    name: listName,
    items: defaultItems
  });

  List.findOne({name: listName}, function(err, foundList){
    if (!err){
      console.log("List.findOne: Success");
      if(foundList){
        console.log("List found.");
        console.log(foundList);
        res.render("list", {listTitle: listName, newListItems: foundList.items});
      } else {
        console.log("Creating List.");
        list.save();
        //res.render("list", {listTitle: listName, newListItems: foundList.items});
        res.redirect("/"+listName);
      }
    } else {
      console.log(err);
    }
  })
  //list.save();
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  console.log("listName:" + listName);
  const item = new Item({
    name:itemName
  });
  //--default list
  if(listName === "Today"){
    //--default list
    item.save();
    res.redirect("/");
  } else {
    //--custom list
    //--search for list in db and then add it
    List.findOne({name: listName}, function(err, foundList){
      if(!err){
        foundList.items.push(item);
        foundList.save();

        setTimeout(function(){
          res.redirect("/"+listName);
        }, 2000)

      } else {
        console.log(err);
      }
    })
  }



});

app.post("/delete", function(req, res){
  console.log(req.body);
  const checkedItemId = req.body.checkbox;

  const listName = req.body.listName;

  console.log("Deleting from " +listName);

  if(listName === "Today") {
    Item.deleteOne({_id:checkedItemId}, function(err){
      if(err){
        console.log(err);
      } else {
        console.log("successfully deleted item");
        res.redirect("/");
      }
    })
  } else {
    //uses $pull operator from MongoDB with Mongoose model methods
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    })

  }



});


app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
