const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require('path');
const _ = require("lodash");
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(express.static("public"));
const cors = require('cors')
app.use(cors());
// Set the view engine to EJS
app.set("view engine", "ejs");

// Middleware for parsing application/x-www-form-urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files directory
app.use(express.static(path.join(__dirname, "public")));

// Database connection

const mongoDBUri = "mongodb+srv://gianlucaspertigs:Ps84fLX22nZTqwXN@giucacluster.ogopbjl.mongodb.net/giucaCluster";
mongoose.connect(mongoDBUri, { useNewUrlParser: true, useUnifiedTopology: true });

// Mongoose schema for Todos
const todoSchema = new mongoose.Schema({
    obj: String,
    startingDate: {type: Date}, 
    endingDate: {type: Date},
    priority: String,
    completed: Boolean
});


const Todo = mongoose.model("TODO", todoSchema);

app.get("/", async (req, res) => {
    try {
        // Fetch all todos and sort by priority
        const allTodos = await Todo.find().sort({ priority: 1 });
        res.render("home", { todos: allTodos });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching todos');
    }
});

app.get("/compose", (req, res) => {
    const today = new Date().toISOString().split('T')[0]; 
    res.render("compose", { today }); 
});

app.post("/compose", async (req, res) => {
    console.log(req.body);  // Log the request body

    const newTodo = new Todo({
        obj: req.body.obj,
        startingDate: req.body.startingDate,
        endingDate: req.body.endingDate,
        priority: req.body.priority,
        completed: false
    });

    console.log(newTodo);  // Log the new Todo

    try {
        await newTodo.save();
        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).send('Error saving todo');
    }
});


app.get('/search', async (req, res) => {
    try {
        const query = req.query.query || ''; 
        const searchResults = await Todo.find({
            obj: { $regex: new RegExp(query, 'i') }
        })
        res.json(searchResults);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).send('Error performing search');
    }
});

app.post("/delete-todo", async (req, res) => {
    const todoId = req.body.todoId;
    try {
        await Todo.findByIdAndDelete(todoId);
        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting todo');
    }
});

app.post('/clear_all', async (req, res) => {
    try {
        const query = req.body.query || '';
        await Todo.deleteMany({
            obj: { $regex: new RegExp(query, 'i') }
        });
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error clearing todos');
    }
});

app.post('/todoscompleted', async(req, res) => {
    var todoId = req.body.id; 
    var newCompleted = req.body.completed;
    try {
        await Todo.findByIdAndUpdate(todoId, { completed: newCompleted });
        res.status(200).send('Todo updated successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating todo');
    }
});



// Listen on default port 5000
app.listen(3000);
