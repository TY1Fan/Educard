// Load environment variables
require("dotenv").config();

const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");

// Create Express application
const app = express();

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Layout configuration
app.use(expressLayouts);
app.set("layout", "layouts/main");
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

// Static files middleware
app.use(express.static(path.join(__dirname, "../public")));

// Body parser middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Request logging middleware (simple for now)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Homepage route
app.get("/", (req, res) => {
  res.render("pages/home", {
    title: "Home - Educard Forum"
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// 404 handler - must be after all other routes
app.use((req, res, next) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>404 - Page Not Found</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background-color: #f5f5f5;
        }
        .container {
          text-align: center;
        }
        h1 {
          font-size: 6rem;
          margin: 0;
          color: #667eea;
        }
        h2 {
          font-size: 2rem;
          margin: 1rem 0;
          color: #333;
        }
        p {
          color: #666;
        }
        a {
          color: #667eea;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist.</p>
        <p><a href="/">Go back home</a></p>
      </div>
    </body>
    </html>
  `);
});

// Error handler - must be last
app.use((err, req, res, next) => {
  // Log error for debugging
  console.error("Error occurred:");
  console.error(err.stack);

  // Send error response
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Something went wrong!"
      : err.message;

  res.status(statusCode).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error - Educard Forum</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background-color: #f5f5f5;
        }
        .container {
          text-align: center;
          padding: 2rem;
        }
        h1 {
          font-size: 4rem;
          margin: 0;
          color: #e53e3e;
        }
        h2 {
          font-size: 1.5rem;
          margin: 1rem 0;
          color: #333;
        }
        p {
          color: #666;
        }
        pre {
          background: #f9f9f9;
          padding: 1rem;
          border-radius: 4px;
          text-align: left;
          overflow-x: auto;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>⚠️ Error</h1>
        <h2>Something went wrong</h2>
        <p>${message}</p>
        ${process.env.NODE_ENV !== "production" ? `<pre>${err.stack}</pre>` : ""}
        <p><a href="/">Go back home</a></p>
      </div>
    </body>
    </html>
  `);
});

// Export app for use in server.js
module.exports = app;
