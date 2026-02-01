class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something went wrong",
        errors=[],
        statck = ""
    ){
        super(message)
        this.statusCode=statusCode
        this.data = null
        this.message=message
        this.success=false
        this.errors=errors

        if(statck){
            this.stack=statck
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}
export {ApiError}

// When you write:
// throw new ApiError(404, "User not found")
// Internally:
// new ApiError(...) is called
// constructor() runs
// super(message) sets the normal Error behavior
// Custom properties are attached:
// statusCode
// success = false
// errors = []
// Stack trace is captured
// An Error object is created with extra fields
