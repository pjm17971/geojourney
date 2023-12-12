import { createActorContext } from '@xstate/react';
import { machine } from './machine';

export const MachineContext = createActorContext(machine);
