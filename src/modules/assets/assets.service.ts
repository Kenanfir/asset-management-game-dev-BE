import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssetsService {
    constructor(private readonly prisma: PrismaService) { }

    async getAssetGroups(projectId?: string) {
        const where = projectId ? { projectId } : {};

        const groups = await this.prisma.assetGroup.findMany({
            where,
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        subAssets: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        return groups.map(group => ({
            id: group.id,
            key: group.key,
            type: group.type,
            project: group.project,
            subAssetCount: group._count.subAssets,
            createdAt: group.createdAt,
        }));
    }

    async getSubAssets(groupId?: string, projectId?: string) {
        const where: any = {};

        if (groupId) {
            where.groupId = groupId;
        } else if (projectId) {
            where.group = { projectId };
        }

        const subAssets = await this.prisma.subAsset.findMany({
            where,
            include: {
                group: {
                    select: {
                        id: true,
                        key: true,
                        type: true,
                        project: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        history: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        return subAssets.map(subAsset => ({
            id: subAsset.id,
            key: subAsset.key,
            type: subAsset.type,
            basePath: subAsset.basePath,
            pathTemplate: subAsset.pathTemplate,
            currentVersion: subAsset.currentVersion,
            rulePackKey: subAsset.rulePackKey,
            group: subAsset.group,
            versionCount: subAsset._count.history,
            createdAt: subAsset.createdAt,
        }));
    }

    async getSubAssetHistory(subAssetId: string) {
        const subAsset = await this.prisma.subAsset.findUnique({
            where: { id: subAssetId },
            include: {
                group: {
                    select: {
                        key: true,
                        project: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!subAsset) {
            throw new NotFoundException(`Sub-asset with ID ${subAssetId} not found`);
        }

        const history = await this.prisma.assetHistory.findMany({
            where: { subAssetId },
            orderBy: { version: 'desc' },
        });

        return {
            subAsset: {
                id: subAsset.id,
                key: subAsset.key,
                group: subAsset.group,
            },
            history: history.map(entry => ({
                id: entry.id,
                version: entry.version,
                changeNote: entry.changeNote,
                filePath: entry.filePath,
                fileSize: entry.fileSize,
                fileHash: entry.fileHash,
                createdAt: entry.createdAt,
            })),
        };
    }
}
