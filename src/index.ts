interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Dictionary MCP — wraps Free Dictionary API (free, no auth)
 *
 * Tools:
 * - define_word: definitions, phonetics, part of speech, and usage examples
 * - get_synonyms: synonyms and antonyms extracted from the same endpoint
 */


const BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

type DictionaryEntry = {
  word: string;
  phonetic?: string;
  phonetics: { text?: string; audio?: string }[];
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
      synonyms: string[];
      antonyms: string[];
    }[];
    synonyms: string[];
    antonyms: string[];
  }[];
};

const tools: McpToolExport['tools'] = [
  {
    name: 'define_word',
    description:
      'Look up a word in the dictionary. Returns definitions, phonetics, part of speech, and usage examples.',
    inputSchema: {
      type: 'object',
      properties: {
        word: { type: 'string', description: 'The word to look up' },
      },
      required: ['word'],
    },
  },
  {
    name: 'get_synonyms',
    description:
      'Get synonyms and antonyms for a word.',
    inputSchema: {
      type: 'object',
      properties: {
        word: { type: 'string', description: 'The word to find synonyms/antonyms for' },
      },
      required: ['word'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'define_word':
      return defineWord(args.word as string);
    case 'get_synonyms':
      return getSynonyms(args.word as string);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function fetchWord(word: string): Promise<DictionaryEntry[]> {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(word.trim().toLowerCase())}`);
  if (res.status === 404) throw new Error(`Word not found: "${word}"`);
  if (!res.ok) throw new Error(`Dictionary API error: ${res.status}`);
  return (await res.json()) as DictionaryEntry[];
}

async function defineWord(word: string) {
  const entries = await fetchWord(word);
  const entry = entries[0];

  const phonetic =
    entry.phonetic ??
    entry.phonetics.find((p) => p.text)?.text ??
    null;

  const meanings = entry.meanings.map((m) => ({
    part_of_speech: m.partOfSpeech,
    definitions: m.definitions.slice(0, 3).map((d) => ({
      definition: d.definition,
      example: d.example ?? null,
    })),
  }));

  return {
    word: entry.word,
    phonetic,
    meanings,
  };
}

async function getSynonyms(word: string) {
  const entries = await fetchWord(word);

  const synonyms = new Set<string>();
  const antonyms = new Set<string>();

  for (const entry of entries) {
    for (const meaning of entry.meanings) {
      for (const s of meaning.synonyms) synonyms.add(s);
      for (const a of meaning.antonyms) antonyms.add(a);
      for (const def of meaning.definitions) {
        for (const s of def.synonyms) synonyms.add(s);
        for (const a of def.antonyms) antonyms.add(a);
      }
    }
  }

  return {
    word: entries[0].word,
    synonyms: Array.from(synonyms),
    antonyms: Array.from(antonyms),
  };
}

export default { tools, callTool } satisfies McpToolExport;
