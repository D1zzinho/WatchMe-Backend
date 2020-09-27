import {Body, Controller, Post, UseGuards} from '@nestjs/common';

import { UserService } from '../users/users.service';
import { Payload } from '../types/payload';
import { LoginDTO, RegisterDTO } from './auth.dto';
import { AuthService } from './auth.service';
import {AuthGuard} from "@nestjs/passport";
import {
    ApiBadRequestResponse, ApiBearerAuth,
    ApiBody,
    ApiCreatedResponse,
    ApiUnauthorizedResponse
} from "@nestjs/swagger";

@Controller('auth')
export class AuthController {
    constructor(
        private userService: UserService,
        private authService: AuthService,
    ) {}

    @Post('login')
    @ApiCreatedResponse({ description: 'User logged in successfully' })
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
    @ApiCreatedResponse({ description: 'User validated'})
    @ApiUnauthorizedResponse({ description: 'Unauthorized access' })
    async checkToken(@Body('user') token: string, @Body('permiss') permiss: number = 1) {
        const user: Payload = {
            username: token,
            permissions: permiss
        };
        const foundUser = await this.authService.validateUser(user);

        return foundUser !== null;
    }
}
