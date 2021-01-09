import {Body, Controller, Get, Param, Post, Req, Res, UseGuards} from '@nestjs/common';
import {CommentsService} from "./comments.service";
import {Comment} from "./schemas/comment.schema";
import {AuthGuard} from "@nestjs/passport";
import {ApiBadRequestResponse, ApiBearerAuth, ApiOkResponse, ApiUnauthorizedResponse} from "@nestjs/swagger";
import {Request, Response} from "express";
import {Types} from "mongoose";

@Controller('comments')
export class CommentsController {

    constructor(private readonly commentsService: CommentsService) {}

    @Get()
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({ type: [Comment], description: 'All comments' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    async getAllComments(@Res() res: Response): Promise<Response<Comment[]>> {
        try {
            const comments = await this.commentsService.findAll();
            return res.json({ comments });
        } catch (err) {
            return res.json({
                message: err.message
            });
        }
    }


    @Get(':videoId')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({ type: [Comment], description: 'All comments under specific video' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    async getAllVideoComments(@Req() req: Request, @Res() res: Response, @Param('videoId') videoId: string): Promise<Response<Comment[]>> {
        try {
            let comments;
            const user = req.user;

            if (user['type']) {
                comments = await this.commentsService.findCommentsToVideo(videoId)
            }
            else {
                comments = await this.commentsService.findCommentsToVideo(videoId);
            }

            return res.json({ comments });
        } catch (err) {
            return res.json({
                message: err.message
            });
        }
    }


    @Post(':videoId')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({ type: Comment, description: 'New comment' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    async addComment(@Req() req: Request, @Res() res: Response, @Param('videoId') videoId: string, @Body('text') text: string): Promise<Response<any>> {
        try {
            const comment: any = {
                date: Date.now(),
                text: text,
                video: Types.ObjectId(videoId)
            };


            const user = req.user;
            let uid;
            let type;

            if (user['type']) {
                uid = user['username'];
                type = user['type'];
            }
            else {
                uid = user['_id'];
                type = null;
            }

            const commentsToCurrentVideo = await this.commentsService.findCommentsToVideo(videoId);
            const currentUserComments = commentsToCurrentVideo.filter((comm: any) => comm.author == user['username']);
            if (currentUserComments.length >= 3) {
                return res.json({
                    added: false,
                    message: 'You have already commented this video 3 times!',
                    comment: null
                });
            }
            else {
                await this.commentsService.addComment(uid, comment, type);

                comment.author = req.user['username'];
                comment.authorAvatar = req.user['avatar'];

                return res.json({
                    added: true,
                    message: 'Successfully commented!',
                    comment: comment
                });
            }
        }
        catch (err) {
            return res.json({
                added: false,
                message: err.message,
                comment: null
            });
        }
    }

}
