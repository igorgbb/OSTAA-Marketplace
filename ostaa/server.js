/**
 * Author: Igor Gabriel Bezerra Bernardon, John Ko
 * Date: 10/30/2023
 * Class: CSC 337
 * Instructor: Benjamin Dicken
 *
 * Description: This setups the server side for an online
 * marketplace application. The users will have the ability
 * to login, create listings, search for listings, and make
 * purchases.
 */
const mongoose = require("mongoose");
const express = require("express");
const bp = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const port = 80;

// DB stuff
const db = mongoose.connection;
const mongoDBURL = "mongodb://127.0.0.1/ostaa";
mongoose.connect(mongoDBURL, { useNewUrlParser: true });
const Schema = mongoose.Schema;
db.on("error", () => {
  console.log("MongoDB connection error:");
});

/**
 * The DATABASE will consist of a Item Schema and
 * a User schema. The item schema will keep track
 * of the Items listed in the Website. The User
 * schema will keep track of the users and their
 * listings and purchases.
 */
var ItemSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: String,
  price: Number,
  stat: String,
});
var Item = mongoose.model("Item", ItemSchema);

// Define the UserSchema
var UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  listings: [
    {
      type: Schema.Types.ObjectId,
      ref: "Item",
    },
  ],
  purchases: [
    {
      type: Schema.Types.ObjectId,
      ref: "Item",
    },
  ],
});

var User = mongoose.model("User", UserSchema);

// Session will be added when a user successfully logged in.
let sessions = {};

function addSession(username) {
  let sid = Math.floor(Math.random() * 1000000000);
  let now = Date.now();
  sessions[username] = {id: sid, time: now};
  return sid;
}

function removeSessions() {
  let now = Date.now();
  let usernames = Object.keys(sessions);
  for (let i = 0; i < usernames.length; i++) {
    let last = sessions[usernames[i]].time;
    //if (last + 120000 < now) {
    if (last + 20000 < now) {
      delete sessions[usernames[i]];
    }
  }
  console.log(sessions);
}

// setInterval(removeSessions, 2000);

app.use(cookieParser());

function authenticate(req, res, next) {
  let c = req.cookies;
  console.log('auth request:');
  console.log(req.cookies);
  if (c != undefined) {
    if (sessions[c.login.username] != undefined && 
      sessions[c.login.username].id == c.login.sessionID) {
      next();
    } else {
      res.redirect('/public_html/index.html');
    }
  }  else {
    res.redirect('/public_html/index.html');
  }
}

app.use('/app/*', authenticate);
app.get('/app/*', (req, res, next) => { 
  console.log('another');
  next();
});

app.use(express.static("public_html"));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(bp.json());

// /get/users/ (GET) Should return a JSON array containing the information for every user in the database.
app.get("/get/users/", (req, res) => {
  User.find({})
    .then((users) => {
      res.json(users);
    })
    .catch((err) => {
      res.status(500).send({ error: "Failed to fetch users" });
    });
});

// /get/items/ (GET) Should return a JSON array containing the information for every item in the database.
app.get("/get/items/", (req, res) => {
  Item.find({})
    .then((items) => {
      res.json(items);
    })
    .catch((err) => {
      res.status(500).send({ error: "Failed to fetch items" });
    });
});

// /get/listings/USERNAME (GET) Should return a JSON array containing every listing (item) for the user USERNAME.
app.get("/get/listings/:username", (req, res) => {
  const username = req.params.username;

  // Find user by username
  User.findOne({ username: username })
    .populate("listings") // populate listings of that user
    .exec()
    .then((user) => {
      if (!user) {
        res.status(404).send({ error: "User not found" });
      } else {
        res.json(user.listings);
      }
    })
    .catch((err) => {
      res.status(500).send({ error: "Failed to fetch listings" });
    });
});

// /get/purchases/USERNAME (GET) Should return a JSON array containing every purchase (item) for the user USERNAME
app.get("/get/purchases/:username", (req, res) => {
  const username = req.params.username;

  // Find user by username
  User.findOne({ username: username })
    .populate("purchases") // populate purchases of that user
    .exec()
    .then((user) => {
      if (!user) {
        res.status(404).send({ error: "User not found" });
      } else {
        res.json(user.purchases);
      }
    })
    .catch((err) => {
      res.status(500).send({ error: "Failed to fetch purchases" });
    });
});

// /search/users/KEYWORD (GET) Should return a JSON list of every user whose username has the substring KEYWORD.
app.get("/search/users/:keyword", (req, res) => {
  const keyword = req.params.keyword;

  // Create a case-insensitive regular expression search
  const regex = new RegExp(keyword, "i");

  // Find users by username containing the keyword
  User.find({ username: regex })
    .then((users) => {
      res.json(users);
    })
    .catch((err) => {
      res.status(500).send({ error: "Failed to search for users" });
    });
});

// /search/items/KEYWORD (GET) Should return a JSON list of every item whose description has the substring KEYWORD.
app.get("/search/items/:keyword", (req, res) => {
  const keyword = req.params.keyword;

  // Create a case-insensitive regular expression search
  const regex = new RegExp(keyword, "i");

  // Find items by description containing the keyword
  Item.find({ description: regex })
    .then((items) => {
      res.json(items);
    })
    .catch((err) => {
      res.status(500).send({ error: "Failed to search for items" });
    });
});

// /add/user/ (POST) Should add a user to the database. The username and password should be sent as POST parameter(s).
app.post("/add/user/", async (req, res) => {
  const { username, password } = req.body;

  // Check if username and password are provided.
  if (!username || !password) {
    return res
      .status(400)
      .send({ error: "Both username and password are required" });
  }
  // Create a new user instance
  const newUser = new User({
    username,
    password,
    listings: [],
    purchases: [],
  });

  try {
    const savedUser = await newUser.save();
    res
      .status(201)
      .send({ message: "User added successfully", userId: savedUser._id });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).send({ error: "Username already exists" });
    }
    return res.status(500).send({ error: "Failed to add user" });
  }
});

/*
    Post request to log in a user (need to modify I think)
*/
app.post('/account/login', (req, res) => { 
  console.log(sessions);
  let u = req.body;
  let p1 = User.find({username: u.username, password: u.password}).exec();
  p1.then( (results) => { 
    if (results.length == 0) {
      res.end('Coult not find account');
    } else {
      let sid = addSession(u.username);  
      res.cookie("login", 
        {username: u.username, sessionID: sid}, 
        {maxAge: 60000 * 2 });
      res.end('SUCCESS');
    }
  });
});

/**
 * /add/item/USERNAME (POST) Should add an item to the database. The items information
 * (title, description, image, price, status) should be included as POST parameters.
 * The item should be added the USERNAMEs list of listings.
 */
app.post("/add/item/:username", async (req, res) => {
  const username = req.params.username;
  const { title, description, image, price, stat } = req.body;

  // Ensure that information is provide.
  if (!title || !description || !image || !price || stat === undefined) {
    return res
      .status(400)
      .send({ error: "All item information must be provided" });
  }

  // Create new Item
  const newItem = new Item({
    title,
    description,
    image,
    price,
    stat,
  });

  // Attempt to save Item.
  try {
    const savedItem = await newItem.save();

    const updatedUser = await User.findOneAndUpdate(
      { username: username },
      { $push: { listings: savedItem._id } },
      { new: true, useFindAndModify: false }
    );

    if (!updatedUser) {
      return res.status(404).send({ error: "User not found" });
    }

    res
      .status(201)
      .send({ message: "Item added successfully", itemId: savedItem._id })
      .redirect("/public_html/home.html");
  } catch (err) {
    res.status(500).send({ error: "Failed to add item" });
    res.redirect("/public_html/home.html");
  }
});

app.listen(port, () =>
  console.log(`App listening at http://localhost:${port}`)
);
