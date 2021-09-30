const express = require("express");
const session = require("express-session");
const fs = require("fs");
const flash = require("connect-flash");

const app = express();

//임의의 데이터 (데이터베이스 대체)
const data = {
  email: "yongs@gmail.com",
  password: "123456",
  nickname: "yong",
};

//form으로 오는 요청을 받기 위한 설정
app.use(express.urlencoded({ extended: true }));
//session설정
app.use(
  session({
    secret: "passportTest",
    resave: false,
    saveUninitialized: false,
  })
);

//flash message 사용하기 위한 설정
app.use(flash());

//passport 모듈 가져오기
const passport = require("passport"),
  LocalStrategy = require("passport-local").Strategy;

//passport 설정
app.use(passport.initialize());

//passport session 설정
app.use(passport.session());

//1. 로그인 요청시 passport로 처리하기 위한 설정(authenticate의 첫번째 인자에서 두번째 인자로 넘어가기 전에 "2번 local 로그인 로직"으로 넘어간다.)
//5. 2번에서 로그인이 실패한다면 5번으로 바로 온다, 로그인이 성공하였다면 3,4번을 거치고 5번으로 다시 돌아온다.
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/", //로그인을 성공하였을 때, 리다이랙트 할 페이지
    failureRedirect: "/login", //로그인을 실패하였을 때, 리다이랙트 할 페이지
    failureFlash: true,
    successFlash: true,
  })
);

//2. local 로그인 로직
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "pswd" },
    (username, password, done) => {
      //email이 데이터베이스와 동일하다면,
      if (data.email === username) {
        //email, password가 데이터베이스와 동일하다면,
        if (data.password === password) {
          return done(null, data, { message: "환영합니다" }); //user정보를 넘겨준다.
        } else {
          //password가 데이터베이스와 틀리다면,
          return done(null, false, { message: "패스워드가 틀렸습니다." });
        }
      } else {
        //email이 데이터베이스와 틀리다면,
        return done(null, false, { message: "존재하지 않는 유저입니다." });
      }
    }
  )
);

//3. session을 저장하는 설정 (2번에서 로그인 성공하면 여기로 넘어온다.)
passport.serializeUser((user, done) => {
  done(null, user.email);
});

//4. 세션을 확인하고 user의 정보를 보내주는 설정
passport.deserializeUser((id, done) => {
  done(null, data);
});

//홈 페이지 요청
app.get("/", (req, res) => {
  res
    .status(200)
    .send(
      req.user
        ? `홈 | <a href=/logout>LogOut</a> <br/> ${req.user.email}`
        : `홈 | <a href='/login'>Login</a> <br/> 로그인이 필요합니다`
    );
});

//로그인 페이지 요청
app.get("/login", (req, res) => {
  const errMsg = req.flash();
  res
    .status(200)
    .send(
      `<div style="color:red;" >${
        errMsg.error ? errMsg.error[0] : ""
      }</div> ${fs.readFileSync("./view.html", "utf8")}`
    );
});

//로그아웃 후 리다이렉트 요청
app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.listen(8080, () => {
  console.log("8080서버에 연결되었습니다.");
});
