var Schema = {};

Schema.createSchema = function(mongoose) {

    var PetitionSchema = mongoose.Schema({
        title: {type:String, trim:true, 'default':''},
        type: {type:String, trim:true, 'default':''},
        contents: {type:String, trim:true, 'default':''},
        nickname: {type:String, 'default':''},
        writer: {type:String, 'default':''},
        count: {type:Number, default: 0},
        created_at: {type:Date, index:{unique:false}, 'default':Date.now},
        updated_at: {type:Date, index:{unique:false}, 'default':Date.now},
        comments: [{
            contents:{type:String, trim:true, 'default':''},
            writer:{type:String, 'default':''},
            created_at:{type:Date, 'default':Date.now},
            is_comment_anonymous: {type:Boolean},
        }],
        answer_flag: {type:Boolean, 'default':false},
        answer:{type:mongoose.Schema.Types.ObjectId,ref:"answers"},
        is_anonymous:{type:Boolean, 'default':true}
    });

    return PetitionSchema;
}

//module.exports에 UserSchema 객체 직접 할당
module.exports = Schema;
