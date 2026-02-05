const asyncHandler = (reqHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(reqHandler(req,res,next)).catch((err)=>next(err))
    }
}  

export {asyncHandler}


// const asyncHandler = (fn)=>{()=>{}} in next line we just remove the Curly Braces , Here it is called Higher Order Js function


//===================THIS IS TRY-CATCH EXAMPLE===========================
// const asyncHandler = (fn)=> async(req , res , next)=>{
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success:false,
//             message:error.message
//         })
//     }
// }