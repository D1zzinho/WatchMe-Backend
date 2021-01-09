import {HttpException, HttpService, HttpStatus, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import {Model} from 'mongoose';

import {LoginDTO, RegisterDTO, SaveGitHubUserDTO} from '../auth/auth.dto';
import {Payload} from '../types/payload';
import {User} from "./schemas/user.schema";
import {GitHubUser} from "./schemas/gitHubUser.schema";

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(GitHubUser.name) private gitHubUserModel: Model<GitHubUser>,
        private http: HttpService
    ) {}

    async getAll(): Promise<User[]> {
        return this.userModel
            .find()
            .sort({ _id: 1 })
            .select('username email firstname lastname lastLoginDate about permissions');
    }

    
    async create(userDTO: RegisterDTO): Promise<any> {
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


    async createGitHubClient(gitHubUserDto: SaveGitHubUserDTO): Promise<GitHubUser> {
        const { username } = gitHubUserDto;
        const gitHubUser = await this.gitHubUserModel.findOne({ username });

        if (gitHubUser === null) {
            const savedUser = new this.gitHubUserModel(gitHubUserDto);
            await savedUser.save();
            return savedUser;
        }
        else {
            await this.updateUserLoginDate(gitHubUser.username, gitHubUser._id, 'github');
        }

        return null;
    }


    async findByLogin(userDTO: LoginDTO): Promise<any> {
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


    async findById(userId: string): Promise<User> {
        return this.userModel.findById(userId).select('email username firstname lastname permissions avatar about videos comments registerDate lastLoginDate');
    }


    async findByPayload(payload: Payload): Promise<User> {
        const { username, permissions } = payload;

        return this.userModel.findOne({username, permissions});
    }


    async findByUsername(username: string): Promise<boolean> {
        const systemUserCheck = await this.userModel.findOne({ username } );
        const gitHubUserCheck = await this.gitHubUserModel.findOne({ username });

        return (systemUserCheck !== null) || (gitHubUserCheck !== null);
    }


    async findByEmail(email: string): Promise<User> {
        return this.userModel.findOne({ email });
    }


    sanitizeUser(user: User): any {
        const sanitized = user.toObject();
        delete sanitized['password'];
        return sanitized;
    }


    async findGitHubUserByUsername(gitHubUserName: string): Promise<GitHubUser> {
        return this.gitHubUserModel.findOne({ username: gitHubUserName }).select('username name lastLoginDate');
    }


    async getGitHubUserRepos(user: any): Promise<any> {
        try {
            const request = await this.http.get(`https://api.github.com/user/repos`, {
                headers: {
                    Authorization: `token ${user['access_token']}`
                }
            }).toPromise();

            return request.data;
        }
        catch (err) {
            return err.message;
        }
    }


    async getGitHubUserRepoCommits(user: any, repoName: string): Promise<any> {
        try {
            const request = await this.http.get(`https://api.github.com/repos/${user['username']}/${repoName}/commits`, {
                headers: {
                    Authorization: `token ${user['access_token']}`
                }
            }).toPromise();

            const result = request.data;
            const response = new Array<any>();

            result.forEach(res => {
                response.push({
                    author: res.author,
                    date: res.commit.author.date,
                    message: res.commit.message
                });
            });

            const groups = response.reduce((groups, commit) => {
                const date = commit.date.split('T')[0];
                if (!groups[date]) {
                    groups[date] = [];
                }
                groups[date].push(commit);
                return groups;
            }, {});

            return Object.keys(groups).map((date) => {
                return {
                    date,
                    commits: groups[date]
                };
            });
        }
        catch (err) {
            return err.message;
        }
    }

    async getGitHubUserVideos(gitHubUserUsername: string): Promise<any> {
        return this.gitHubUserModel.findOne({ username: gitHubUserUsername }).select('username videos comments');
    }


    async createGitHubRepo(user: any, repositoryData: any): Promise<any> {
        try {
            const request = await this.http.post(`https://api.github.com/user/repos`, repositoryData, {
                headers: {
                    Authorization: `token ${user['access_token']}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }).toPromise();

            return request.data;
        }
        catch (err) {
            return err.message;
        }
    }


    async updateUserLoginDate(username: string, userId: string, userType: string): Promise<any> {
        try {
            if (userType === 'system') {
                await this.userModel.findOneAndUpdate({ username: username, _id: userId }, { $set: { lastLoginDate: new Date(Date.now()) } });
            }
            else if (userType === 'github') {
                await this.gitHubUserModel.findOneAndUpdate({ username: username, _id: userId }, { $set: { lastLoginDate: new Date(Date.now()) } });
            }

            return {
                updated: true,
                message: 'Last login date successfully updated!'
            }
        }
        catch (err) {
            return {
                updated: false,
                message: err.message
            }
        }
    }
}
