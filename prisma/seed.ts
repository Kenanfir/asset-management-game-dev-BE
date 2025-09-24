import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create a test project
    const project = await prisma.project.upsert({
        where: { id: 'test-project-1' },
        update: {},
        create: {
            id: 'test-project-1',
            name: 'Space Adventure Game',
            repo: 'https://github.com/example/space-adventure',
            status: 'active',
            latestSyncAt: new Date(),
        },
    });

    console.log('✅ Created project:', project.name);

    // Create asset groups
    const spriteGroup = await prisma.assetGroup.upsert({
        where: { projectId_key: { projectId: project.id, key: 'sprites' } },
        update: {},
        create: {
            projectId: project.id,
            key: 'sprites',
            type: 'sprite_static',
        },
    });

    const audioGroup = await prisma.assetGroup.upsert({
        where: { projectId_key: { projectId: project.id, key: 'audio' } },
        update: {},
        create: {
            projectId: project.id,
            key: 'audio',
            type: 'audio_sfx',
        },
    });

    console.log('✅ Created asset groups');

    // Create sub-assets
    const playerSprite = await prisma.subAsset.upsert({
        where: { groupId_key: { groupId: spriteGroup.id, key: 'player' } },
        update: {},
        create: {
            groupId: spriteGroup.id,
            key: 'player',
            type: 'sprite_static',
            basePath: 'assets/sprites',
            pathTemplate: '{base}/{key}/v{version}/{key}.{ext}',
            currentVersion: 2,
            rulePackKey: 'sprite_static',
        },
    });

    const enemySprite = await prisma.subAsset.upsert({
        where: { groupId_key: { groupId: spriteGroup.id, key: 'enemy' } },
        update: {},
        create: {
            groupId: spriteGroup.id,
            key: 'enemy',
            type: 'sprite_static',
            basePath: 'assets/sprites',
            pathTemplate: '{base}/{key}/v{version}/{key}.{ext}',
            currentVersion: 1,
            rulePackKey: 'sprite_static',
        },
    });

    const jumpSound = await prisma.subAsset.upsert({
        where: { groupId_key: { groupId: audioGroup.id, key: 'jump' } },
        update: {},
        create: {
            groupId: audioGroup.id,
            key: 'jump',
            type: 'audio_sfx',
            basePath: 'assets/audio',
            pathTemplate: '{base}/{key}/v{version}/{key}.{ext}',
            currentVersion: 1,
            rulePackKey: 'audio_sfx',
        },
    });

    console.log('✅ Created sub-assets');

    // Create asset history for player sprite
    await prisma.assetHistory.upsert({
        where: { subAssetId_version: { subAssetId: playerSprite.id, version: 1 } },
        update: {},
        create: {
            subAssetId: playerSprite.id,
            version: 1,
            changeNote: 'Initial player sprite design',
            filePath: 'assets/sprites/player/v1/player.png',
            fileSize: 1024,
            fileHash: 'abc123def456',
        },
    });

    await prisma.assetHistory.upsert({
        where: { subAssetId_version: { subAssetId: playerSprite.id, version: 2 } },
        update: {},
        create: {
            subAssetId: playerSprite.id,
            version: 2,
            changeNote: 'Updated player sprite with new animations',
            filePath: 'assets/sprites/player/v2/player.png',
            fileSize: 2048,
            fileHash: 'def456ghi789',
        },
    });

    console.log('✅ Created asset history');

    // Create a test user
    const user = await prisma.user.upsert({
        where: { githubId: 12345 },
        update: {},
        create: {
            githubId: 12345,
            login: 'testuser',
            name: 'Test User',
            avatarUrl: 'https://avatars.githubusercontent.com/u/12345?v=4',
        },
    });

    console.log('✅ Created test user:', user.login);

    // Create a sample upload job
    await prisma.uploadJob.create({
        data: {
            status: 'DONE',
            mode: 'SINGLE',
            createdByUserId: user.id,
            details: {
                targetSubassetIds: [playerSprite.id],
                files: ['player.png'],
                processedAt: new Date(),
            },
            completedAt: new Date(),
        },
    });

    console.log('✅ Created sample upload job');

    console.log('🎉 Database seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
