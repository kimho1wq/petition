var express = require('express');
var router = express.Router();
var firebase = require("firebase");
var mongodb = require('../database');

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
                        pool.query("SELECT * FROM users where uid=?", user.uid , (err, rows) => {
                            if (err) {
                                console.log(err);
                                res.send('<script type="text/javascript">alert(" 로그인정보가 mysql에 없습니다! ");window.location.href = "/";</script>');
                            } else {
                                try{
                                    sess.user = {
                                        uid: user.uid,
                                        email: email,
                                        name: rows[0].name,
                                        major: rows[0].major,
                                        nickname: rows[0].nickname,
                                        authorized:true
                                    }
                                    console.log(sess.user);
                                    res.send('<script type="text/javascript">alert(" 로그인 성공! ");window.location.href = "/";</script>');
                                }catch (exception) {
                                    console.log(rows);
                                    res.send('<script type="text/javascript">alert(" 회원정보가 mysql에 없습니다! ");window.location.href = "/";</script>');
                                }
                            }
                        });
                    }

                }
            }
        });
    }).catch(function(e) {
        res.send('<script type="text/javascript">alert("아이디 또는 비밀번호를 다시 확인해주십시오.");window.location.href = "/users/login";</script>');
        return;
    });
});


router.get('/mypage', function(req, res) {
    console.log('get /mypage');
    console.log(req.session.user);
    var page = req.param('page');
    var sortType = req.param('sort');
    var type = req.param('type');
    var word = req.query.word;

    if(!word) {
        word='';
    }
    var searchCondition={
        $or:[{title:{$regex:word}}, {contents:{$regex:word}}, {nickname:{$regex:word}}]
    };


    var view = req.param('view');
    console.log('view:', view);
    var deadlineFlag = req.param('deadlineFlag');

    if(page == null) {page = 1;}
    if(type == null) {type = "All";}
    if(sortType == null) {sortType = "created_at";}
    if(deadlineFlag == null) {deadlineFlag = 1;}
    if(view==null) view="all";

    var limitDay = 30;
    var limitSize = 5;
    var limitPage = 5;
    var skipSize = (page-1)*limitSize;

    if(!req.session.user) {
        console.log('login X');
        res.send('<script type="text/javascript">alert("로그인이 필요합니다.");window.location.href = "/users/login";</script>');
    }else {
        var viewCondition;
        var today=Date.now();

        console.log('login O');

        //res.render('mypage', {login:req.session.user});
        if(view=="all") {
            console.log('all')
            viewCondition = {
                writer:req.session.user.uid
            }
        } else if(view=="ing") {
            console.log('ing');
            viewCondition={
                writer:req.session.user.uid,
                created_at:{$gte: today-30*24*60*60000},
                answer_flag:false
            }
        } else {
            console.log('ans');
            viewCondition={

                    writer:req.session.user.uid,
                    answer_flag:true

            }
        }

        var all_cnt;
        var ing_cnt;
        var answered_cnt;

        mongodb.PetitionModel.count({writer:req.session.user.uid}).exec(function(err, c) {
            if (err) throw err;
            all_cnt=c;
        });
        console.log('1');
        mongodb.PetitionModel.count({$and:[{writer:req.session.user.uid}, {answer_flag:false}, {created_at:{$gte: today-limitDay*24*60*60000}}]}, function(err, c) {
            if (err) throw err;
            ing_cnt=c;
        });
        console.log('2');
        mongodb.PetitionModel.count({$and:[{writer:req.session.user.uid}, {answer_flag:true}]}).exec(function(err, c) {
            if (err) throw err;
            answered_cnt=c;
        });
        console.log('3');
        mongodb.PetitionModel.count({$and:[searchCondition, viewCondition]}).exec(function(err, cnt) {
            console.log('mongodv1');
            if(err) {
                throw err;
            }
            var pageNum = Math.ceil(cnt/limitSize);
            var num = cnt-((page - 1)*limitSize);
            var startPage = (Math.floor((page-1)/limitPage)*limitPage)+1;
            var endPage = startPage + limitPage - 1;
            if(endPage > pageNum) { endPage = pageNum; }

            if((page > pageNum || page < 1 ) && cnt != 0) {
                console.log("잘못된 페이지");
                res.send('<script type="text/javascript">alert("잘못된 페이지입니다.");window.location.href = "/users/mypage";</script>');
            } else if(cnt == 0) {
                console.log("list가 없다");
                var info = { startPage: 1, endPage: 1,  all_cnt:all_cnt, ing_cnt:ing_cnt, word:word, view:view, answered_cnt:answered_cnt, limitPage: limitPage, active: 1, type: type, pagination: 1, no: 0 };

                res.render('mypage', { title:"mypage", info: info, contents: rawContents, login:req.session.user});
            } else {
                var info = {startPage: startPage, endPage: endPage, all_cnt:all_cnt, word:word, view:view, ing_cnt:ing_cnt, answered_cnt:answered_cnt, limitPage: limitPage, active: page,  type: type, pagination: pageNum, no: num };

                mongodb.PetitionModel.find({$and:[searchCondition, viewCondition]}).skip(skipSize).limit(limitSize).exec(function(err,rawContents) {

                    if(err) throw err;



                    for(var i=0; i<rawContents.length; i++) {
                        rawContents[i].startDay =  rawContents[i].created_at.toISOString().substr(2,8);
                        var tmp = new Date();
                        tmp.setDate(rawContents[i].created_at.getDate() + limitDay);
                        rawContents[i].endDay = tmp.toISOString().substr(2,8);
                        console.log(rawContents[i].startDay, rawContents[i].endDay);
                    }

                    res.render('mypage', { title:"mypage", info: info, contents: rawContents, login:req.session.user});
                    console.log('found');
                });
            }
        });
    }
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

                    /*pool.getConnection(function(err, conn) {
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
                    })*/

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
