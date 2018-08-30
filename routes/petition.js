var express = require('express');
var router = express.Router();
var mongodb = require('../database');

router.get('/',function(req, res, next) {
    console.log('/petition get 패스 요청됨.');
    var now = new Date();
    var limitDay = 10;

    mongodb.PetitionModel.find({$and:[{answer_flag:false},{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}}]}).sort({'count':-1, 'created_at':-1}).exec(function(err,rawContents) {
        if(err) {throw err;}
        for(var i=0; i<rawContents.length; i++) {
            rawContents[i].startDay = rawContents[i].created_at.toISOString().substr(2,8);
            var tmp = new Date(); tmp.setDate(rawContents[i].created_at.getDate() + limitDay);
            rawContents[i].endDay = tmp.toISOString().substr(2,8);

            if(now < tmp) rawContents[i].dayFlag = 1;
            else rawContents[i].dayFlag = 0;
        }

        mongodb.PetitionModel.find({$and:[{answer_flag:false},{'count':{$gte: 20}}]}).sort({'created_at':-1}).exec(function(err, listContents) {
            if(err) {throw err;}
            for(var i=0; i<listContents.length; i++) {
                listContents[i].startDay = listContents[i].created_at.toISOString().substr(2,8);
                var tmp = new Date();tmp.setDate(listContents[i].created_at.getDate() + limitDay);
                listContents[i].endDay = tmp.toISOString().substr(2,8);
                if(now < tmp) listContents[i].dayFlag = 1;
                else listContents[i].dayFlag = 0;
            }

            res.render('index',{ title:"index", contents:rawContents, list:listContents, login:req.session.user });

        })
     });
});

router.get('/list',function(req, res) {
    console.log('/petition/list get 패스 요청됨.');
    var page = req.param('page');
    var sortType = req.param('sort');
    var type = req.param('type');
    var word = req.param('word');
    var deadlineFlag = req.param('deadlineFlag');
    if(page == null) {page = 1;}
    if(type == null) {type = "All";}
    if(sortType == null) {sortType = "created_at";}
    if(deadlineFlag == null) {deadlineFlag = 1;}

    var now = new Date();

    var limitDay = 10;
    var limitSize = 10;
    var limitPage = 5;
    var skipSize = (page-1)*limitSize;

    switch (type) {
        case "All" :
            if(deadlineFlag==1) {
                mongodb.PetitionModel.count({$and:[{answer_flag:false},{'created_at' : {$gte: (new Date()).setDate(now.getDate()-limitDay)}}]},function(err, max){
                    if(err) {throw err;}

                    var pageNum = Math.ceil(max/limitSize);
                    var num = max-((page - 1)*limitSize);
                    var startPage = (Math.floor((page-1)/limitPage)*limitPage)+1;
                    var endPage = startPage + limitPage - 1;
                    if(endPage > pageNum) { endPage = pageNum; }

                    if((page > pageNum || page < 1 ) && max != 0) {
                        console.log("잘못된 페이지");
                        res.send('<script type="text/javascript">alert("잘못된 페이지입니다.");window.location.href = "/petition/list";</script>');
                    } else if(max == 0) {
                        console.log("list가 없다");
                        var info = { startPage: 1, endPage: 1,  limitPage: limitPage, word:word, active: 1, sort: sortType, type: type, pagination: 1, no: 0, deadlineFlag: deadlineFlag };

                        res.render('list', { title:"list", info: info, contents: [], login:req.session.user});
                    } else {
                        switch(sortType) {
                            case "created_at":
                                mongodb.PetitionModel.find({$and:[{answer_flag:false},{'created_at' : {$gte: (new Date()).setDate(now.getDate()-limitDay)}}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
                                    if(err) {throw err;}
                                    for(var i=0; i<pageContents.length; i++) {
                                        pageContents[i].startDay =  pageContents[i].created_at.toISOString().substr(2,8);
                                        var tmp = new Date(); tmp.setDate(pageContents[i].created_at.getDate() + limitDay);
                                        pageContents[i].endDay = tmp.toISOString().substr(2,8);
                                    }
                                    var info = {startPage: startPage, endPage: endPage, limitPage: limitPage, word:word, active: page, sort: sortType, type: type, pagination: pageNum, no: num, deadlineFlag: deadlineFlag };

                                    res.render('list', { title:"list", info: info, contents: pageContents, login:req.session.user});

                                });
                                break;
                            case "count":
                                mongodb.PetitionModel.find({$and:[{answer_flag:false},{'created_at' : {$gte: (new Date()).setDate(now.getDate()-limitDay)}}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
                                    if(err) {throw err;}
                                    for(var i=0; i<pageContents.length; i++) {
                                        pageContents[i].startDay =  pageContents[i].created_at.toISOString().substr(2,8);
                                        var tmp = new Date(); tmp.setDate(pageContents[i].created_at.getDate() + limitDay);
                                        pageContents[i].endDay = tmp.toISOString().substr(2,8);
                                    }
                                    var info = {startPage: startPage, endPage: endPage, limitPage: limitPage, word:word, active: page, sort: sortType, type: type, pagination: pageNum, no: num, deadlineFlag: deadlineFlag };

                                    res.render('list', { title:"list", info: info, contents: pageContents, login:req.session.user});
                                });
                                break;
                        }
                    }
                });
            } else {
                mongodb.PetitionModel.count({$and:[{answer_flag:false},{'created_at' : {$lt: (new Date()).setDate(now.getDate()-limitDay)}}]},function(err, max){
                    if(err) {throw err;}

                    var pageNum = Math.ceil(max/limitSize);
                    var num = max-((page - 1)*limitSize);
                    var startPage = (Math.floor((page-1)/limitPage)*limitPage)+1;
                    var endPage = startPage + limitPage - 1;
                    if(endPage > pageNum) { endPage = pageNum; }

                    if((page > pageNum || page < 1 ) && max != 0) {
                        console.log("잘못된 페이지");
                        res.send('<script type="text/javascript">alert("잘못된 페이지입니다.");window.location.href = "/petition/list";</script>');
                    } else if(max == 0) {
                        console.log("list가 없다");
                        var info = { startPage: 1, endPage: 1,  limitPage: limitPage, word:word, active: 1, sort: sortType, type: type, pagination: 1, no: 0, deadlineFlag: deadlineFlag };

                        res.render('list', { title:"list", info: info, contents: [], login:req.session.user});
                    } else {
                        switch(sortType) {
                            case "created_at":
                                mongodb.PetitionModel.find( {$and:[{answer_flag:false},{'created_at' : {$lt: (new Date()).setDate(now.getDate()-limitDay)}}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
                                    if(err) {throw err;}
                                    for(var i=0; i<pageContents.length; i++) {
                                        pageContents[i].startDay =  pageContents[i].created_at.toISOString().substr(2,8);
                                        var tmp = new Date(); tmp.setDate(pageContents[i].created_at.getDate() + limitDay);
                                        pageContents[i].endDay = tmp.toISOString().substr(2,8);
                                    }
                                    var info = {startPage: startPage, endPage: endPage, limitPage: limitPage, word:word, active: page, sort: sortType, type: type, pagination: pageNum, no: num, deadlineFlag: deadlineFlag };

                                    res.render('list', { title:"list", info: info, contents: pageContents, login:req.session.user});
                                });
                                break;
                            case "count":
                                mongodb.PetitionModel.find( {$and:[{answer_flag:false},{'created_at' : {$lt: (new Date()).setDate(now.getDate()-limitDay)}}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
                                    if(err) {throw err;}
                                    for(var i=0; i<pageContents.length; i++) {
                                        pageContents[i].startDay =  pageContents[i].created_at.toISOString().substr(2,8);
                                        var tmp = new Date(); tmp.setDate(pageContents[i].created_at.getDate() + limitDay);
                                        pageContents[i].endDay = tmp.toISOString().substr(2,8);
                                    }
                                    var info = {startPage: startPage, endPage: endPage, limitPage: limitPage, word:word, active: page, sort: sortType, type: type, pagination: pageNum, no: num, deadlineFlag: deadlineFlag };

                                    res.render('list', { title:"list", info: info, contents: pageContents, login:req.session.user});
                                });
                                break;
                        }
                    }
                });
            }
            break;

        case "search" :
            var searchCondition = {$regex:word};
            if(deadlineFlag==1) {
                mongodb.PetitionModel.count({$and:[{answer_flag:false},{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{$or:[{title:searchCondition},{contents:searchCondition},{nickname:searchCondition}]}]},function(err, max){
                    if(err) {throw err;}

                    var pageNum = Math.ceil(max/limitSize);
                    var num = max-((page - 1)*limitSize);
                    var startPage = (Math.floor((page-1)/limitPage)*limitPage)+1;
                    var endPage = startPage + limitPage - 1;
                    if(endPage > pageNum) { endPage = pageNum; }

                    if((page > pageNum || page < 1 ) && max != 0) {
                        console.log("잘못된 페이지");
                        res.send('<script type="text/javascript">alert("잘못된 페이지입니다.");window.location.href = "/petition/list";</script>');
                    } else if(max == 0) {
                        console.log("list가 없다");
                        var info = { startPage: 1, endPage: 1,  limitPage: limitPage, word:word, active: 1, sort: sortType, type: type, pagination: 1, no: 0, deadlineFlag: deadlineFlag };

                        res.render('list', { title:"list", info: info, contents: [], login:req.session.user});
                    } else {
                        switch(sortType) {
                            case "created_at":
                                mongodb.PetitionModel.find({$and:[{answer_flag:false},{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{$or:[{title:searchCondition},{contents:searchCondition},{nickname:searchCondition}]}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
                                    if(err) {throw err;}
                                    for(var i=0; i<pageContents.length; i++) {
                                        pageContents[i].startDay =  pageContents[i].created_at.toISOString().substr(2,8);
                                        var tmp = new Date(); tmp.setDate(pageContents[i].created_at.getDate() + limitDay);
                                        pageContents[i].endDay = tmp.toISOString().substr(2,8);
                                    }
                                    var info = {startPage: startPage, endPage: endPage, limitPage: limitPage, word:word, active: page, sort: sortType, type: type, pagination: pageNum, no: num, deadlineFlag: deadlineFlag };

                                    res.render('list', { title:"list", info: info, contents: pageContents, login:req.session.user});

                                });
                                break;
                            case "count":
                                mongodb.PetitionModel.find({$and:[{answer_flag:false},{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{$or:[{title:searchCondition},{contents:searchCondition},{nickname:searchCondition}]}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
                                    if(err) {throw err;}
                                    for(var i=0; i<pageContents.length; i++) {
                                        pageContents[i].startDay =  pageContents[i].created_at.toISOString().substr(2,8);
                                        var tmp = new Date(); tmp.setDate(pageContents[i].created_at.getDate() + limitDay);
                                        pageContents[i].endDay = tmp.toISOString().substr(2,8);
                                    }
                                    var info = {startPage: startPage, endPage: endPage, limitPage: limitPage, word:word, active: page, sort: sortType, type: type, pagination: pageNum, no: num, deadlineFlag: deadlineFlag };

                                    res.render('list', { title:"list", info: info, contents: pageContents, login:req.session.user});
                                });
                                break;
                        }
                    }
                });
            } else {
                mongodb.PetitionModel.count({$and:[{answer_flag:false},{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{$or:[{title:searchCondition},{contents:searchCondition},{nickname:searchCondition}]}]},function(err, max){
                    if(err) {throw err;}

                    var pageNum = Math.ceil(max/limitSize);
                    var num = max-((page - 1)*limitSize);
                    var startPage = (Math.floor((page-1)/limitPage)*limitPage)+1;
                    var endPage = startPage + limitPage - 1;
                    if(endPage > pageNum) { endPage = pageNum; }

                    if((page > pageNum || page < 1 ) && max != 0) {
                        console.log("잘못된 페이지");
                        res.send('<script type="text/javascript">alert("잘못된 페이지입니다.");window.location.href = "/petition/list";</script>');
                    } else if(max == 0) {
                        console.log("list가 없다");
                        var info = { startPage: 1, endPage: 1,  limitPage: limitPage, word:word, active: 1, sort: sortType, type: type, pagination: 1, no: 0, deadlineFlag: deadlineFlag };

                        res.render('list', { title:"list", info: info, contents: [], login:req.session.user});
                    } else {
                        switch(sortType) {
                            case "created_at":
                                mongodb.PetitionModel.find({$and:[{answer_flag:false},{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{$or:[{title:searchCondition},{contents:searchCondition},{nickname:searchCondition}]}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
                                    if(err) {throw err;}
                                    for(var i=0; i<pageContents.length; i++) {
                                        pageContents[i].startDay =  pageContents[i].created_at.toISOString().substr(2,8);
                                        var tmp = new Date(); tmp.setDate(pageContents[i].created_at.getDate() + limitDay);
                                        pageContents[i].endDay = tmp.toISOString().substr(2,8);
                                    }
                                    var info = {startPage: startPage, endPage: endPage, limitPage: limitPage, word:word, active: page, sort: sortType, type: type, pagination: pageNum, no: num, deadlineFlag: deadlineFlag };

                                    res.render('list', { title:"list", info: info, contents: pageContents, login:req.session.user});
                                });
                                break;
                            case "count":
                                mongodb.PetitionModel.find({$and:[{answer_flag:false},{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{$or:[{title:searchCondition},{contents:searchCondition},{nickname:searchCondition}]}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
                                    if(err) {throw err;}
                                    for(var i=0; i<pageContents.length; i++) {
                                        pageContents[i].startDay =  pageContents[i].created_at.toISOString().substr(2,8);
                                        var tmp = new Date(); tmp.setDate(pageContents[i].created_at.getDate() + limitDay);
                                        pageContents[i].endDay = tmp.toISOString().substr(2,8);
                                    }
                                    var info = {startPage: startPage, endPage: endPage, limitPage: limitPage, word:word, active: page, sort: sortType, type: type, pagination: pageNum, no: num, deadlineFlag: deadlineFlag };

                                    res.render('list', { title:"list", info: info, contents: pageContents, login:req.session.user});
                                });
                                break;
                        }
                    }
                });
            }
            break;

        default :
            var searchType = {$regex:type};
            if(deadlineFlag==1) {
                console.log(type);
                mongodb.PetitionModel.count({$and:[{answer_flag:false},{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":searchType}]},function(err, max){
                    if(err) {throw err;}
                    var pageNum = Math.ceil(max/limitSize);
                    var num = max-((page - 1)*limitSize);
                    var startPage = (Math.floor((page-1)/limitPage)*limitPage)+1;
                    var endPage = startPage + limitPage - 1;
                    if(endPage > pageNum) { endPage = pageNum; }

                   if((page > pageNum || page < 1 ) && max != 0) {
                        console.log("잘못된 페이지");
                        res.send('<script type="text/javascript">alert("잘못된 페이지입니다.");window.location.href = "/petition/list";</script>');
                    } else if(max == 0) {
                        console.log("list가 없다");
                        var info = { startPage: 1, endPage: 1,  limitPage: limitPage, word:word, active: 1, sort: sortType, type: type, pagination: 1, no: 0, deadlineFlag: deadlineFlag };

                        res.render('list', { title:"list", info: info, contents: [], login:req.session.user});
                    } else {
                        switch(sortType) {
                            case "created_at":
                                mongodb.PetitionModel.find({$and:[{answer_flag:false},{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":searchType}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
                                    if(err) {throw err;}
                                    for(var i=0; i<pageContents.length; i++) {
                                        pageContents[i].startDay =  pageContents[i].created_at.toISOString().substr(2,8);
                                        var tmp = new Date(); tmp.setDate(pageContents[i].created_at.getDate() + limitDay);
                                        pageContents[i].endDay = tmp.toISOString().substr(2,8);
                                    }
                                    var info = {startPage: startPage, endPage: endPage, limitPage: limitPage, word:word, active: page, sort: sortType, type: type, pagination: pageNum, no: num, deadlineFlag: deadlineFlag };

                                    res.render('list', { title:"list", info: info, contents: pageContents, login:req.session.user});

                                });
                                break;
                            case "count":
                                mongodb.PetitionModel.find({$and:[{answer_flag:false},{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":searchType}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
                                    if(err) {throw err;}
                                    for(var i=0; i<pageContents.length; i++) {
                                        pageContents[i].startDay =  pageContents[i].created_at.toISOString().substr(2,8);
                                        var tmp = new Date(); tmp.setDate(pageContents[i].created_at.getDate() + limitDay);
                                        pageContents[i].endDay = tmp.toISOString().substr(2,8);
                                    }
                                    var info = {startPage: startPage, endPage: endPage, limitPage: limitPage, word:word, active: page, sort: sortType, type: type, pagination: pageNum, no: num, deadlineFlag: deadlineFlag };

                                    res.render('list', { title:"list", info: info, contents: pageContents, login:req.session.user});
                                });
                                break;
                        }
                    }
                });

            } else {
                mongodb.PetitionModel.count({$and:[{answer_flag:false},{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":searchType}]},function(err, max){
                    if(err) {throw err;}

                    var pageNum = Math.ceil(max/limitSize);
                    var num = max-((page - 1)*limitSize);
                    var startPage = (Math.floor((page-1)/limitPage)*limitPage)+1;
                    var endPage = startPage + limitPage - 1;
                    if(endPage > pageNum) { endPage = pageNum; }

                    if((page > pageNum || page < 1 ) && max != 0) {
                        console.log("잘못된 페이지");
                        res.send('<script type="text/javascript">alert("잘못된 페이지입니다.");window.location.href = "/petition/list";</script>');
                    } else if(max == 0) {
                        console.log("list가 없다");
                        var info = { startPage: 1, endPage: 1,  limitPage: limitPage, word:word, active: 1, sort: sortType, type: type, pagination: 1, no: 0, deadlineFlag: deadlineFlag };

                        res.render('list', { title:"list", info: info, contents: [], login:req.session.user});
                    } else {
                        switch(sortType) {
                            case "created_at":
                                mongodb.PetitionModel.find({$and:[{answer_flag:false},{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":searchType}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
                                    if(err) {throw err;}
                                    for(var i=0; i<pageContents.length; i++) {
                                        pageContents[i].startDay =  pageContents[i].created_at.toISOString().substr(2,8);
                                        var tmp = new Date(); tmp.setDate(pageContents[i].created_at.getDate() + limitDay);
                                        pageContents[i].endDay = tmp.toISOString().substr(2,8);
                                    }
                                    var info = {startPage: startPage, endPage: endPage, limitPage: limitPage, word:word, active: page, sort: sortType, type: type, pagination: pageNum, no: num, deadlineFlag: deadlineFlag };

                                    res.render('list', { title:"list", info: info, contents: pageContents, login:req.session.user});
                                });
                                break;
                            case "count":
                                mongodb.PetitionModel.find({$and:[{answer_flag:false},{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":searchType}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
                                    if(err) {throw err;}
                                    for(var i=0; i<pageContents.length; i++) {
                                        pageContents[i].startDay =  pageContents[i].created_at.toISOString().substr(2,8);
                                        var tmp = new Date(); tmp.setDate(pageContents[i].created_at.getDate() + limitDay);
                                        pageContents[i].endDay = tmp.toISOString().substr(2,8);
                                    }
                                    var info = {startPage: startPage, endPage: endPage, limitPage: limitPage, word:word, active: page, sort: sortType, type: type, pagination: pageNum, no: num, deadlineFlag: deadlineFlag };

                                    res.render('list', { title:"list", info: info, contents: pageContents, login:req.session.user});
                                });
                                break;
                        }
                    }
                });
            }
            break;
    }
});


router.get('/post',function(req, res, next) {
    console.log('/petition/post get 패스 요청됨.');
    if(req.session.user) {
        res.render('post',{ title:"post", login:req.session.user});
    } else {
        res.send('<script type="text/javascript">alert(" 로그인을 해야합니다. ");window.location.href = "/users/login";</script>');
    }

});

router.post('/post', function(req, res, next) {
    console.log('/petition/post post 패스 요청됨.');
    var title = req.body.title;
    var type = req.body.type;
    var contents = req.body.contents;
    var is_anonymous = req.body.is_anonymous;

    if(!req.session.user) {
        res.send('<script type="text/javascript">alert("로그인하셔야 합니다.");window.location.href = "/users/login";</script>');
    }
    else if(!title || !contents) {
         res.send('<script type="text/javascript">alert("제목과 내용을 입력해야합니다.");window.location.href = "/petition/post";</script>');
    } else {
        var flag = is_anonymous=="true"?true:false;
        
        var post = new mongodb.PetitionModel({
            title : title,
            type : type,
            contents : contents,
            nickname : req.session.user.nickname,
            writer : req.session.user.uid,
            is_anonymous:flag
        });

        post.save(function(err, result) {
            if(err) {throw err;}
            console.log('글 데이터 추가함');
            res.redirect('/petition/list');
        });

        //   pool.query("SELECT * FROM users where uid=?", req.session.user.uid , (err, rows) => {
        //       if (err) {
        //           console.log(err);
        //       } else {
        //           if (rows.length > 0) {
        //               console.log('요청 파라미터 : ' + title +', '+contents);
        //               var flag = is_anonymous=="true"?true:false;
        //               var post = new mongodb.PetitionModel({
        //                   title : title,
        //                   type : type,
        //                   contents : contents,
        //                   nickname : rows[0].nickname,
        //                   writer : rows[0].uid,
        //                   is_anonymous:flag
        //               });
        //               post.save(function(err, result) {
        //                   if(err) {throw err;}
        //                   console.log('글 데이터 추가함');
        //                   res.redirect('/petition/list');
        //               });
        //           } else {
        //                 console.log("회원정보가 mysql에 없습니다");
        //                 console.log(req.session.user.uid) ;
        //             return; }
        //       }
        //   });
    }
});

router.get('/content', function(req, res){
    console.log('/petition/content get 패스 요청됨.');

    var page = req.param('page');
    if(page == null) {page = 1;}
    var id = req.param('id');
    var now = new Date();

    var limitDay = 10;
    var limitSize = 5;
    var limitPage = 5;


    mongodb.PetitionModel.findOne({_id: id},function(err, content){
        if(err) { throw err; }

        var writer=content.is_anonymous?"익명":content.nickname;
        console.log(writer);

        console.log(content);
        mongodb.AnswerModel.findOne({_id: content.answer},function(err, answer){
            if(err) { throw err; }
            console.log(answer);

            var max = content.comments.length;

            var skipSize = (page-1)*limitSize;
            var pageNum = Math.ceil(max/limitSize);
            var startPage = (Math.floor((page-1)/limitPage)*limitPage)+1;
            var endPage = startPage + limitPage - 1;
            if(endPage > pageNum) { endPage = pageNum; }


            if((page > pageNum || page < 1) && max != 0) {
                console.log("잘못된 페이지");
                res.send('<script type="text/javascript">alert("잘못된 페이지입니다.");window.location.href = "/petition/content?id='+id+'";</script>');
            } else if(max == 0) {
                console.log("comments가 없다.");

                content.startDay = content.created_at.toISOString().substr(2,8);
                var tmp = new Date(); tmp.setDate(content.created_at.getDate() + limitDay);
                content.endDay = tmp.toISOString().substr(2,8);
                if(now < tmp) content.dayFlag = 1;
                else content.dayFlag = 0;

                var info = { startPage: 1, endPage: 1, limitPage: limitPage, active: 1, pagination: 1 };
                res.render('content', { title:"content", info: info, content:content,answer:answer, login:req.session.user});

            } else {
                mongodb.PetitionModel.findOne({_id: id}, {comments: {$slice: [skipSize, limitSize]}}, function(err, commentsContent){
                    if(err) {throw err; }
                    commentsContent.startDay = commentsContent.created_at.toISOString().substr(2,8);
                    var tmp = new Date(); tmp.setDate(commentsContent.created_at.getDate() + limitDay);
                    commentsContent.endDay = tmp.toISOString().substr(2,8);
                    if(now < tmp) commentsContent.dayFlag = 1;
                    else commentsContent.dayFlag = 0;

                    var info = { startPage: startPage, endPage: endPage, limitPage: limitPage, active: page, pagination: pageNum };
                    res.render('content', { title:"content", info: info, content:commentsContent,answer:answer, login:req.session.user});
                });
            }
        });
    });
});

router.post('/comment', function(req, res){
    console.log('/petition/comment post 패스 요청됨.');
    var contents = req.body.contents;
    var is_comment_anonymous = req.body.is_comment_anonymous=="true"?true:false;

    var id = req.body.id;
    var now = new Date();

    var limitDay = 10;
    var limitSize = 5;
    var limitPage = 5;

    if(!req.session.user) {
        res.send('<script type="text/javascript">alert("로그인하셔야 합니다.");window.location.href = "/users/login";</script>');
    } else {
        addComment(id,req.session.user,contents,is_comment_anonymous,function(result){            
            if(result){
                mongodb.PetitionModel.findOne({_id: id}, function(err, content){
                    if(err) {throw err;}

                    var max = content.comments.length + 1;
                    var pageNum = Math.ceil(max/limitSize);
                    var startPage = 1;
                    var endPage = limitPage;
                    if(endPage > pageNum) { endPage = pageNum; }

                    // content.comments.unshift({writer:req.session.user.uid, contents: contents, is_comment_anonymous:is_comment_anonymous});
                    // content.count += 1;
                    // content.save(function(err){
                        mongodb.PetitionModel.findOne({_id: id}, {comments: {$slice: [0, limitSize]}}, function(err, rawContent){
                            if(err) { throw err; }
                            rawContent.startDay = rawContent.created_at.toISOString().substr(2,8);
                            var tmp = new Date(); tmp.setDate(rawContent.created_at.getDate() + limitDay);
                            rawContent.endDay = tmp.toISOString().substr(2,8);
                            if(now < tmp) rawContent.dayFlag = 1;
                            else rawContent.dayFlag = 0;

                            var info = { startPage: startPage, endPage: endPage, limitPage: limitPage, active: 1, pagination: pageNum  }
                            res.render('content', { title:"content", info: info, content:rawContent, login:req.session.user});

                            console.log('render완료')
                        });
                    });
                // });
            }else{
                console.log(" addComment result false")
                res.send('<script type="text/javascript">alert("' + '이미 동의한 청원입니다.' + '");window.history.back();</script>');
            }
        });
    }
});


router.get('/reply', function(req, res) {
    console.log('/petition/reply get 패스 요청됨.');

    var page = req.param('page');
    if(page == null) {page = 1;}
    var limitDay = 10;
    var limitSize = 5;
    var limitPage = 5;
    var now = new Date();

    mongodb.PetitionModel.count({answer_flag: true},function(err, max){
        if(err) {throw err;}

        var num = max-((page - 1)*limitSize);
        var skipSize = (page-1)*limitSize;
        var pageNum = Math.ceil(max/limitSize);
        var startPage = (Math.floor((page-1)/limitPage)*limitPage)+1;
        var endPage = startPage + limitPage - 1;
        if(endPage > pageNum) { endPage = pageNum; }
        if(skipSize + limitSize > max) { limitSize = max - skipSize; }

        if((page > pageNum || page < 1) && max != 0) {
            console.log("잘못된 페이지");
            res.send('<script type="text/javascript">alert("잘못된 페이지입니다.");window.location.href = "/petition/reply";</script>');
        } else if(max == 0) {
            console.log("reply가 없다");
            var info = { startPage: 1, endPage: 1, limitPage: limitPage, active: 1, no: 1, pagination: 1 };

            res.render('reply', { title:"reply", info: info, contents: [], login:req.session.user});

        } else {
            mongodb.PetitionModel.find({answer_flag:true}).populate("answer").sort({'updated_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, contents) {
                if(err) { throw err; }
                console.log(contents)
                for(var i=0; i<contents.length; i++) {
                    contents[i].startDay =  contents[i].created_at.toISOString().substr(2,8);
                    var tmp = new Date(); tmp.setDate(contents[i].created_at.getDate() + limitDay);
                    contents[i].endDay = tmp.toISOString().substr(2,8);
                    contents[i].answerDay = contents[i].updated_at.toISOString().substr(2,8);
                }
                var info = { startPage: startPage, endPage: endPage, limitPage: limitPage, no: num, active: page,   pagination: pageNum };

                res.render('reply', { title:"reply", info: info, contents:contents, login:req.session.user});
            });
        }
    });
});


router.get('/reply_post', function(req, res) {
    console.log('/petition/reply_post get 패스 요청됨.');
    var id = req.param('id');
    var now = new Date();
    var limitDay = 10;

    mongodb.PetitionModel.findOne({_id:id}).populate("answer").exec(function(err, content){
        if(err) {throw err;}

        mongodb.PetitionModel.find({answer_flag:true},function(err,answers){
            if(err) {throw err;}
            console.log(answers.answer);

            content.startDay = content.created_at.toISOString().substr(2,8);
            var tmp = new Date();tmp.setDate(content.created_at.getDate() + limitDay);
            content.endDay = tmp.toISOString().substr(2,8);
            if(now < tmp) content.dayFlag = 1;
            else content.dayFlag = 0;

            res.render('reply_post', { title:"reply_post", content:content,answer_list:answers, id:id, login:req.session.user});
        });
    });
});


router.post('/reply_post', function(req, res) {
    console.log('/petition/reply_post post 패스 요청됨.');

    var limitDay = 10;
    var limitSize = 5;
    var limitPage = 5;

    var id = req.body.id || req.query.id;

    var answer_selected = req.body.answer_list_select|| req.query.answer_list_select;
    console.log(answer_selected);

    if(answer_selected != "없음"){
        mongodb.PetitionModel.findOne({_id:id}, function(err, content){

            if(err){ console.log('err발생!');console.log(err);}

            content.answer_flag = true;
            content.answer = answer_selected;
            console.log(content);

            content.save(function(err){

                mongodb.PetitionModel.count({answer_flag: true},function(err, max){
                    if(err) {throw err;}
                    var num = max;
                    var pageNum = Math.ceil(max/limitSize);
                    var startPage = 1;
                    var endPage = limitPage;
                    if(endPage > pageNum) { endPage = pageNum; }

                    if(max == 0) {
                        console.log("reply가 없다");
                        var info = { startPage: 1, endPage: 1, limitPage: limitPage, active: 1, no: 1, pagination: 1}
                        res.render('reply', { title:"reply", info: info, contents:[], login:req.session.user});
                    } else {
                        mongodb.PetitionModel.find({answer_flag: true}).populate("answer").sort({'updated_at':-1}).limit(limitSize).exec(function(err, contents) {
                            if(err) { throw err; }
                            console.log(contents);
                            for(var i=0; i<contents.length; i++) {
                                contents[i].startDay =  contents[i].created_at.toISOString().substr(2,8);
                                var tmp = new Date(); tmp.setDate(contents[i].created_at.getDate() + limitDay);
                                contents[i].endDay = tmp.toISOString().substr(2,8);
                                contents[i].answerDay = contents[i].updated_at.toISOString().substr(2,8);
                            }

                            var info = { startPage: startPage, endPage: endPage, limitPage: limitPage, no: num, active: 1, pagination: pageNum  }
                            console.log('render');
                            res.render('reply', { title:"reply", info: info, contents:contents, login:req.session.user});
                        });
                    }
                });
            });
        });
    }
    else{

        var contents = req.body.content || req.query.content;
        var link = req.body.link || req.query.link;
        console.log('link:', link);

        var linkstr;
        if(!link) {
            linkstr='';
        } else if(link.length<24) {
            linkstr='';
        } else {
            linkstr = link.substr(0,24);
        }
        console.log('linkstr:', linkstr);
        var now = new Date();

        var newAnswers = new mongodb.AnswerModel({
            contents: null,
            video : null,
            writer : id,
            created_at : now,
            updated_at : now
        })
        console.log('answer_selected==없음');
        if(!link || !contents) {
            var url='/petition/reply_post?id='+id;
            res.send('<script type="text/javascript">alert("링크와 내용을 입력해야합니다.");</script>');

        } else if(linkstr != "https://www.youtube.com/") {
            res.send('<script type="text/javascript">alert("링크의 형식이 잘못되었습니다. [ https://www.youtube.com/ ]");window.location.href="/petition/reply_post?id=<%=id%>";</script>');
            //res.redirect('/petition/reply_post?id=', id);
        } else {
            mongodb.PetitionModel.findOne({_id:id}, function(err, content){
                if(err) {throw err;}
                console.log(id+"찾음");
                var linkstr1 = link.split('=');
                var linkstr2 = link.substr(24,6);

                if(linkstr1[0] == "https://www.youtube.com/watch?v") {
                    var strtmp = "https://www.youtube.com/embed/" + linkstr1[1];
                    console.log("strtmp : " + strtmp);
                    // content.answer_video = strtmp;
                    content.answer_flag = true;
                    // content.answer_contents = contents;
                    // content.updated_at = now;

                    newAnswers.video = strtmp;
                    newAnswers.contents = contents;

                } else if(linkstr2 == "embed/") {
                    console.log("link : " + link);
                    // content.answer_video = link;
                    content.answer_flag = true;
                    // content.answer_contents = contents;
                    // content.updated_at = now;

                    newAnswers.video = link;
                    newAnswers.contents = contents;
                } else {
                    throw err;
                }

                newAnswers.save(function(err,result){
                    if(err){throw err;}

                    console.log("청원답변 저장");
                    content.answer = result._id;
                    content.save(function(err){
                        if(err){throw err;}

                        mongodb.PetitionModel.count({answer_flag: true},function(err, max){
                            if(err) {throw err;}
                            var num = max;
                            var pageNum = Math.ceil(max/limitSize);
                            var startPage = 1;
                            var endPage = limitPage;
                            if(endPage > pageNum) { endPage = pageNum; }

                            if(max == 0) {
                                console.log("reply가 없다");
                                var info = { startPage: 1, endPage: 1, limitPage: limitPage, active: 1, no: 1, pagination: 1}
                                res.render('reply', { title:"reply", info: info, contents:[], login:req.session.user});
                            } else {
                                mongodb.PetitionModel.find({answer_flag: true}).populate("answer").sort({'updated_at':-1}).limit(limitSize).exec(function(err, contents) {
                                    if(err) { throw err; }
                                    for(var i=0; i<contents.length; i++) {
                                        contents[i].startDay =  contents[i].created_at.toISOString().substr(2,8);
                                        var tmp = new Date(); tmp.setDate(contents[i].created_at.getDate() + limitDay);
                                        contents[i].endDay = tmp.toISOString().substr(2,8);
                                        contents[i].answerDay = contents[i].updated_at.toISOString().substr(2,8);
                                    }

                                    var info = { startPage: startPage, endPage: endPage, limitPage: limitPage, no: num, active: 1, pagination: pageNum  }
                                    res.render('reply', { title:"reply", info: info, contents:contents, login:req.session.user});
                                    });
                                }
                            });

                        });

                    });
            });
        }
    }
});



router.get('/delete', function(req, res){
    console.log('/petition/delete get 패스 요청됨.');

    var contentId = req.param('id');

    if(req.session.user.uid != "DYYuut6bTfNEkNLbMiFjyDIui1e2") {
        res.send('<script type="text/javascript">alert("삭제 할 권한이 없습니다.");</script>');
    } else {
        mongodb.PetitionModel.remove({_id:contentId}, function(err){
            if(err) {throw err;}
            res.send('<script type="text/javascript">alert("글이 삭제되었습니다.");window.location.href = "/petition/list";</script>');
        });
    }
});



module.exports = router;

function addComment(petition,writer,comment,annoymous,callback){

    var result = false;
    console.log(petition,writer)
    mongodb.PetitionModel.findOne({_id:petition},{'comments':{$elemMatch:{writer:writer.nickname}}},function(err,user_comment){
        if(!err){
            if(user_comment.comments.length == 0){                
                mongodb.PetitionModel.findOne({_id:petition},function(err,rawContent){
                    if(err) throw err;
                    
                    //데이터를 배열 앞에 추가해준다 (댓글이 추가된 순서대로 보기 위해서)
                    rawContent.comments.unshift({writer:writer.nickname, contents: comment, is_comment_anonymous:annoymous});
                    rawContent.count += 1;
                    // rawContent.comments.unshift({name:writer.email,memo:comment});
                
                    rawContent.save(function(err){
                        if(err) throw err;
                        result = true;
                        
                        console.log("callback true return");
                        callback(result);
                    });
                });
            }
            else{
                console.log("callback false return");
                callback(result);                
            }
        }
    });
  }