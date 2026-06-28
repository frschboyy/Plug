import { setupServer } from 'msw/node';
import { handlers } from './supabase';

export const server = setupServer(...handlers);
