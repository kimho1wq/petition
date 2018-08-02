var express = require('express');
var router = express.Router();
var mongodb = require('../database');

router.get('/',function(req, res, next) {
    console.log('/petition get 패스 요청됨.');
    var now = new Date();
    var limitDay = 10;
    
    mongodb.PetitionModel.find({}).sort({'count':-1, 'created_at':-1}).exec(function(err,rawContents) {
        if(err) {throw err;}
        for(var i=0; i<rawContents.length; i++) {
            rawContents[i].startDay = rawContents[i].created_at.toISOString().substr(2,8);
            var tmp = new Date(); tmp.setDate(rawContents[i].created_at.getDate() + limitDay);
            rawContents[i].endDay = tmp.toISOString().substr(2,8);
            
            if(now < tmp) rawContents[i].dayFlag = 1;
            else rawContents[i].dayFlag = 0;
        }
        
        mongodb.PetitionModel.find({'count': {$gte: 20}}).sort({'created_at':-1}).exec(function(err, listContents) {
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
                mongodb.PetitionModel.count({'created_at' : {$gte: (new Date()).setDate(now.getDate()-limitDay)}},function(err, max){
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
                                mongodb.PetitionModel.find({"created_at" : {"$gte": (new Date()).setDate(now.getDate()-limitDay)}}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({"created_at" : {"$gte": (new Date()).setDate(now.getDate()-limitDay)}}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                mongodb.PetitionModel.count({'created_at' : {"$lt": (new Date()).setDate(now.getDate()-limitDay)}},function(err, max){
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
                                mongodb.PetitionModel.find({"created_at" : {"$lt": (new Date()).setDate(now.getDate()-limitDay)}}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({"created_at" : {"$lt": (new Date()).setDate(now.getDate()-limitDay)}}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
        case "총학생회" :
            if(deadlineFlag==1) {
                console.log("총학생회");
                mongodb.PetitionModel.count({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"총학생회"}]},function(err, max){
                    if(err) {throw err;}
                    console.log("총학생회");
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"총학생회"}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"총학생회"}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                mongodb.PetitionModel.count({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"총학생회"}]},function(err, max){
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"총학생회"}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"총학생회"}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
        case "경영대학" :
            if(deadlineFlag==1) {
                mongodb.PetitionModel.count({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"경영대학"}]},function(err, max){
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"경영대학"}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"경영대학"}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                mongodb.PetitionModel.count({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"경영대학"}]},function(err, max){
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"경영대학"}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"경영대학"}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
        case "공과대학" :
            if(deadlineFlag==1) {
                mongodb.PetitionModel.count({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"공과대학"}]},function(err, max){
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"공과대학"}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"공과대학"}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                mongodb.PetitionModel.count({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"공과대학"}]},function(err, max){
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"공과대학"}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"공과대학"}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
        case "도시과학대학" :
            if(deadlineFlag==1) {
                mongodb.PetitionModel.count({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"도시과학대학"}]},function(err, max){
                    if(err) {throw err;}
                    
                    var pageNum = Math.ceil(max/limitSize);
                    var num = max-((page - 1)*limitSize); 
                    var startPage = (Math.floor((page-1)/limitPage)*limitPage)+1;
                    var endPage = startPage + limitPage - 1;
                    if(endPage > pageNum) { endPage = pageNum; }
                    console.log("max: " + max +" page: "+page+" pageNum: "+pageNum);
                    
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"도시과학대학"}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"도시과학대학"}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                mongodb.PetitionModel.count({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"도시과학대학"}]},function(err, max){
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"도시과학대학"}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"도시과학대학"}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
        case "예술체육대학" :
            if(deadlineFlag==1) {
                mongodb.PetitionModel.count({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"예술체육대학"}]},function(err, max){
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"예술체육대학"}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"예술체육대학"}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                mongodb.PetitionModel.count({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"예술체육대학"}]},function(err, max){
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"예술체육대학"}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"예술체육대학"}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
        case "인문대학" :
            if(deadlineFlag==1) {
                mongodb.PetitionModel.count({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"인문대학"}]},function(err, max){
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"인문대학"}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"인문대학"}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                mongodb.PetitionModel.count({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"인문대학"}]},function(err, max){
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"인문대학"}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"인문대학"}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
        case "자연과학대학" :
            if(deadlineFlag==1) {
                mongodb.PetitionModel.count({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"자연과학대학"}]},function(err, max){
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"자연과학대학"}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"자연과학대학"}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                mongodb.PetitionModel.count({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"자연과학대학"}]},function(err, max){
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"자연과학대학"}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"자연과학대학"}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
        case "정경대학" :
            if(deadlineFlag==1) {
                mongodb.PetitionModel.count({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"정경대학"}]},function(err, max){
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"정경대학"}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"정경대학"}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                mongodb.PetitionModel.count({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"정경대학"}]},function(err, max){
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"정경대학"}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"정경대학"}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
        case "자유융합대학" :
            if(deadlineFlag==1) {
                mongodb.PetitionModel.count({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"자유융합대학"}]},function(err, max){
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"자유융합대학"}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"자유융합대학"}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                mongodb.PetitionModel.count({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"자유융합대학"}]},function(err, max){
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"자유융합대학"}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"자유융합대학"}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
        case "기타" :
            if(deadlineFlag==1) {
                mongodb.PetitionModel.count({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"기타"}]},function(err, max){
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"기타"}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"기타"}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                mongodb.PetitionModel.count({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"기타"}]},function(err, max){
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"기타"}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{"type":"기타"}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                mongodb.PetitionModel.count({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{$or:[{title:searchCondition},{contents:searchCondition},     {nickname:searchCondition}]}]},function(err, max){
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{$or:[{title:searchCondition},{contents:searchCondition},     {nickname:searchCondition}]}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$gte":(new Date()).setDate(now.getDate()-limitDay)}},{$or:[{title:searchCondition},{contents:searchCondition},     {nickname:searchCondition}]}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                mongodb.PetitionModel.count({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{$or:[{title:searchCondition},{contents:searchCondition},     {nickname:searchCondition}]}]},function(err, max){
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{$or:[{title:searchCondition},{contents:searchCondition},     {nickname:searchCondition}]}]}).sort({'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
                                mongodb.PetitionModel.find({$and:[{'created_at':{"$lt":(new Date()).setDate(now.getDate()-limitDay)}},{$or:[{title:searchCondition},{contents:searchCondition},     {nickname:searchCondition}]}]}).sort({'count':-1,'created_at':-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
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
    if(!req.session.user) {
        res.send('<script type="text/javascript">alert("로그인하셔야 합니다.");window.location.href = "/users/login";</script>');
    }
    else if(!title || !contents) {
         res.send('<script type="text/javascript">alert("제목과 내용을 입력해야합니다.");window.location.href = "/petition/post";</script>');
    } else {
          pool.query("SELECT * FROM users where uid=?", req.session.user.uid , (err, rows) => {
              if (err) {
                  console.log(err);
              } else {
                  if (rows.length > 0) {
                      console.log('요청 파라미터 : ' + title +', '+contents);
    
                      var post = new mongodb.PetitionModel({
                          title : title,
                          type : type,
                          contents : contents,
                          nickname : rows[0].nickname,
                          writer : rows[0].uid
                      }); 
                      post.save(function(err, result) {
                          if(err) {throw err;}
                          console.log('글 데이터 추가함');
                          res.redirect('/petition/list');
                      });
                  } else { return; }
              }
          });
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
    
    mongodb.PetitionModel.findOne({_id: id}, function(err, content){
        if(err) { throw err; }
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
            res.render('content', { title:"content", info: info, content:content, login:req.session.user}); 
           
        } else {
             mongodb.PetitionModel.findOne({_id: id}, {comments: {$slice: [skipSize, limitSize]}}, function(err, commentsContent){
                 if(err) {throw err; }
                 commentsContent.startDay = commentsContent.created_at.toISOString().substr(2,8);
                 var tmp = new Date(); tmp.setDate(commentsContent.created_at.getDate() + limitDay);
                 commentsContent.endDay = tmp.toISOString().substr(2,8);
                 if(now < tmp) commentsContent.dayFlag = 1;
                 else commentsContent.dayFlag = 0;
                 
                 var info = { startPage: startPage, endPage: endPage, limitPage: limitPage, active: page, pagination: pageNum };
                 res.render('content', { title:"content", info: info, content:commentsContent, login:req.session.user}); 
            });
        }
    });
});

router.post('/comment', function(req, res){
    console.log('/petition/comment post 패스 요청됨.');
    var contents = req.body.contents;
    var id = req.body.id;
    var now = new Date();
    
    var limitDay = 10;
    var limitSize = 5;
    var limitPage = 5;
    
    if(!req.session.user) {
        res.send('<script type="text/javascript">alert("로그인하셔야 합니다.");window.location.href = "/users/login";</script>');
    } else {
         mongodb.PetitionModel.findOne({_id: id}, function(err, content){
             if(err) {throw err;}
             
             var max = content.comments.length + 1;
             var pageNum = Math.ceil(max/limitSize);
             var startPage = 1;
             var endPage = limitPage;
             if(endPage > pageNum) { endPage = pageNum; }
             
             content.comments.unshift({writer:req.session.user.uid, contents: contents});
             content.count += 1;
             content.save(function(err){
                 mongodb.PetitionModel.findOne({_id: id}, {comments: {$slice: [0, limitSize]}}, function(err, rawContent){
                     if(err) { throw err; }
                     rawContent.startDay = rawContent.created_at.toISOString().substr(2,8);
                     var tmp = new Date(); tmp.setDate(rawContent.created_at.getDate() + limitDay);
                     rawContent.endDay = tmp.toISOString().substr(2,8);
                     if(now < tmp) rawContent.dayFlag = 1;
                     else rawContent.dayFlag = 0;
                     
                     var info = { startPage: startPage, endPage: endPage, limitPage: limitPage, active: 1, pagination: pageNum  }
                     res.render('content', { title:"content", info: info, content:rawContent, login:req.session.user}); 
                 });
             });
         });
    }
});

router.get('/reply', function(req, res) {
    console.log('/petition/reply get 패스 요청됨.'); 
    reply();
   
    async function reply() {
        
        var fs = require('fs');
        var files = fs.readdirSync("public/petition/uploads"); // 디렉토리를 읽어온다 
        var filenames = [];
        var contents = [];
        var count = 0;
        
        for(var i = 0; i < files.length; i++){
            var id = files[i].split('.')[0];
            var ext = files[i].split('.')[1];
            if (ext === 'mp4'){
                await mongodb.PetitionModel.findOne({_id:id}, function(err, content){
                    if(err) { throw err; }
                        
                    filenames[count] = files[i];
                    contents[count] = content;
                    count = count + 1;
                });
            }
        }
        
        var page = req.param('page');
        if(page == null) {page = 1;}
        var limitDay = 10;
        var limitSize = 5;
        var limitPage = 5;
        var now = new Date();
    
        var skipSize = (page-1)*limitSize;
        var pageNum = Math.ceil(count/limitSize);
        var startPage = (Math.floor((page-1)/limitPage)*limitPage)+1;
        var endPage = startPage + limitPage - 1;
        if(endPage > pageNum) { endPage = pageNum; }
        if(skipSize + limitSize > count) { limitSize = count - skipSize; }

        if((page > pageNum || page < 1) && count != 0) {
            console.log("잘못된 페이지");
            res.send('<script type="text/javascript">alert("잘못된 페이지입니다.");window.location.href = "/petition/reply";</script>');
                
        } else if(count == 0) {
            console.log("reply가 없다"); 
            var info = { startPage: 1, endPage: 1, limitPage: limitPage, active: 1, pagination: 1 };
                        
            res.render('reply', { title:"reply", info: info, contents: [], filenames: [], login:req.session.user});
                
        } else {
            var pageContents = [];
            for(var i=0; i<limitSize; i++){
                pageContents[i] = contents[i+skipSize];
            }
            
            for(var i=0; i<limitSize; i++) {
                pageContents[i].startDay = pageContents[i].created_at.toISOString().substr(2,8);
                var tmp = new Date(); tmp.setDate(pageContents[i].created_at.getDate() + limitDay);
                pageContents[i].endDay = tmp.toISOString().substr(2,8);
            }
            
            var info = { startPage: startPage, endPage: endPage, limitPage: limitPage, active: page,   pagination: pageNum };
            res.render('reply', { title:"reply", info: info, contents:pageContents, filenames: filenames, login:req.session.user});
        }
    }
});


router.get('/reply_post', function(req, res) {
    console.log('/petition/reply_post get 패스 요청됨.');
    
    var contentId = req.param('id');
    res.render('reply_post', { title:"reply_post", id:contentId, login:req.session.user});
});



var multer  = require('multer');
var _storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'public/petition/uploads/');
    },
    filename: function(req, file, callback) {
        callback(null, req.param('id')+'.'+file.mimetype.split('/')[1]);
    }
});
var upload = multer({ storage: _storage});

router.post('/reply_post', upload.single("inputFile"), function(req, res) {
    console.log('/petition/reply_post post 패스 요청됨.');
    
    console.log(req.file);
    res.redirect('/petition/reply');
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