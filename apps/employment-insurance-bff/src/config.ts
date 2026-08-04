import { InMemorySessionCache, RedisSessionCache, SessionCache } from '@tn4consulting/shared-session-cache';

/**
 * No REDIS_URL set (e.g. plain `nx serve`) falls back to an in-process
 * cache -- zero extra local setup, matching every other BFF env var's
 * dev-default pattern.
 */
export const sessionCache: SessionCache = process.env['REDIS_URL']
  ? new RedisSessionCache({ url: process.env['REDIS_URL'], keyPrefix: 'employment-insurance' })
  : new InMemorySessionCache('employment-insurance');
