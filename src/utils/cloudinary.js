import { v2 as cloudinary } from 'cloudinary'
import fs from "fs"

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFillePath)=>{
  try {
    if(!localFillePath) return null;
    //Upload file on Cloudinary
    const response = await cloudinary.uploader.upload(localFillePath,{
      resource_type : "auto"
    })
    //File uploaded successfully
    console.log("File is uploaded successfully on Cloudinary",response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFillePath); //Removed the locally saved temporary file as the upload operation got failed
    return null;
  }
}

cloudinary.uploader
  .upload("my_image.jpg")
  .then(result=>console.log(result));

  export {uploadOnCloudinary}