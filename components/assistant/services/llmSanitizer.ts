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
 * Remove markdown formatting from text while preserving paragraph structure
 * Useful for plain text extraction from markdown-formatted responses
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';
  
  // Process line by line to preserve structure
  const lines = text.split('\n');
  const processedLines = lines.map((line, index) => {
    // Skip empty lines to preserve paragraph breaks
    if (!line.trim()) return '';
    
    // Check if this line is a list item
    const isList = /^[\s]*[-*+•]\s+/.test(line) || /^[\s]*\d+\.\s+/.test(line);
    
    // Process each line
    const processed = line
      // Remove headers but keep the text
      .replace(/^#{1,6}\s+/g, '')
      // Remove bold/italic
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      // Remove blockquotes
      .replace(/^>\s+/g, '')
      // Convert list markers to bullets
      .replace(/^(\s*)[-*+]\s+/g, '$1• ')
      .replace(/^(\s*)\d+\.\s+/g, '$1')
      // Trim the line
      .trim();
    
    // Add extra line break after list items for better spacing
    if (isList && index < lines.length - 1) {
      const nextLine = lines[index + 1];
      const nextIsList = nextLine && (/^[\s]*[-*+•]\s+/.test(nextLine) || /^[\s]*\d+\.\s+/.test(nextLine));
      // If next line is NOT a list item, add spacing
      if (!nextIsList && nextLine.trim()) {
        return processed + '\n';
      }
    }
    
    return processed;
  });
  
  // Remove code blocks entirely (multiline)
  const withoutCodeBlocks = processedLines
    .join('\n')
    .replace(/```[\s\S]*?```/g, '')
    // Remove horizontal rules
    .replace(/^[\s]*[-*_]{3,}[\s]*$/gm, '')
    // Collapse excessive newlines (more than 2)
    .replace(/\n{3,}/g, '\n\n');
  
  return withoutCodeBlocks.trim();
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
