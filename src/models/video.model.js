import mongoose , {Schema , model} from "mongoose";

const videoSchema = new Schema (
    {
        
    },
    {
        timestamps : true
    }
)

export const video = model("Viedo",videoSchema)