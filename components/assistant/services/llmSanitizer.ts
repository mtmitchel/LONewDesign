/**
 * LLM Response Sanitization and Structured Output Parsing
 * Ensures clean, safe, and properly formatted responses from LLMs
 */

import { z } from 'zod';

/**
 * Common text sanitization for LLM responses
 * Removes control characters, normalizes whitespace, trims edges
 */
export function sanitizeLLMText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    // Remove null bytes and control characters (except newlines and tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove zero-width characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive blank lines (more than 2)
    .replace(/\n{3,}/g, '\n\n')
    // Collapse multiple spaces (but preserve single newlines)
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .join('\n')
    // Final trim
    .trim();
}

/**
 * Extract JSON from LLM response that might have markdown code blocks
 * Handles various formats: raw JSON, ```json blocks, or mixed text
 */
export function extractJSON(text: string): string {
  if (!text) return '{}';
  
  // Try to find JSON in markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  
  // Try to find JSON between curly braces or square brackets
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  
  // Return original text as fallback
  return text.trim();
}

/**
 * Safe JSON parsing with error recovery
 * Attempts to fix common JSON issues before parsing
 */
export function parseJSONSafely<T>(
  text: string, 
  schema?: z.ZodSchema<T>,
  fallback?: T
): T | null {
  try {
    // Extract JSON from potentially messy response
    const jsonStr = extractJSON(text);
    
    // Try to fix common JSON issues
    const fixed = jsonStr
      // Replace single quotes with double quotes (but not within strings)
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
      // Remove trailing commas
      .replace(/,\s*([}\]])/g, '$1')
      // Escape unescaped quotes in string values (basic attempt)
      .replace(/:(\s*)"([^"]*)"([^",}\]]*[^",}\]\s]+[^",}\]]*)"([^"]*)"(\s*[,}\]])/g, ':"$2\\"$3\\"$4"$5');
    
    const parsed = JSON.parse(fixed);
    
    // Validate with Zod schema if provided
    if (schema) {
      return schema.parse(parsed);
    }
    
    return parsed as T;
  } catch (error) {
    console.warn('[parseJSONSafely] Failed to parse JSON:', error);
    
    // Try one more time with just the basic cleanup
    try {
      const basicClean = text
        .replace(/^[^{[]*/, '') // Remove everything before first { or [
        .replace(/[^}\]]*$/, '') // Remove everything after last } or ]
        .trim();
      
      const parsed = JSON.parse(basicClean);
      
      if (schema) {
        return schema.parse(parsed);
      }
      
      return parsed as T;
    } catch {
      return fallback ?? null;
    }
  }
}

/**
 * Remove markdown formatting from text
 * Useful for plain text extraction from markdown-formatted responses
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';
  
  return text
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[\s]*[-*_]{3,}[\s]*$/gm, '')
    // Remove lists markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Clean up
    .trim();
}

/**
 * Truncate text to a maximum length while preserving word boundaries
 */
export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (!text || text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength - suffix.length);
  const lastSpace = truncated.lastIndexOf(' ');
  
  // Try to break at word boundary
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + suffix;
  }
  
  return truncated + suffix;
}

/**
 * Validate and sanitize conversation title
 * Ensures title is appropriate for display
 */
export function sanitizeTitle(title: string): string {
  if (!title) return 'New Conversation';
  
  // Remove quotes if wrapped
  const cleaned = title
    .replace(/^["']|["']$/g, '')
    .trim();
  
  // Apply general sanitization
  const sanitized = sanitizeLLMText(cleaned);
  
  // Remove any remaining markdown
  const plain = stripMarkdown(sanitized);
  
  // Truncate if too long
  const truncated = truncateText(plain, 100, '...');
  
  // Fallback if result is empty
  return truncated || 'New Conversation';
}

/**
 * Create a safe parser for a specific schema with fallback
 */
export function createSafeParser<T>(
  schema: z.ZodSchema<T>,
  fallback: T
): (text: string) => T {
  return (text: string) => {
    try {
      const jsonStr = extractJSON(text);
      const parsed = JSON.parse(jsonStr);
      return schema.parse(parsed);
    } catch (error) {
      console.warn('[SafeParser] Validation failed, using fallback:', error);
      return fallback;
    }
  };
}
