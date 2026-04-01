import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // ✅ Validate videoId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const result = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $facet: {
        comments: [
          { $sort: { createdAt: -1 } },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  //Currently we are inside User collection
                  $project: {
                    avatar: 1,
                    userName: 1,
                    fullName: 1,
                  },
                },
              ],
            },
          },
          {
            $unwind: "$owner",
          },
          {
            $skip: skip,
          },
          {
            $limit: limitNum,
          },
          {
            $project: {
              content: 1,
              createdAt: 1,
              updatedAt: 1,
              owner: 1,
            },
          },
        ],
        totalCount: [{ $count: "totalComments" }],
      },
    },
  ]);

  // ✅ Extract safely
  const comments = result[0].comments;
  const totalComments = result[0].totalCount[0]?.totalComments || 0;
  const totalPages = Math.ceil(totalComments / limitNum);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comments,
        pagination: {
          totalComments,
          totalPages,
          currentPage: pageNum,
        },
      },
      "comments fetched successfully"
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { content, videoId } = req.body;

  //Video ID Validation
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  //Comment Checking
  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content is required");
  }
  //Authentication Check
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized");
  }

  //Video Checking
  const videoExist = await Video.exists({ _id: videoId }); //DB Call
  if (!videoExist) {
    throw new ApiError(404, "Video not found");
  }

  const newComment = await Comment.create({
    //DB Call
    content: content.trim(),
    video: videoId,
    owner: req.user._id,
  });
  // populate AFTER creation
  await newComment.populate("owner", "username avatar"); //Add these 2 fields in the response of owner when we create a comment
  res
    .status(201)
    .json(new ApiResponse(201, newComment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized");
    }
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required");
    }
    const comment = await Comment.findById(commentId); //DB Call
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Forbidden: You can only update your own comments");
    }
    comment.content = content.trim();
    await comment.save(); //DB Call
    await comment.populate("owner", "username avatar"); //DB Call to populate owner details after update
    res.status(200).json({
        success: true,
        comment,
        message: "Comment updated successfully",
    });
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  // Auth check
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized");
  }

  // Validate ID
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  // DB call
  const deletedComment = await Comment.findOneAndDelete({
    _id: commentId,
    owner: req.user._id,
  });

  // If nothing deleted
  if (!deletedComment) {
    throw new ApiError(
      404,
      "Comment not found or you are not allowed to delete it"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
