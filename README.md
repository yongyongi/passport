우선 session에 대한 선행학습이 되어있어야 이해하는데 무리가 없을 것 같다.

# passport

passport는 로그인 로직을 간편하게 사용하기 위해서 사용하는 모듈이다.
배우기는 어렵지만, 배워놓으면 편리하게 사용할 수 있다.

## 1. 설치

설치는 `npm i passport`를 기본적으로 하고, 어떤 로그인 방법을 사용할지에 따라 추가적으로 설치해야할 모듈이 다르다.
로그인 로직을 직접구현할 경우에는 `npm i passport-local`을 설치한다. 그 외에 sns를 이용한 로그인이나 토큰 등의 로그인 방식을 사용하기 위해서는 `npm i passport-kakao`등과 같이 설치해서 사용한다. 약 500개의 방법이 있다고한다.

## 2. 인증구현

passport에서는 전략이라는 단어를 사용한다. 쉽게 말해 로그인 로직구현을 의미한다.

밑에 코드는 로그인 요청을 하였을 때, 나오는 결과 방식이다. 1번 코드는 간단히 로그인이 성공했을때와 아닐때의 리다이렉트 설정만 해주는 것이다. 2번 코드는 done의 결과를 받아 좀 더 구체적으로 처리할 수 있게 해주는 코드이다.

```js
//1. 간단히 결과를 알려주기 위한 코드
app.post(
  "/login",
  //여러가지 전략중 local전략으로 하겠다라는 의미
  passport.authenticate("local", {
    successRedirect: "/", //로그인을 성공하였을 때, 리다이랙트 할 페이지
    failureRedirect: "/login", //로그인을 실패하였을 때, 리다이랙트 할 페이지
  })
);

//2. 구체적으로 처리하기 위해서는 밑에와 같이 처리하면된다.
app.post("/login", passport.authenticate("local"), (req, res) => {
  res.redirect("/users/" + req.user.username);
});
```

여기서 로그인이 성공했는지 실패했는지는 어떻게 알 수 있을까?

authenticate의 첫번째 인자인 local에서 두번째 인자로 가기전에 하나의 코스를 더 거친다. local전략(로그인 로직)이다.

```js
//passport-local을 사용하기 위한 전략
const passport = require("passport"),
  LocalStrategy = require("passport-local").Strategy;

passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username: username }, (err, user) => {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, { message: "Incorrect username." });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: "Incorrect password." });
      }
      return done(null, user);
    });
  })
);
```

코드를 작성할때, 주의할 점은 session위에서 작동하므로, session코드 밑에 작성을 해야한다.

## 3. parameters 설정

local 전략을 짜기에 앞서 passport를 사용할때, 요청하는 form의 name은 밑에와 같이 username, password이어야한다. 만약 다른 name을 설정하고 싶다면, parameter 설정을 해야한다.

```html
<form action="/login" method="post">
  <div>
    <label>Username:</label>
    <input type="text" name="username" />
  </div>
  <div>
    <label>Password:</label>
    <input type="password" name="password" />
  </div>
  <div>
    <input type="submit" value="Log In" />
  </div>
</form>
;
```

name을 email, passwd로 설정하고 싶다면, 밑에와 같은 객체를 LocalStrategy 첫번째 인자로 넣어주면 된다.

```js
{
  usernameField: 'email',
  passwordField: 'passwd'
}

```

결과적으로

```js
const passport = require("passport"),
  LocalStrategy = require("passport-local").Strategy;

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "passwd" },
    (username, password, done) => {
      User.findOne({ username: username }, (err, user) => {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        if (!user.validPassword(password)) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      });
    }
  )
);
```

LocalStrategy에 첫번째 인자가 추가되면서 임의의 name을 사용할 수 있게 되었다. 리엑트를 사용한다면, req.body.email 이런식으로 받아올 수 있다.

위 코드에 각 조건마다 console을 찍어보면 상황에 맞게 결과가 나오는 것을 볼 수 있다. 하지만, username과 password 모두가 맞는 경우에는 에러가 발생한다.

`req.logIn is not a function`
또는
`passport.initialize() middleware not in use`

이 경우 공식문서 middleware 부분에서와 같이 코드를 추가해준다.

## 4. session

```js
app.use(passport.initialize() // passport를 사용하기 위한 설정
app.use(passport.session())) // session을 사용하기 위한 설정
```

주의 할 점은 passport는 session위에서 작동하는 모듈이기 때문에 session설정 코드 밑에 작성해주는게 중요하다.

이 에러를 해결하셨다면, 다음에러를 마주치게 됩니다.

`Failed to serialize user into session`

세션을 사용하기 위해서 세션에 대한 설정을 해라는 에러다. 공식문서를 살펴보면,

```js
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});
```

이렇게 하라고 나와있다.

로그인이 성공하였다면, serializeUser로 이동하여 첫번째 인자로 로그인이 성공하였을 때 보내준 데이터를 받게 된다. 그리고 done의 두번째 인자로 session에 저장할 값을 넣어주면 된다.

확인해보면 `passport: { user: 'yongs@gmail.com' }`이런식으로 session이 저장되어있다.

세션이 잘 저장되면 deserializeUser로 넘어간다. session에 저장된 값이 첫번째 인자로 넘어가기 때문에 이 값을 사용하여 데이터를 모두 불러와 done처리를 해준다.

이제는 로그인 화면에서 로그인을 하면 session이 생성되고, 새로고침과 같은 리로더를 하더라도 세션값이 쿠키의 식별자로 남아 있어서 로그인 상태를 유지할 수 있게된다. 또 req.user로 deserializeUser에서 done하였던 데이터를 받을 수 있기 때문에 req.user의 유무로 로그인 상태를 나타낼 수 있다.

## 5. 로그아웃

로그아웃은 간단하다.

```js
app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});
```

logout이라는 메서드를 사용하고, 페이지를 리다이랙트 해주면 된다. (리액트를 사용한다면, req.logout()만 해주고 클라이언트에서 페이지를 바꿔주면 될 것 같다.)

## 5. flash

로그인을 시도하였을 때, 결과에 대한 메시지를 일회성으로 출력하기 위해 사용한다.

passport와 별개로 connect-flash를 설치해준다.
`npm install connect-flash`

flash를 사용하기 위해서는 미들웨어도 만들어준다.

```js
const flash = require("connect-flash");

app.use(session({}));
app.use(flash());
```

flash도 session 위에서 작동하는 모듈이기 때문에 session 미들웨어 밑에 코드를 작성해준다.

authenticate의 두번째 인자에도 코드를 하나 더 추가해야한다.

```js
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true, // 실패하였을 때, 메시지 띄우기 위한 설정
    successFlash: true, // 로그인 성공하였을 때, 메시지 띄우기 위한 설정
  })
);
```

이제 req.flash()로 메시지를 불러올 수 있다. req.flash()를 console로 찍어보면 로그인이 실패하였을때는 `{ error: [ 'Incorrect username.' ] }` 성공하였을 때는 `{ success: [ '환영합니다' ] }` 이렇게 error, success로 구분해서 나온다. 만약, 로그인 로직에서 라우터에 따른 message를 작성하지 않았다면 뜨지 않는다.
