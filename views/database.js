var mongoose = require('mongoose');
var app = require('./app');

var dbURL = 'mongodb://localhost:27017/local';

var mongodb = {};

mongodb.init = function() {
    console.log('mongoDB 연결 시도');
    
    mongoose.Promise = global.Promise;
    mongoose.connect(dbURL);
    mongodb.db = mongoose.connection;
    
    mongodb.db.on('error',console.error.bind(console, 'mongoose connection error.'));
    mongodb.db.on('open', function() {
        console.log('데이터베이스에 연결되었습니다. : ' + dbURL);
        
        createSchema();
    });
    
    mongodb.db.on('disconnected', function() {
        console.log('연결이 끊어졌습니다. 5초 후 다시 연결합니다.');
        setInterval(connectDB, 5000);
    });
};

function createSchema() {
    try{
        var AnswerSchema = require('./petition_ans_schema').createSchema(mongoose);
        var AnswerModel = mongoose.model('answers', AnswerSchema);
        
        mongodb['AnswerSchema'] = AnswerSchema;
        mongodb['AnswerModel'] = AnswerModel;
    }
    catch(exception){
        console.log("mongodb answer init 실패")
    }

    try{
        var PetitionSchema = require('./petition_schema').createSchema(mongoose);    
        var PetitionModel = mongoose.model('users', PetitionSchema); 
        
        mongodb['PetitionSchema'] = PetitionSchema;
        mongodb['PetitionModel'] = PetitionModel;
    
        console.log('mongodb init() 완료');

    }
    catch(exception){
        console.log("mongodb petition init 실패")
    }

}
module.exports = mongodb;