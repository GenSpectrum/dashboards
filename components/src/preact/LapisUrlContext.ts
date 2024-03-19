import { createContext } from 'preact';
import register from 'preact-custom-element';

export const LapisUrlContext = createContext('');

register(LapisUrlContext.Provider, 'gs-lapis-context', ['value'], { shadow: false });
