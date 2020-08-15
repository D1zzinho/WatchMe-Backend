import {Body, Controller, Post, UseGuards} from '@nestjs/common';

import { UserService } from '../users/users.service';
import { Payload } from '../types/payload';
import { LoginDTO, RegisterDTO } from './auth.dto';
import { AuthService } from './auth.service';
import {AuthGuard} from "@nestjs/passport";

@Controller('auth')
export class AuthController {
    constructor(
        private userService: UserService,
        private authService: AuthService,
    ) {}

    @Post('login')
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
    async register(@Body() userDTO: RegisterDTO) {
        const user = await this.userService.create(userDTO);
        const payload: Payload = {
            username: user.username,
            permissions: user.permissions,
            expiresIn: '12h'
        };
        const token = await this.authService.signPayload(payload);
        return { user, token };
    }

    @Post('checkToken')
    @UseGuards(AuthGuard('jwt'))
    async checkToken(@Body('user') token: string, @Body('permiss') permiss: number) {
        const user: Payload = {
            username: token,
            permissions: permiss
        };
        const foundUser = await this.authService.validateUser(user);

        if (foundUser !== null) {
            return true;
        }
        else {
            return false;
        }
    }
}
