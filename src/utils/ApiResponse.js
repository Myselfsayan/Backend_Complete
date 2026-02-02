class ApiResponse{
    constructor(statusCode,data,message="Success"){
        this.data=data
        this.statusCode=statusCode
        this.message=message
        this.success=statusCode < 400
    }
}


/* 
Both classes are blueprints, not responses by themselves.

Class	Purpose
ApiResponse	Blueprint for success response objects
ApiError	Blueprint for error objects

*/