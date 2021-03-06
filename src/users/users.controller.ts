import {Body, Controller, Get, HttpService, Param, Post, Query, Req, Res, UseGuards} from "@nestjs/common";
import {UserService} from "./users.service";
import {AuthGuard} from "@nestjs/passport";
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiOkResponse,
    ApiUnauthorizedResponse
} from "@nestjs/swagger";
import {User} from "./schemas/user.schema";
import {Request} from "express";

@Controller('users')
export class UsersController {

    constructor(private readonly userService: UserService) {}

    @Get()
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiOkResponse({ type: [User], description: 'Returns all users' })
    async getAllUsers(@Res() res: any): Promise<JSON> {
        try {
            const users = await this.userService.getAll();

            return await res.json({
                users
            })
        }
        catch (err) {
            return await res.json({
                message: err.message
            })
        }
    }


    @Get('/me')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async getUser(@Req() req: Request): Promise<User> {
        try {
            const user = req.user;
            return await this.userService.findById(user['_id']);
        }
        catch (err) {
            return err.message;
        }
    }


    @Get('/github/repos')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async getGutHubUserRepos(@Req() req: Request): Promise<any> {
        return await this.userService.getGitHubUserRepos(req.user);
    }


    @Post('/github/languages')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async getGitHubUserRepoLanguages(
        @Req() req: Request,
        @Body('name') name: string,
        @Body('owner') username: string
    ): Promise<any> {
        const user = req.user;

        return await this.userService.getGitHubUserRepoLanguages(user, username, name);
    }


    @Post('/github/commits')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async getGitHubUserRepoCommits(
        @Req() req: Request,
        @Body('name') name: string,
        @Body('owner') username: string
    ): Promise<any> {
        const user = req.user;

        return await this.userService.getGitHubUserRepoCommits(user, username, name);
    }


    @Get('/github/videos')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async getGitHubUserVideosAndComments(@Req() req: Request): Promise<any> {
        const username = req.user['username'];

        return await this.userService.getGitHubUserVideos(username);
    }


    @Post('/github/repos')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async createGitHubUserRepo(@Req() req: Request, @Body() repositoryData: any): Promise<any> {
        const user = req.user;

        return await this.userService.createGitHubRepo(user, repositoryData);
    }
}
