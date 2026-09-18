import { SetMetadata } from '@nestjs/common';

import type { PlatformCapability } from './platform-capabilities.js';

export const PLATFORM_CAPABILITY_METADATA_KEY = 'familietools.platform-capability';

export const RequirePlatformCapability = (
  capability: PlatformCapability,
): MethodDecorator & ClassDecorator => SetMetadata(PLATFORM_CAPABILITY_METADATA_KEY, capability);
