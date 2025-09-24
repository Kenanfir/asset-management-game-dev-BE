import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('AppController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication<NestFastifyApplication>(
            new FastifyAdapter(),
        );

        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/api/v1/health (GET)', () => {
        return request(app.getHttpServer())
            .get('/api/v1/health')
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('ok', true);
                expect(res.body).toHaveProperty('version');
                expect(res.body).toHaveProperty('timestamp');
            });
    });

    it('/api/v1/projects (GET)', () => {
        return request(app.getHttpServer())
            .get('/api/v1/projects')
            .expect(200)
            .expect((res) => {
                expect(Array.isArray(res.body)).toBe(true);
                if (res.body.length > 0) {
                    expect(res.body[0]).toHaveProperty('id');
                    expect(res.body[0]).toHaveProperty('name');
                    expect(res.body[0]).toHaveProperty('repo');
                    expect(res.body[0]).toHaveProperty('status');
                }
            });
    });

    it('/api/v1/path/resolve (POST)', () => {
        return request(app.getHttpServer())
            .post('/api/v1/path/resolve')
            .send({
                base: 'assets/sprites',
                key: 'player',
                version: 1,
                ext: 'png',
                pathTemplate: '{base}/{key}/v{version}/{key}.{ext}',
            })
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('resolvedPath');
                expect(res.body.resolvedPath).toBe('assets/sprites/player/v1/player.png');
            });
    });

    it('/api/v1/rule-packs (GET)', () => {
        return request(app.getHttpServer())
            .get('/api/v1/rule-packs')
            .expect(200)
            .expect((res) => {
                expect(Array.isArray(res.body)).toBe(true);
                if (res.body.length > 0) {
                    expect(res.body[0]).toHaveProperty('key');
                    expect(res.body[0]).toHaveProperty('displayName');
                    expect(res.body[0]).toHaveProperty('rulesSummary');
                }
            });
    });
});
