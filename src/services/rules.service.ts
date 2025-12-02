import { Injectable } from '@nestjs/common';
import { RulePackDto } from '../validations/rules/rule-pack.dto';

@Injectable()
export class RulesService {
    private readonly rulePacks: RulePackDto[] = [
        {
            key: 'sprite_static',
            displayName: 'Static Sprites',
            rulesSummary: 'PNG/JPG images, max 1024x1024px, power-of-2 dimensions preferred',
        },
        {
            key: 'sprite_animation',
            displayName: 'Animated Sprites',
            rulesSummary: 'PNG spritesheets, max 2048x2048px, consistent frame sizes',
        },
        {
            key: 'model_3d',
            displayName: '3D Models',
            rulesSummary: 'FBX/GLTF models, optimized for real-time rendering',
        },
        {
            key: 'audio_music',
            displayName: 'Background Music',
            rulesSummary: 'MP3/OGG audio, 44.1kHz, stereo, max 5MB per track',
        },
        {
            key: 'audio_sfx',
            displayName: 'Sound Effects',
            rulesSummary: 'WAV/OGG audio, 44.1kHz, mono/stereo, max 1MB per file',
        },
    ];

    getRulePacks(): RulePackDto[] {
        return this.rulePacks;
    }

    getRulePack(key: string): RulePackDto | undefined {
        return this.rulePacks.find(pack => pack.key === key);
    }
}
