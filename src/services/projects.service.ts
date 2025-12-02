import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ProjectDto } from '../validations/projects/project.dto';
import { ProjectWithStatsDto } from '../validations/projects/project-with-stats.dto';

@Injectable()
export class ProjectsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(): Promise<ProjectDto[]> {
        const projects = await this.prisma.project.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return projects.map(project => ({
            id: project.id,
            name: project.name,
            repo: project.repo,
            status: project.status,
            latestSyncAt: project.latestSyncAt,
        }));
    }

    async findOne(id: string): Promise<ProjectWithStatsDto> {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: {
                assetGroups: {
                    include: {
                        subAssets: true,
                    },
                },
            },
        });

        if (!project) {
            throw new NotFoundException(`Project with ID ${id} not found`);
        }

        const stats = {
            totalAssetGroups: project.assetGroups.length,
            totalSubAssets: project.assetGroups.reduce((sum, group) => sum + group.subAssets.length, 0),
            totalVersions: project.assetGroups.reduce((sum, group) =>
                sum + group.subAssets.reduce((subSum, subAsset) => subSum + subAsset.currentVersion, 0), 0
            ),
        };

        return {
            id: project.id,
            name: project.name,
            repo: project.repo,
            status: project.status,
            latestSyncAt: project.latestSyncAt,
            stats,
        };
    }

    async getAssets(id: string, cursor?: string, limit: number = 20) {
        const project = await this.prisma.project.findUnique({
            where: { id },
        });

        if (!project) {
            throw new NotFoundException(`Project with ID ${id} not found`);
        }

        const whereClause: any = { projectId: id };
        if (cursor) {
            whereClause.id = { gt: cursor };
        }

        const assetGroups = await this.prisma.assetGroup.findMany({
            where: whereClause,
            include: {
                subAssets: {
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'asc' },
            take: limit + 1,
        });

        const hasNextPage = assetGroups.length > limit;
        const nextCursor = hasNextPage ? assetGroups[limit - 1].id : null;
        const groups = hasNextPage ? assetGroups.slice(0, -1) : assetGroups;

        return {
            groups: groups.map(group => ({
                id: group.id,
                key: group.key,
                type: group.type,
                subAssets: group.subAssets.map(subAsset => ({
                    id: subAsset.id,
                    key: subAsset.key,
                    type: subAsset.type,
                    basePath: subAsset.basePath,
                    pathTemplate: subAsset.pathTemplate,
                    currentVersion: subAsset.currentVersion,
                    rulePackKey: subAsset.rulePackKey,
                })),
            })),
            pagination: {
                hasNextPage,
                nextCursor,
            },
        };
    }
}
