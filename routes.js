const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const db = require("./db");
require("dotenv").config();
const { createUserTable } = require("./models/user");

const router = express.Router();

createUserTable()
    .then(() => console.log("📌 Database is ready!"))
    .catch((err) => console.error("❌ Error initializing database:", err));

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

router.get("/register/customer", (req, res) => {
    res.render("register", { message: req.flash("message") });
});

router.get("/register/admin", (req, res) => {
    res.render("admin-register", { message: req.flash("message") });
});

router.get("/", (req, res) => {
    res.render("index", { message: req.flash("message") });
});

router.post("/register", async (req, res) => {
    const { first_name, last_name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    try {
        await db.execute('INSERT INTO users (first_name, last_name, email, password, role, verification_token) VALUES (?, ?, ?, ?, ?, ?)', [first_name, last_name, email, hashedPassword, role, verificationToken])

        const verificationLink = `http://localhost:${process.env.PORT}/verify-email?token=${verificationToken}`;
        console.log(verificationLink);

        await transporter.sendMail({
            to: email,
            subject: "Email Verification",
            html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`,
        });

        req.flash("message", "Registration successful! Check your email to verify your account.");
        res.redirect(role === "admin" ? "/register/admin" : "/register/customer");
    } catch (error) {
        req.flash("message", "Error registering user.");
        res.redirect(role === "admin" ? "/register/admin" : "/register/customer");
    }
});

router.get("/verify-email", async (req, res) => {
    const { token } = req.query;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await db.execute("UPDATE users SET is_verified = 1 WHERE email = ?", [decoded.email]);
        res.send("Email verified successfully. You can now login.");
    } catch {
        res.send("Invalid or expired token.");
    }
});

router.post("/login/admin", async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
        const rows = result[0];

        if (!rows || rows.length === 0) {
            req.flash("message", "Invalid email or password.");
            return res.redirect("/login/admin");
        }

        const user = rows[0];

        if (user.role !== "admin") {
            req.flash("message", "You are not allowed to login from here.");
            return res.redirect("/login/admin");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash("message", "Invalid email or password.");
            return res.redirect("/login/admin");
        }

        req.flash("message", "Login successful!");
        res.redirect("/dashboard");
    } catch (error) {
        console.error("Login Error:", error);
        req.flash("message", "An error occurred. Please try again.");
        res.redirect("/login/admin");
    }
});


router.get("/dashboard", (req, res) => {
    res.render("dashboard", { message: req.flash("message") });
});

module.exports = router;
