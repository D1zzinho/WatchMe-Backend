import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';

import { LoginDTO, RegisterDTO } from '../auth/auth.dto';
import { Payload } from '../types/payload';
import { User } from "./schemas/user.schema";

@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private userModel: Model<User>) {}

    async getAll(): Promise<User[]> {
        return this.userModel
            .find()
            .sort({ _id: 1 })
            .select('username email firstname lastname lastLoginDate about permissions');
    }
    
    async create(userDTO: RegisterDTO) {
        const { username, password, email } = userDTO;
        const user = await this.userModel.findOne({ username });
        const userByEmail = await this.userModel.findOne({ email });
        if (user !== null && userByEmail === null) {
            throw new HttpException('Username already exists!', HttpStatus.BAD_REQUEST);
        }
        else if (user === null && userByEmail !== null) {
            throw new HttpException('E-mail already exists!', HttpStatus.BAD_REQUEST);
        }
        else if (user !== null && userByEmail !== null) {
            throw new HttpException('Both username and e-mail are in use!', HttpStatus.BAD_REQUEST);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const createdUser = new this.userModel({ username: username, password: hashedPassword, email: email });
        await createdUser.save();
        return this.sanitizeUser(createdUser);
    }


    async findByLogin(userDTO: LoginDTO) {
        const { username, password } = userDTO;

        const user = await this.userModel
            .findOne({ username })
            .select('username password firstname lastname permissions');

        if (!user) {
            throw new HttpException('User not found!', HttpStatus.UNAUTHORIZED);
        }

        if (await bcrypt.compare(password, user.password)) {
            return this.sanitizeUser(user);
        } else {
            throw new HttpException('Wrong password!', HttpStatus.UNAUTHORIZED);
        }
    }


    async findByPayload(payload: Payload) {
        const { username } = payload;

        return this.userModel.findOne({username});
    }


    async findByEmail(email: string) {
        return this.userModel.findOne({ email });
    }


    sanitizeUser(user: User) {
        const sanitized = user.toObject();
        delete sanitized['password'];
        return sanitized;
    }
}
