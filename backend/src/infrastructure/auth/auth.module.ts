import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from '../database/entities/user.orm-entity';
import { UserProfileSettingsOrmEntity } from '../database/entities/user-profile-settings.orm-entity';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { UserRepositoryImpl } from '../repositories/user.repository';
import { UserProfileSettingsRepositoryImpl } from '../repositories/user-profile-settings.repository';
import { UserProfileApplicationService } from '../../application/services/user-profile.application.service';
import { USER_REPOSITORY, USER_PROFILE_SETTINGS_REPOSITORY } from '../../domain/repositories/tokens';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([UserOrmEntity, UserProfileSettingsOrmEntity]),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    UserProfileApplicationService,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepositoryImpl,
    },
    {
      provide: USER_PROFILE_SETTINGS_REPOSITORY,
      useClass: UserProfileSettingsRepositoryImpl,
    },
  ],
  exports: [AuthService, JwtModule, UserProfileApplicationService],
})
export class AuthModule {}