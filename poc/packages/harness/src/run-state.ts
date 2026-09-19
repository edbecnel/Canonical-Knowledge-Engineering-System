export type RunLifecycleState =
  | 'queued'
  | 'preparing'
  | 'running'
  | 'cancel_requested'
  | 'provider_request_inflight'
  | 'cost_ceiling_reached'
  | 'completed'
  | 'completed_partial'
  | 'cancelled'
  | 'failed_infrastructure'
  | 'failed_validation';

export const TERMINAL_RUN_STATES: RunLifecycleState[] = [
  'completed',
  'completed_partial',
  'cancelled',
  'failed_infrastructure',
  'failed_validation',
];

export function isTerminalState(state: RunLifecycleState): boolean {
  return TERMINAL_RUN_STATES.includes(state);
}
