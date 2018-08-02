var express = require('express');
var router = express.Router();
var firebase = require("firebase");

var config = {
    apiKey: "AIzaSyDHbuU2DzSRzXV2V9zwf9rS8DxzYfR9Ir4",
    authDomain: "mypetition-1.firebaseapp.com",
    databaseURL: "https://mypetition-1.firebaseio.com",
    projectId: "mypetition-1",
    storageBucket: "mypetition-1.appspot.com",
    messagingSenderId: "643778957765"
};
firebase.initializeApp(config);
var db = firebase.firestore();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

//로그인 폼 링크
router.get('/login',function(req, res, next) {
    console.log('/login get 패스 요청됨.');
    if(req.session.user) {
        res.send('<script type="text/javascript">alert("이미 로그인되어 있습니다.");window.location.href = "/";</script>');
    } else {
        res.render('login',{login:req.session.user});
    }
});

router.post('/login',function(req, res) {
    console.log('/login post 패스 요청됨.');
    let sess = req.session;
    var email =  req.body.email || req.query.email;
    var password = req.body.password || req.query.password;
           
    firebase.auth().signInWithEmailAndPassword(email, password).then(function() {
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                if (!user.emailVerified) { //이메일 인증 받은 유저
                    console.log('verified false');
                    res.send('<script type="text/javascript">alert("인증 실패 (가입 시 입력한 메일을 확인하여 인증을 완료해주세요.)");window.location.href = "/users/login";</script>');
                } else {
                    console.log('verified true');
                    if(sess.user) {
                        console.log('이미 로그인되어 있습니다.');
                    }
                    else {
                        sess.user = {
                            uid: user.uid,
                            email: email,
                            name: user.name,
                            nickname: user.nickname,
                            authorized:true
                        }
                    }
                    res.send('<script type="text/javascript">alert(" 로그인 성공! ");window.location.href = "/";</script>');
                }   
            }
        });
    }).catch(function(e) {
        res.send('<script type="text/javascript">alert("아이디 또는 비밀번호를 다시 확인해주십시오.");window.location.href = "/users/login";</script>');
        return;
    });
});

//회원가입 폼 링크
router.get('/signup', function(req, res, next) {
    console.log('/signup 패스 요청됨.');
    res.render('signup',{login:req.session.user});
});

router.post('/signup', function(req, res, next) {
    console.log('/signup post 패스 요청됨.');
    
    var email =  req.body.email || req.query.email;
    var password = req.body.password || req.query.password;
    var name = req.body.name || req.query.name;
    var university = req.body.university || req.query.university;
    var major = req.body.major || req.query.major;
    var nickname = req.body.nickname || req.query.nickname;
    var year = req.body.year || req.query.year;
    
    firebase.auth().createUserWithEmailAndPassword(email, password).then(function() {
        firebase.auth().signInWithEmailAndPassword(email, password).then(function() {
            console.log("로그인 성공");
            firebase.auth().onAuthStateChanged(function(user) {
                if (user) {
	            // user 정보 추가
                    db.collection("users").doc(user.uid).set({
                        uid : user.uid,
                        name: name,
                        email: email,
                        university : university,
                        major: major,
                        nickname: nickname,
                        admission_year : year
				    }).then(function() {
                        console.log("Document successfully written!");
                    }).catch(function(error) {
                        console.error("Error writing document: ", error);
                    });
                    
                    pool.getConnection(function(err, conn) {
                        if(err) {
                            if(conn) conn.release();
                            return;
                        }
                        console.log('데이터베이스 연결 스레드 아이디 : ' + conn.threadId);
                        
                        var data = {uid:user.uid, name:name, email:email, university:university, major:major, nickname:nickname, year:year};
                        
                        var exec = conn.query('insert into users set ?', data, function(err, result) {
                            conn.release();
                            if(err) {
                                console.log('sql 실행 시 오류 발생');
                                console.dir(err);
                                return;
                            }
                        })
                    })
                        
                    if(!user.emailVerified){
						user.sendEmailVerification().then(function() {
                            console.log("인증메일 보냄");
                            res.send('<script type="text/javascript">alert("회원가입 완료 (가입시 등록한 이메일 인증후 로그인하시기 바랍니다)");window.location.href = "/users/login";</script>');
                        }).catch(function(error) {
                            console.log(error.message);
                        });
                    }
                }
            });
        }).catch(function(error) {
            // Handle Errors here.
		console.log(error);
        });
    }).catch(function(e) {
        return;
    });
});

router.get('/logout',function(req, res) {
    console.log('/logout post 패스 요청됨.');
    if(req.session.user) {
        console.log('로그아웃합니다.');
        req.session.destroy(function(err) {
            if(err) {throw err;}
            res.send('<script type="text/javascript">alert("로그아웃 되었습니다.");window.location.href = "/";</script>');
        });
    } else {
        res.send('<script type="text/javascript">alert("로그인이 되어있지 않습니다.");window.location.href = "/";</script>');
    }
});

module.exports = router;
