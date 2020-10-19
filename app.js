const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const express = require("express");
const session = require("express-session");
const logger = require("morgan");
const passport = require("passport");

dotenv.config()

const { Issuer, Strategy, generators } = require("openid-client");

(async () => {
  const app = express();

  const sessionOptions = {
    cookie: {},
    resave: false,
    saveUninitialized: true,
    secret: "SomeRandomValue"
  }

  if(process.env.NODE_ENV === "production"){
    // Use secure cookies in production. More info at https://www.npmjs.com/package/express-session#cookiesecure
    sessionOptions.cookie.secure = true;
  }

  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "pug");

  app.use(logger("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(session(sessionOptions));

  const privateKey = JSON.parse(fs.readFileSync("es256_private.json", { encoding: "utf-8" }))

  const plusAuthIssuer = await Issuer.discover(process.env.PLUSAUTH_ISSUER);

  const plusAuthClient = new plusAuthIssuer.FAPIClient({
    client_id: process.env.PLUSAUTH_CLIENT_ID,
    redirect_uris: ["http://localhost:3000/auth/callback"],
    post_logout_redirect_uris: ["http://localhost:3000/auth/logout/callback"],
    response_mode: "jwt",
    authorization_signed_response_alg: "PS256",
    id_token_signed_response_alg: "PS256",
    token_endpoint_auth_method: "private_key_jwt",
    request_object_signing_alg:"ES256",
  }, { keys: [ privateKey ] } );

  passport.use(
      "PlusAuth",
      new Strategy(
          {
            client: plusAuthClient,
            params: {
              response_type: "code",
              response_mode: "jwt"
            },
            passReqToCallback: true
          },
          (req, token, user, done) => {
            req.session.token = token
            return done(null, user);
          }
      )
  );

  passport.serializeUser((user, next) => {
    next(null, user);
  });

  passport.deserializeUser((user, next) => {
    next(null, user);
  });

  app.use(passport.initialize());
  app.use(passport.session());


  function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/auth/login");
  }

  app.use("/auth/login", async function (req, res){
    const state = generators.state()
    const nonce = generators.nonce()
    // epoch time for 5 minutes later. It defines expiration of the request object.
    const in5minutes = new Date(new Date().getTime() + (5 * 60 * 1000) ) / 1000

    return passport.authenticate("PlusAuth", {
      state,
      nonce,
      request: await plusAuthClient.requestObject({
        state,
        nonce,
        exp: in5minutes,
        aud: process.env.PLUSAUTH_ISSUER,
        client_id: process.env.PLUSAUTH_CLIENT_ID,
        scope: "openid profile email",
        response_type: "code",
        redirect_uri: "http://localhost:3000/auth/callback",
      }),
    })(req,res)
  });

  app.use("/profile", isLoggedIn, (req, res) => {
    res.render("profile", { user: req.user });
  });

  app.use(
      "/auth/callback",
      (req,res,next) =>
          passport.authenticate("PlusAuth", {
            failureMessage: true,
            failureRedirect: "/error",
            successRedirect: "/profile",
          })(req, res, next)
  );

  app.get("/", function (req, res) {
    res.render("index", { user: req.user });
  });

  app.get("/error", function (req, res){
    // failureMessage option in passport authenticate pushes message to session
    const messages = req.session.messages
    res.json( messages[messages.length - 1] )
  })

  app.get("/auth/logout", (req, res) => {
    res.redirect(
        plusAuthClient.endSessionUrl({ id_token_hint: req.session.token.id_token })
    );
  });

  app.get("/auth/logout/callback", (req, res) => {
    req.logout();
    res.redirect("/");
  });

 const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Server running at http://localhost:" + listener.address().port);
  });
})();
