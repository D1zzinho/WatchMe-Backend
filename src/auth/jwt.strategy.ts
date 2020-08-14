import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {AuthService} from "./auth.service";
import {ExtractJwt, Strategy, VerifiedCallback} from "passport-jwt";
import {PassportStrategy} from "@nestjs/passport";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: 'secretKey',
        });
    }

    async validate(payload: any, done: VerifiedCallback) {
        const user = await this.authService.validateUser(payload);
        if (!user) {
            return done(
                new HttpException('Unauthorized access', HttpStatus.UNAUTHORIZED),
                false,
            );
        }

        return done(null, user, payload.iat);
    }
}
