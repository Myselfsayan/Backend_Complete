import mongoose , {Schema , model} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema (
    {
        videoFile : {
            type : String, //cloudinary url
            required : true
        },
        thumbnail : {
            type : String, //cloudinary url
            required : true
        },
        title : {
            type : String,
            required : true
        },
        description : {
            type : String, 
            required : true
        },
        duration : {
            type : String, //cloudinary url
            required : true
        },
        views : {
            typr : Number,
            default : 0
        },
        isPublished : {
            typr : Boolean,
            default : true
        },
        owner : {
            typr : Schema.Types.ObjectId,
            ref : "User"
        },
    },
    {
        timestamps : true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const video = model("Viedo",videoSchema)