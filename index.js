const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");  // Import express-session for handling sessions
const User = require("./models/User");  // Import the User model

const app = express();

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/myapp", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch((error) => {
    console.error("Error connecting to MongoDB:", error);
});

// Set up EJS as the view engine
app.set('view engine', 'ejs');

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware for parsing request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up session middleware
app.use(session({
    secret: 'mysecretkey',  // Replace with a strong secret in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Set to true in production with HTTPS
}));

// Define routes
app.get("/", (req, res) => {
    if (req.session.userId) {
        res.render('index', { userId: req.session.userId });  // Render home page with EJS
    } else {
        res.render('index', { userId: null });  // Render home page without userId
    }
});

app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));  // Serve the signup.html file from the public folder
});

app.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).send("All fields are required for signup");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        // Save the user to the database
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        console.log(`New user registered: ${name}, ${email}`);
        res.redirect('/signup');  // Redirect to the signup page after successful registration
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));  // Serve the signup.html file from the public folder for the login page
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send("Both email and password are required");
        }
        const user = await User.findOne({ email });
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user._id;  // Store user ID in the session
            console.log(`User logged in: ${email}`);
            res.redirect('/');  // Redirect to the home page after successful login
        } else {
            res.status(401).send("Invalid email or password");
        }
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error during logout:", err);
            return res.status(500).send("Internal Server Error");
        }
        res.redirect('/signup');  // Redirect to the signup page after logout
    });
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on Port: ${port}`);
});
