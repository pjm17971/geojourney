import { createActorContext } from '@xstate/react';
import { machine } from '../machines/machine';

export const MachineContext = createActorContext(machine);
