
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const favicon = require('serve-favicon');

let port = 3000; 
const app = express();
const URI =  'mongodb://localhost:27017/todolistDB'; //creates a todolist database locally 
app.set('view engine', 'ejs');

app.use(favicon(__dirname + '/public/img/favicon.ico')); // Returns a middleware to serve favicon 

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//connect to database
const connectDB = () => {
    try{    
        mongoose.connect(URI, { useNewUrlParser: true }) ;
    }
    catch (err) {
        console.log('Failed to connect to MongoDB', err);
    }  
};
connectDB();

const itemSchema = {
    name: String
}

const Item = mongoose.model("Item", itemSchema);

//default items
const item1 = new Item({
    name: `Welcom to your todo list!`
})

const item2 = new Item({
    name: "Simply enter your item/task,"
})

const item3 = new Item({
    name: "and press on the (+) icon"
})
const defaultItems = [item1, item2, item3]

//Schema for custome route lists 
const listSchema = mongoose.Schema({
    name: String,
    items: [itemSchema]
})

// Model for ListSchema
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
    Item.find({}, (err, foundItems) => {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, (err)=> {
                if (err){
                    console.log(err)
                } else{ 
                    console.log("Successfully Inserted"); 
                }
            });
            res.redirect("/"); 
        } else {
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    });
});

app.post("/", function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.list
    
    const item = new Item({ 
        name: itemName
    });

    if (listName == "Today"){
        item.save()
        res.redirect("/");
    } else {
        List.findOne({name: listName}, (err, foundList) => {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

//Dynamic routing
app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);
 
    List.findOne({ name: customListName }, (err, foundList) => {
      if(!err){
        if (!foundList) {
          //Create a new list
            const list = new List({
            name: customListName,
            items: defaultItems
            });
            
            list.save();
            res.redirect("/"+ customListName);

        } else {
            res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
        }
      }
    });
  });

//delete forum 
app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox.trim();
    const listName = req.body.listName.trim();

    if (listName == "Today"){
        Item.findByIdAndRemove(checkedItemId, (err)=> { 
            if (!err){
                console.log("Successfully deleted the checked item");
                res.redirect("/"); 
            }
        });
    } else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
            if (!err){
                res.redirect("/" + listName);
            }
        })
    }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(port, function() {
  console.log(`Server up and running on ${port}`);
});
