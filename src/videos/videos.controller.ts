import {
    Body,
    Controller,
    Get,
    Param,
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


@Controller('videos')
export class VideosController {

    constructor(private readonly videosService: VideosService) {}

    @Get()
    @UseGuards(AuthGuard('jwt'))
    async getAllVideos(@Res() res, @Query('page') pageParam): Promise<JSON> {
        try {
            const videos = await this.videosService.findAll();

            const page = parseInt(pageParam) || 1;

            const pageSize = 12;
            const pages = paginate(videos.length, page, pageSize);

            const videosOnPage = videos.slice(pages.startIndex, pages.endIndex + 1);

            return res.json({ pages, videosOnPage });
        }
        catch (err) {
            return res.json({
                message: err.message
            });
        }
    }


    @Get('/search')
    async searchVideos(@Res() res, @Query('query') query, @Query('page') pageParam): Promise<JSON> {
        try {
            const videos = await this.videosService.searchVideosByQuery(query);

            const page = parseInt(pageParam) || 1;

            const pageSize = 12;
            const pages = paginate(videos.length, page, pageSize);

            const videosOnPage = videos.slice(pages.startIndex, pages.endIndex + 1);

            return res.json({
                pages,
                videosOnPage,
                message: `Found ${videos.length} videos`
            });
        }
        catch (err) {
            return res.json({
                message: err.message
            });
        }
    }


    @Post('/similar')
    async getSimilarVideos(@Body('tags') tags: Array<string>, @Res() res): Promise<JSON> {
        try {
            const videos = await this.videosService.findSimilarVideos(tags);
            return res.json(videos);
        }
        catch (err) {
            return res.json({
                message: err.message
            });
        }
    }


    @Post('/upload')
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
            const saveVideoInDatabase = await this.videosService.addVideo(JSON.parse(newVideo)).then(res => data = res);

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


    @Get(':id')
    async getVideo(@Res() res, @Param('id') id): Promise<JSON> {
        try {
            const video = await this.videosService.findVideo(id);
            return res.json(video);
        }
        catch (err) {
            return res.json({
                message: err.message
            });
        }
    }

}
