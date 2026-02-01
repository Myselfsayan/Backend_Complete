import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"

//process is a GLOBAL object provided by Node.js itself.

const connectDB = async() =>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        /*If we don't give DB_NAME then MongoDB will:
        Connect to server ✅
        Use default database called: test
        Your data may silently go into test DB
        */
        console.log(`\n MongoDB Connected !! DB HOST : ${connectionInstance.connection.host}`)
    } catch (error) {
        console.error("MongoDB connection error",error)
        process.exit(1)
    }
}

export default connectDB
/*
Mongoose internally creates a Connection object and returns it.
    connectionInstance = {
    connection: {
    host: "127.0.0.1",
    port: 27017,
    name: "backendDB",
    readyState: 1,
    ...
}
}

*/
