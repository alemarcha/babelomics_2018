const express = require("express"),
  passportService = require("./config/passport"),
  passport = require("passport"),
  config = require("./config/main"),
  authRouter = require("./router/authRouter"),
  fileRouter = require("./router/fileRouter"),
  jobRouter = require("./router/jobRouter");

// Middleware to require login/auth
const requireAuth = passport.authenticate("jwt", { session: false });

// Manage api response.
let manageResponse = (err, status, response, res, next) => {
  if (err) next(err);
  sendResponse(status, response, res);
};

// Send a status response
let sendResponse = (status, response, res) => {
  return res.status(status).json(response);
};

// Send error response
let sendError = (status, message, error, res) => {
  sendResponse(
    status,
    {
      ok: false,
      error: { message: message, error: error }
    },
    res
  );
};

module.exports = function(app) {
  // Initializing route groups

  const apiRoutes = express.Router();
  // Set url for API group routes
  app.use("/api", apiRoutes);

  authRouter.init(apiRoutes, requireAuth, manageResponse);
  fileRouter.init(apiRoutes, requireAuth, manageResponse);
  // jobRouter.init(apiRoutes, requireAuth, manageResponse);
  //=========================
  // Auth Routes
  //=========================

  // Ping routes
  apiRoutes.get("/ping", function(req, res) {
    res.status(200).json({
      ok: true
    });
  });

  // Private routes
  apiRoutes.get("/protected", requireAuth, function(req, res, next) {
    res.status(200).json({
      content: "Respuesta desde api protected"
    });
  });

  // Handle errors Development or test environment
  if (config.environment === "development" || config.environment === "test") {
    // Handle Errors in api rest
    apiRoutes.use((err, req, res, next) => {
      //TODO Just for development mode
      console.log(err);
      sendError(err.status || 500, err.message || "", err, res);
    });
  }

  // Handle errors Production environment
  if (config.environment !== "development" && config.environment !== "test") {
    // Handle Errors in api rest
    apiRoutes.use((err, req, res, next) => {
      sendError(err.status || 500, err.message, { message: err.message }, res);
    });
  }

  // Handle 404 error.
  app.use("*", (req, res) => {
    //TODO Just for development mode
    // console.log(req);
    sendError(404, "Not Found route", req.originalUrl, res);
  });
};
