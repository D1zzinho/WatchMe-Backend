import {Body, Controller, Get, Post, Req, Res, UseGuards} from '@nestjs/common';

import {UserService} from '../users/users.service';
import {Payload} from '../types/payload';
import {LoginDTO, RegisterDTO, SaveGitHubUserDTO} from './auth.dto';
import {AuthService} from './auth.service';
import {AuthGuard} from "@nestjs/passport";
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiCreatedResponse,
    ApiUnauthorizedResponse
} from "@nestjs/swagger";
import {Request, Response} from "express";

@Controller('auth')
export class AuthController {

    constructor(
        private userService: UserService,
        private authService: AuthService,
    ) {}


    @Post('login')
    @ApiCreatedResponse({
        schema: {
            properties: {
                user: {
                    type: 'object',
                    properties: {
                        username: { type: 'string' },
                        _id: { type: 'string' },
                        permissions: { type: 'number' }
                    }
                    },
                token: { type: 'string' }
            }
            },
        description: 'User logged in successfully'
    })
    @ApiUnauthorizedResponse({ description: 'User cannot be authorized' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiBody({ type: LoginDTO })
    async login(@Body() userDTO: LoginDTO): Promise<{ user: any, token: string }> {
        const user = await this.userService.findByLogin(userDTO);
        const payload: Payload = {
            username: user.username,
            permissions: user.permissions,
            expiresIn: '12h'
        };
        const token = await this.authService.signPayload(payload);
        return { user, token };
    }


    @Post('register')
    @ApiCreatedResponse({ description: 'User registered successfully' })
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiBody({ type: RegisterDTO, description: 'New user data' })
    async register(@Body() userDTO: RegisterDTO): Promise<{ user: any, token: string }> {
        const user = await this.userService.create(userDTO);
        const newUserData = {
            permissions: user.permissions,
            username: user.username,
            _id: user._id
        };

        const payload: Payload = {
            username: newUserData.username,
            permissions: newUserData.permissions,
            expiresIn: '12h'
        };
        const token = await this.authService.signPayload(payload);
        return { user: newUserData, token };
    }


    @Post('checkToken')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiCreatedResponse({ description: 'User validated with token from header' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    @ApiBody({ schema: { properties: { user: { type: 'string' }, permission: { type: 'number', default: 1, example: 1 }}}, description: 'User username and permissions'})
    async checkTokenByUsernameAndPermissions(@Body('user') username: string, @Body('permission') permission = 1): Promise<boolean> {
        const user: Payload = {
            username: username,
            permissions: permission
        };
        const foundUser = await this.authService.validateUser(user);

        return foundUser !== null;
    }


    @Post('checkCredentials')
    @ApiBadRequestResponse({ description: 'Bad request' })
    @ApiCreatedResponse({ schema: { properties: { usernameExists: { type: 'boolean' }, emailExists: { type: 'boolean' } } }, description: 'Returns object of two booleans if userdata exists in database' })
    @ApiBody({ schema: { properties: { username: { type: 'string' }, email: { type: 'string' }}}, description: 'User username and email'})
    async checkIfUsernameOrEmailExists(@Res() res: Response, @Body('username') username: string, @Body('email') email: string): Promise<Response<any>> {
        try {
            const existStatus = {
                usernameExists: false,
                emailExists: false
            };

            const checkUsername = await this.userService.findByPayload({ username });
            const checkEmail = await this.userService.findByEmail(email);

            if (checkUsername !== null) existStatus.usernameExists = true;
            if (checkEmail !== null) existStatus.emailExists = true;

            return res.json(existStatus);
        }
        catch (err) {
            return res.json({
                message: err.message
            })
        }
    }



    @Get('/github')
    authByGitHub(@Res() res: Response): void {
        const redirect_uri = `http://localhost:3000/auth/github/callback`;

        const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${redirect_uri}`;

        res.redirect(url);
    }


    @Get('/github/callback')
    async authByGitHubCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
        try {
            const code = req.query.code;

            if (!code) {
                res.send({
                    success: false,
                    message: 'Error: no code'
                })
            }

            const token =
                await this.authService.getAccessToken(
                    {
                        code,
                        client_id: process.env.GITHUB_CLIENT_ID,
                        client_secret: process.env.GITHUB_CLIENT_SECRET
                    });


            const user = await this.authService.getGitHubUser(token);

            if (user) {
                const jwtData = {
                    user: user,
                    permissions: 1,
                    token
                };

                const gitHubUser: SaveGitHubUserDTO = {
                    about: user.bio == null ? "" : user.bio,
                    email: user.email == null ? "" : user.email,
                    name: user.name == null ? "" : user.name,
                    url: user.html_url,
                    avatar: user.avatar_url,
                    username: user.login
                };

                await this.userService.createGitHubClient(gitHubUser);

                const signedToken = await this.authService.signGitHubPayload(jwtData);

                res.redirect('http://localhost:4200/?token=' + signedToken);
            } else {
                res.json({success: false, message: "Login did not succeed!"});
            }
        }
        catch (err) {
            res.json({
                success: false,
                message: err.message
            })
        }
    }


    @Post('/github/me')
    async getGitHubUserData(@Body() tokenData: any): Promise<any> {
        return await this.authService.getGitHubUser(tokenData);
    }


    @Get('/logout')
    logOut(@Req() req: Request, @Res() res: Response): void {
        if (req.session) req.session = null;
        req.logout();
        res.redirect('http://localhost:4200/')
    }
}
