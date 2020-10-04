import {Body, Controller, Post, Res, UseGuards} from '@nestjs/common';

import { UserService } from '../users/users.service';
import { Payload } from '../types/payload';
import { LoginDTO, RegisterDTO } from './auth.dto';
import { AuthService } from './auth.service';
import {AuthGuard} from "@nestjs/passport";
import {
    ApiBadRequestResponse, ApiBearerAuth,
    ApiBody,
    ApiCreatedResponse, ApiHeader,
    ApiUnauthorizedResponse
} from "@nestjs/swagger";

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
    async login(@Body() userDTO: LoginDTO) {
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
    async register(@Body() userDTO: RegisterDTO) {
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
    async checkTokenByUsernameAndPermissions(@Body('user') username: string, @Body('permission') permission: number = 1) {
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
    async checkIfUsernameOrEmailExists(@Res() res: any, @Body('username') username: string, @Body('email') email: string): Promise<JSON> {
        try {
            const existStatus = {
                usernameExists: false,
                emailExists: false
            };

            const checkUsername = await this.userService.findByPayload({ username });
            const checkEmail = await this.userService.findByEmail(email);

            if (checkUsername !== null) existStatus.usernameExists = true;
            if (checkEmail !== null) existStatus.emailExists = true;

            return await res.json(existStatus);
        }
        catch (err) {
            return await res.json({
                message: err.message
            })
        }
    }
}
