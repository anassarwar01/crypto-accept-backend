import { SetMetadata } from '@nestjs/common';

export const FLOW_KEY = 'flow';
export const Flow = (flow: 's2s' | 'checkout') => SetMetadata(FLOW_KEY, flow);
