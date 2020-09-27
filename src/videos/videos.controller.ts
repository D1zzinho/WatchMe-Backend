import {
    Body,
    Controller, Delete,
    Get,
    Param, Patch,
    Post,
    Query,
    Res,
    UploadedFile, UseGuards,
    UseInterceptors
} from '@nestjs/common';
import {VideosService} from "./videos.service";
import paginate from "jw-paginate";
import {diskStorage} from 'multer';
import {FileInterceptor} from "@nestjs/platform-express";
import {editFileName, generateThumbAndPreview, videoFileFilter} from './utils/upload.utils';
import {AuthGuard} from "@nestjs/passport";
import {Video} from "./schemas/video.schema";
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiParam,
    ApiUnauthorizedResponse
} from "@nestjs/swagger";
import * as fs from "fs";


@Controller('videos')
export class VideosController {

    constructor(private readonly videosService: VideosService) {}

    @Get()
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async getAllVideos(@Res() res, @Query('page') pageParam): Promise<JSON> {
        try {
            const videos = await this.videosService.findAll();

            const page = parseInt(pageParam) || 1;

            const pageSize = 12;
            const pages = paginate(videos.length, page, pageSize);

            const videosOnPage = videos.slice(pages.startIndex, pages.endIndex + 1);

            return await res.json({ pages, videosOnPage });
        }
        catch (err) {
            return await res.json({
                message: err.message
            });
        }
    }


    @Get('/search')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async searchVideos(@Res() res, @Query('query') query, @Query('page') pageParam): Promise<JSON> {
        try {
            let videos: Array<Video> = new Array<Video>();
            let pages: any = null;
            let videosOnPage: Array<Video> = null;
            let message: string = null;
            let found: boolean = false;

            if (query !== '') {
                videos = await this.videosService.searchVideosByQuery(query);

                const page = parseInt(pageParam) || 1;
                const pageSize = 12;

                pages = paginate(videos.length, page, pageSize);
                videosOnPage = videos.slice(pages.startIndex, pages.endIndex + 1);

                message = `Found ${videos.length} videos`;
                found = true;
            }
            else {
                message = `Query cannot be null!`;
            }

            return await res.json({
                isResult: found,
                pages,
                videosOnPage,
                message: message
            });
        }
        catch (err) {
            return await res.json({
                message: err.message
            });
        }
    }


    @Post('/similar')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async getSimilarVideos(@Body('tags') tags: Array<string>, @Body('id') id: string, @Res() res): Promise<JSON> {
        try {
            const foundVideos = await this.videosService.findSimilarVideos(tags);

            const videos = this.videosService.removeAllWithWantedName(foundVideos, id);

            return await res.json(videos);
        }
        catch (err) {
            return await res.json({
                message: err.message
            });
        }
    }


    @Post('/upload')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './public/uploads',
            filename: editFileName
        }),
        fileFilter: videoFileFilter
    }))
    async addVideo(@UploadedFile() file, @Body('video') newVideo: string, @Res() res): Promise<JSON> {
        if (file !== undefined) {
            let data = null;

            const newVideoData = JSON.parse(newVideo);
            const tags = newVideoData.tags.split(',');
            const tagsTrimmed = new Array<string>();
            tags.forEach(tag => {
                tagsTrimmed.push(tag.trim());
            });
            newVideoData.tags = tagsTrimmed;

            const id = '5f6a4483ffef4327d4f0d6b6';
            const saveVideoInDatabase = await this.videosService.addVideo(newVideoData, id).then(res => data = res);

            if (data.added === true) { generateThumbAndPreview(file.filename); }

            return res.json({
                file: file,
                saved: saveVideoInDatabase,
                uploaded: true
            });
        }
        return res.json({
            file: file,
            uploaded: false
        })
    }


    @Patch('views')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async updateVideoViews(@Res() res, @Body('id') id): Promise<JSON> {
        try {
            const updateViews = await this.videosService.updateViews(id);

            return await res.json({
                updateViews
            })
        }
        catch (err) {
            return await res.json({
                message: err.message
            })
        }
    }


    @Get(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({ type: Video })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    async getVideo(@Res() res, @Param('id') id: string): Promise<JSON> {
        try {
            const video = await this.videosService.findVideo(id);
            return await res.json(video[0]);
        }
        catch (err) {
            return await res.json({
                err: err.message
            });
        }
    }


    @Patch(':id/title')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({ description: 'Video title successfully changed' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiParam({ name: 'id', schema: { type: 'string' }, description: 'ObjectId of video user wants to edit' })
    @ApiBody({ schema: { type: 'object', example: { title: 'string' } }, description: 'New video title is passed in request body' })
    async updateTitle(@Res() res, @Param('id') id: string, @Body('title') title: string): Promise<JSON> {
        const updateTitle = await this.videosService.updateTitle(id, title);

        return await res.json(updateTitle);
    }


    @Patch(':id/desc')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({ description: 'Video description successfully changed' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiParam({ name: 'id', schema: { type: 'string' }, description: 'ObjectId of video user wants to edit' })
    @ApiBody({ schema: { type: 'object', example: { desc: 'string' } }, description: 'New video description is passed in request body' })
    async updateDescription(@Res() res, @Param('id') id: string, @Body('desc') desc: string): Promise<JSON> {
        const updateDescription = await this.videosService.updateDesc(id, desc);

        return await res.json(updateDescription);
    }


    @Patch(':id/tags')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({ description: 'Video tags successfully changed' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiParam({ name: 'id', schema: { type: 'string' }, description: 'ObjectId of video user wants to edit' })
    @ApiBody({ schema: { type: 'object', example: { tags: 'string' } }, description: 'New video tags are passed in request body' })
    async updateTags(@Res() res, @Param('id') id: string, @Body('tags') tags: string): Promise<JSON> {
        const tagsArray = tags.split(',');
        const tagsArrayTrimmed = new Array<string>();
        tagsArray.forEach(tag => {
            tagsArrayTrimmed.push(tag.trim());
        })

        const updateTags = await this.videosService.updateTags(id, tagsArrayTrimmed);

        return await res.json(updateTags);
    }


    @Patch(':id/stat')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOkResponse({ description: 'Video publication status successfully changed' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiParam({ name: 'id', schema: { type: 'string' }, description: 'ObjectId of video user wants to edit' })
    async updateStatus(@Res() res, @Param('id') id: string, @Body('id') sameId: string): Promise<JSON> {
        if (sameId === id) {
            const changeStatus = await this.videosService.updateStat(id);

            return await res.json(changeStatus);
        }
        else {
            return await res.json({
                updated: false,
                message: 'Id error.'
            })
        }
    }


    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async deleteVideo(@Res() res, @Param('id') id): Promise<JSON> {
        try {
            const videoData = await this.videosService.findVideo(id);
            const video = videoData[0];

            if (video !== null) {
                const path = './public/';

                fs.unlinkSync(path + video.thumb);
                fs.unlinkSync(path + video.cover);
                fs.unlinkSync(path + video.path);

                const deleteVideo = await this.videosService.deleteVideo(id);
                
                return await res.json({
                    deleteVideo
                })
            }
            else {
                return await res.json({
                    message: 'Video does not exist!'
                })
            }
        }
        catch (err) {
            return await res.json({
                message: err.message
            })
        }
    }

}
