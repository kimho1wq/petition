var Schema = {};

Schema.createSchema = function(mongoose) {
    
    var AnswerSchema = mongoose.Schema({
        contents: {type:String, trim:true, 'default':''},
        video: {type:String, trim:true, 'default':''},
        writer: {type:String, 'default':''},
        created_at: {type:Date, index:{unique:false}, 'default':Date.now},
        updated_at: {type:Date, index:{unique:false}, 'default':Date.now}
    });
    
    return AnswerSchema;
}

//module.exports에 UserSchema 객체 직접 할당
module.exports = Schema;
    
