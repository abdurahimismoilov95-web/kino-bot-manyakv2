import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

export interface JwtPayload {
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['HS256'],
      secretOrKey: config.get<string>('jwt.secret') as string,
    });
  }

  /** Rol tokendan emas, har safar bazadan olinadi: admin olib tashlansa darhol kuchga kiradi */
  async validate(payload: JwtPayload) {
    if (!payload || !payload.sub) throw new UnauthorizedException('Invalid token');
    const user = await this.authService.validateUserById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');
    if (user.isBanned) throw new UnauthorizedException('Account is banned');
    return user;
  }
}
